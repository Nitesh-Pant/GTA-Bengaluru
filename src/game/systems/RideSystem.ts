import Phaser from 'phaser';
import { G, groundAt } from '../../data/map';
import { CAPTAINS, rideDestinations, type RideDest } from '../../data/rides';
import { ROAD_GRID, type TrafficType } from '../../data/roads';
import { pathLength, planRide } from '../../logic/bikeRide';
import { pointAt } from '../../logic/metro';
import { boxHitsSolids } from '../../logic/geometry';
import { mulberry32, pick } from '../../logic/rng';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { TILE } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

const SPEED = 240;
/** Chance the first captain cancels, because of course. */
const CANCEL_CHANCE = 0.3;

/** Rapido-style bike taxi: book, (maybe) get cancelled on, ride pillion along the main roads. */
export class RideSystem {
  private rng = mulberry32(31);
  /** The one booked pickup (a Rapido or a bus): `arrive` runs at `at` if you're still on foot, else `missed`. */
  private pending: { at: number; arrive: () => void; missed: () => void } | null = null;
  private bike: Phaser.GameObjects.Image | null = null;

  constructor(private scene: WorldScene) {}

  get busy() {
    return this.pending !== null || this.bike !== null;
  }

  open() {
    const s = this.scene;
    if (s.locked || s.mode.kind !== 'walk') return;
    if (this.busy) {
      uiStore.toast({ kind: 'info', title: 'Ride already booked', body: 'Your captain is on the way. Swalpa wait maadi.' });
      return;
    }
    uiStore.set({ panel: 'ride' });
  }

  /** Book the single pickup slot shared by Rapido and buses. */
  schedule(etaMs: number, arrive: () => void, missed: () => void) {
    this.pending = { at: this.scene.clock + etaMs, arrive, missed };
  }

  book(destId: string) {
    uiStore.set({ panel: null });
    const dest = rideDestinations(this.scene.destination).find((d) => d.id === destId);
    if (!dest || this.busy) return;
    const captain = pick(CAPTAINS, this.rng);
    const missed = (c: string) => () => uiStore.toast({ kind: 'info', title: `Captain ${c} couldn't find you`, body: 'Ride cancelled. Press R (or Ride) to book again.' });
    const arrive = () => this.start(dest, captain);
    if (this.rng() < CANCEL_CHANCE) {
      // Of course the first captain cancels.
      const next = pick(CAPTAINS.filter((c) => c !== captain), this.rng);
      this.schedule(
        2500,
        () => {
          uiStore.toast({ kind: 'info', title: `Captain ${captain} cancelled`, body: `"Traffic jaasti, saar." Finding another captain… ${next} accepted!` }, 4200);
          this.schedule(3200, () => this.start(dest, next), missed(next));
        },
        missed(captain),
      );
    } else this.schedule(2500, arrive, missed(captain));
    uiStore.toast({ kind: 'info', title: `Rapido booked: ${dest.name}`, body: `Captain ${captain} is 2 minutes away. "On the way, saar!"` });
    audio.chime('ui');
  }

  update(now: number) {
    const p = this.pending;
    if (!p || now < p.at) return;
    this.pending = null;
    const s = this.scene;
    if (s.mode.kind !== 'walk' || s.locked) p.missed();
    else p.arrive();
  }

  private start(dest: RideDest, captain: string) {
    const path = planRide(this.scene.playerFeet(), dest, ROAD_GRID);
    uiStore.toast({ kind: 'arrive', title: `Captain ${captain} has arrived`, body: '"OTP heli, saar." You read out four digits. Helmet on, off you go!' });
    const here = this.scene.playerFeet();
    this.scene.talk.voice('announce:rapido', 'm', here.x, here.y, this.scene.clock, 1, true);
    const end = path[path.length - 1];
    // Drop off on the pavement on the destination's side of the road.
    const drop = this.freeSpot(end.x, end.y + (dest.y < end.y ? -2.7 : 2.7) * TILE);
    this.travel(path, { texture: 'veh_scooter_3', sound: 'scooter', speed: SPEED, label: 'a Rapido', drop }, () => {
      this.scene.stats.rides++;
      uiStore.toast({ kind: 'arrive', title: `Reached ${dest.name}`, body: `Captain ${captain}: "Five star kodi, please!"` }, 3600);
    });
  }

  /** Plan a road route from the player to `to` (used by buses too). */
  route(to: { x: number; y: number }, from = this.scene.playerFeet()) {
    return planRide(from, to, ROAD_GRID);
  }

  /**
   * Carry the hidden player along `path` on a vehicle sprite (camera follows), then set them down at
   * `drop` on foot. Shared by the Rapido bike taxi and BMTC buses.
   */
  travel(path: Array<{ x: number; y: number }>, opts: { texture: string; sound: TrafficType; speed: number; label: string; drop: { x: number; y: number } }, arrived: () => void) {
    const s = this.scene;
    s.mode = { kind: 'ride' };
    uiStore.set({ mode: 'ride', vehicleName: opts.label });
    const body = s.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
    s.player.setVisible(false);
    s.player.anims.stop();
    this.bike = s.add.image(path[0].x, path[0].y, opts.texture).setDepth(path[0].y + 8);
    audio.engine(0.5, opts.sound);
    const ride = { d: 0 };
    const total = pathLength(path);
    s.tweens.add({
      targets: ride,
      d: total,
      duration: Math.max(2500, (total / opts.speed) * 1000),
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const q = pointAt(path, ride.d);
        this.bike?.setPosition(q.x, q.y).setRotation(q.angle).setDepth(q.y + 8);
        s.player.setPosition(q.x, q.y);
      },
      onComplete: () => {
        audio.engine(null);
        s.cameras.main.fadeOut(180, 20, 16, 30);
        s.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.bike?.destroy();
          this.bike = null;
          s.player.setPosition(opts.drop.x, opts.drop.y).setVisible(true);
          body.enable = true;
          body.reset(opts.drop.x, opts.drop.y);
          s.mode = { kind: 'walk' };
          uiStore.set({ mode: 'walk', vehicleName: null });
          audio.chime('arrive');
          s.cameras.main.fadeIn(220, 20, 16, 30);
          arrived();
          s.persist();
        });
      },
    });
  }

  /** Nearest walkable, non-road spot to (x, y). */
  freeSpot(x: number, y: number) {
    const s = this.scene;
    for (let r = 0; r <= 12; r++)
      for (const dx of r ? [r * 8, -r * 8] : [0])
        for (const dy of [0, -6, 6]) {
          const px = x + dx;
          const py = y + dy;
          if (groundAt(s.ground, px, py) !== G.Road && !boxHitsSolids(px, py - 3, 5, 4, s.solids) && s.vehicles.spotFree(px, py)) return { x: px, y: py };
        }
    return { x, y };
  }
}
