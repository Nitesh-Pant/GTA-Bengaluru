import Phaser from 'phaser';
import { STATIONS } from '../../data/metro';
import { METRO_TRACK } from '../../data/roads';
import { destinationsFrom, planTrip, pointAt } from '../../logic/metro';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import type { WorldScene } from '../scenes/WorldScene';

/** Station UI, in-world train rides along the viaduct, and ambient trains. */
export class MetroSystem {
  readonly train: Phaser.GameObjects.Image;
  private ride: { tween: Phaser.Tweens.Tween } | null = null;
  private ambientAt = 9000;
  private ambient: Phaser.Tweens.Tween | null = null;

  constructor(private scene: WorldScene) {
    this.train = scene.add.image(-500, -500, 'train').setDepth(8001).setVisible(false);
  }

  get travelling() {
    return this.ride !== null;
  }

  stationNear(x: number, y: number, radius = 30) {
    return STATIONS.find((s) => Math.hypot(s.entrance.x - x, s.entrance.y - y) <= radius);
  }

  open(stationId: string) {
    const st = STATIONS.find((s) => s.id === stationId);
    if (!st) return;
    const dests = destinationsFrom(STATIONS, st.id).map((d) => {
      const plan = planTrip(STATIONS, METRO_TRACK, st.id, d.id);
      return { id: d.id, name: d.name, minutes: Math.max(2, Math.round((plan?.durationMs ?? 4000) / 1000)) };
    });
    uiStore.set({ metro: { stationId: st.id, stationName: st.name, destinations: dests, travelling: null } });
    this.scene.react({ type: 'metro_enter', x: st.entrance.x, y: st.entrance.y });
    audio.chime('ui');
  }

  cancel() {
    if (this.ride) return; // can't cancel once the doors have closed
    uiStore.set({ metro: null });
  }

  travel(toId: string) {
    const ui = uiStore.get().metro;
    if (!ui || this.ride) return;
    const plan = planTrip(STATIONS, METRO_TRACK, ui.stationId, toId);
    if (!plan) return;
    const s = this.scene;
    this.ambient?.stop();
    this.ambient = null;
    uiStore.set({ metro: { ...ui, travelling: plan.to.name }, mode: 'metro' });
    s.mode = { kind: 'metro', from: plan.from.id, to: plan.to.id };
    const pb = s.player.body as Phaser.Physics.Arcade.Body;
    pb.setVelocity(0, 0);
    pb.enable = false;
    s.player.setVisible(false);
    audio.chime('metro');
    const here = s.playerFeet();
    s.talk.voice('announce:metro', null, here.x, here.y, s.clock, 1, true);
    const start = pointAt(METRO_TRACK, plan.startAlong);
    this.train.setPosition(start.x, start.y).setVisible(true).setFlipX(plan.endAlong < plan.startAlong);
    s.cameras.main.startFollow(this.train, true, 0.08, 0.08);
    const obj = { along: plan.startAlong };
    const tween = s.tweens.add({
      targets: obj,
      along: plan.endAlong,
      duration: plan.durationMs,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const p = pointAt(METRO_TRACK, obj.along);
        this.train.setPosition(p.x, p.y);
      },
      onComplete: () => this.arrive(plan.to.id),
    });
    this.ride = { tween };
  }

  private arrive(stationId: string) {
    const s = this.scene;
    const st = STATIONS.find((x) => x.id === stationId)!;
    s.cameras.main.fadeOut(220, 20, 16, 30);
    s.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.train.setVisible(false);
      this.ride = null;
      s.player.setPosition(st.exit.x, st.exit.y);
      const pb = s.player.body as Phaser.Physics.Arcade.Body;
      pb.enable = true;
      pb.reset(st.exit.x, st.exit.y);
      s.player.setVisible(true);
      s.mode = { kind: 'walk' };
      s.cameras.main.startFollow(s.player, true, 0.15, 0.15);
      s.cameras.main.centerOn(st.exit.x, st.exit.y);
      s.cameras.main.fadeIn(260, 20, 16, 30);
      s.stats.metroRides++;
      uiStore.set({ metro: null, mode: 'walk' });
      uiStore.toast({ kind: 'arrive', title: `Arrived: ${st.name}`, body: 'Mind the gap. Swalpa nodkondu hogi!' }, 3200);
      audio.chime('arrive');
      s.persist();
    });
  }

  update(_dt: number, now: number) {
    if (this.ride || this.ambient || now < this.ambientAt) return;
    // Ambient trains keep the viaduct alive.
    this.ambientAt = now + 38000 + Math.random() * 30000;
    const total = Math.hypot(METRO_TRACK[1].x - METRO_TRACK[0].x, METRO_TRACK[1].y - METRO_TRACK[0].y);
    const forward = Math.random() < 0.5;
    const obj = { along: forward ? -160 : total + 160 };
    this.train.setVisible(true).setFlipX(!forward);
    this.ambient = this.scene.tweens.add({
      targets: obj,
      along: forward ? total + 160 : -160,
      duration: 16000,
      onUpdate: () => {
        const p = pointAt(METRO_TRACK, Math.max(0, Math.min(total, obj.along)));
        const overshoot = obj.along < 0 ? obj.along : obj.along > total ? obj.along - total : 0;
        this.train.setPosition(p.x + overshoot, p.y);
      },
      onComplete: () => {
        this.train.setVisible(false);
        this.ambient = null;
      },
    });
  }
}
