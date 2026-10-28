import type Phaser from 'phaser';
import { JOB_GIVERS, JOB_INFO, type JobKind } from '../../data/jobs';
import { closest, type Point } from '../../logic/geometry';
import { canEnter } from '../../logic/vehicleState';
import { FARE_CHOICE } from './FareSystem';
import { inputLocked, uiStore, type JobOffer } from '../../store/uiStore';
import { audio } from '../audio';
import type { WorldScene } from '../scenes/WorldScene';

interface Beacon {
  /** NPC id or vehicle id. */
  id: string;
  kind: JobKind;
  who: string;
  /** Where the giver stands (null while unavailable, e.g. an auto someone is driving). */
  at: () => Point | null;
  /** How far above that spot the "!" floats. */
  lift: number;
  img: Phaser.GameObjects.Image;
}

/** How close (px) you must be for a giver to pitch their job. Autos pitch only when you can hop in. */
const OFFER_RADIUS = 60;
const AUTO_OFFER_RADIUS = 46;
/** After "Not now", that giver stays quiet this long (ms). */
const SNOOZE = 120_000;

/**
 * Makes jobs findable: a bouncing "!" over every job giver (delivery riders, the recruiter, each
 * borrowable auto), a pitch card when you walk up to one, and the nearest of each for Find.
 */
export class JobSystem {
  private beacons: Beacon[] = [];
  private bob = { y: 0 };
  private snoozed = new Map<string, number>();
  private checkIn = 0;

  constructor(private scene: WorldScene) {
    if (!scene.textures.exists('jobmark')) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x1c1726).fillCircle(9, 9, 9);
      g.fillStyle(0xfcc419).fillCircle(9, 9, 7.5);
      g.fillStyle(0x1c1726).fillRect(8, 3, 2, 8).fillRect(8, 12.5, 2, 2.5);
      g.generateTexture('jobmark', 18, 18);
      g.destroy();
    }
    scene.tweens.add({ targets: this.bob, y: -4, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const mark = () => scene.add.image(0, 0, 'jobmark').setDepth(8400).setVisible(false);
    for (const g of JOB_GIVERS) {
      const npc = scene.npcs.byId(g.npc);
      if (npc) this.beacons.push({ id: g.npc, kind: g.kind, who: npc.name, at: () => ({ x: npc.x, y: npc.y }), lift: 30, img: mark() });
    }
    for (const v of scene.vehicles.list)
      if (v.def.type === 'auto') this.beacons.push({ id: v.def.id, kind: 'fares', who: v.def.name, at: () => (v.occupied ? null : { x: v.sprite.x, y: v.sprite.y }), lift: 18, img: mark() });
  }

  /** Is this kind of job already under way (so its givers stay quiet)? */
  private busy(kind: JobKind) {
    const s = this.scene;
    if (kind === 'delivery') return s.deliveries.busy;
    if (kind === 'fares') return s.mode.kind !== 'walk';
    return false;
  }

  update(now: number) {
    const s = this.scene;
    const view = s.cameras.main.worldView;
    for (const b of this.beacons) {
      const p = b.at();
      const show = !!p && !this.busy(b.kind) && !s.travelling && view.contains(p.x, p.y);
      b.img.setVisible(show);
      if (show) b.img.setPosition(p!.x, p!.y - b.lift + this.bob.y);
    }
    if (now < this.checkIn) return;
    this.checkIn = now + 250;
    this.offerNearby(now);
  }

  /** Pitch the job of the giver you're standing next to (once, until you walk away or snooze it). */
  private offerNearby(now: number) {
    const s = this.scene;
    const current = uiStore.get().jobOffer;
    const f = s.playerFeet();
    const near =
      s.mode.kind === 'walk' && !inputLocked()
        ? this.beacons.find((b) => {
            const p = b.at();
            const r = b.kind === 'fares' ? AUTO_OFFER_RADIUS : OFFER_RADIUS;
            return p && !this.busy(b.kind) && (this.snoozed.get(b.id) ?? 0) < now && Math.hypot(p.x - f.x, p.y - f.y) < r;
          })
        : undefined;
    if (!near) {
      if (current && current.id !== FARE_CHOICE) uiStore.set({ jobOffer: null });
      return;
    }
    if (current?.id === near.id) return;
    const info = JOB_INFO[near.kind];
    const offer: JobOffer = { id: near.id, kind: near.kind, title: info.name, who: near.who, body: info.pitch, cta: info.cta, alt: near.kind === 'fares' ? 'Just drive' : undefined };
    uiStore.set({ jobOffer: offer });
    audio.chime('hint');
  }

  /** Start the offered job; `alt` is the card's second choice (for autos, "Just drive"). */
  accept(id: string, alt = false) {
    const s = this.scene;
    if (id === FARE_CHOICE) {
      s.fares.setDuty(alt ? 'drive' : 'earn');
      return;
    }
    const b = this.beacons.find((x) => x.id === id);
    uiStore.set({ jobOffer: null });
    if (!b) return;
    this.snoozed.set(id, s.clock + 5000);
    if (b.kind === 'delivery') s.deliveries.start();
    else if (b.kind === 'quiz') {
      const npc = s.npcs.byId(id);
      if (npc) s.talk.open(npc);
    } else {
      const v = s.vehicles.byId(id);
      const f = s.playerFeet();
      if (v && canEnter(s.mode, v.info(), f.x, f.y)) {
        s.fares.preset = alt ? 'drive' : 'earn';
        s.vehicles.enter(v);
      }
      else if (v) uiStore.toast({ kind: 'hint', title: 'Walk up to the auto', body: 'Then press E to get in.' }, 2600);
    }
  }

  snooze(id: string) {
    if (id === FARE_CHOICE) {
      this.scene.fares.setDuty('drive');
      return;
    }
    this.snoozed.set(id, this.scene.clock + SNOOZE);
    uiStore.set({ jobOffer: null });
  }

  /** The nearest giver of each kind of job that's open right now, for Find. */
  nearest(): Array<{ kind: JobKind; label: string; at: Point; distance: number }> {
    const f = this.scene.playerFeet();
    const kinds: JobKind[] = ['delivery', 'fares', 'quiz'];
    return kinds.flatMap((kind) => {
      const spots = this.beacons.flatMap((b) => {
        const p = b.at();
        return b.kind === kind && p ? [{ x: p.x, y: p.y, label: b.who }] : [];
      });
      const best = this.busy(kind) ? null : closest(spots, f);
      return best ? [{ kind, label: best.item.label, at: { x: best.item.x, y: best.item.y }, distance: best.distance }] : [];
    });
  }

  /** Where the beacons are, for the minimap. */
  spots(): Point[] {
    return this.beacons.flatMap((b) => {
      const p = b.at();
      return p && !this.busy(b.kind) ? [p] : [];
    });
  }
}
