import Phaser from 'phaser';
import { PARKED } from '../../data/vehicles';
import { FLAG_FRAMES, paintProp } from '../art/props';
import { t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

/** Big Kannada flags on poles (tiles, pole base): only at a few proud spots, not everywhere. */
const FLAGPOLES: Array<[number, number]> = [
  [12, 161.7], // Vidhana Soudha, either side of the steps
  [28, 161.7],
  [93, 17.4], // Marathahalli circle
  [126.6, 106.9], // Silk Board
  [98.6, 81.8], // KR Puram auto stand
  [171, 28.6], // Nandi Hills, by Sunrise Point
];

/** Big flag pole height (px), for hanging bunting from the tops. */
const POLE_TOP = 44;

type Ride = Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Visible;

/**
 * The red-and-yellow Kannada flag, all year round: waving on poles at Vidhana Soudha (with bunting
 * between them and a "Siri gannadam gelge" banner), a few junction circles, the KR Puram auto stand
 * and Nandi Hills, and on about half the city's autos, streaming behind as they drive.
 */
export class FlagSystem {
  private flags: Phaser.GameObjects.Image[] = [];
  private autoFlags: Array<{ img: Phaser.GameObjects.Image; ride: Ride; on: () => boolean }> = [];

  constructor(private scene: WorldScene) {
    const s = scene;
    for (const [x, y] of FLAGPOLES) this.flags.push(s.add.image(t(x), t(y), 'kflag', 0).setOrigin(2 / 30, 1).setDepth(t(y)));
    // Vidhana Soudha: bunting slung between the two poles, and a banner.
    this.bunting(t(12) + 2, t(28) + 2, t(161.7) - POLE_TOP + 2);
    // KR Puram auto stand: a short string over the stand.
    this.bunting(t(98.6) + 2, t(112.5), t(81.8) - POLE_TOP + 2, true);
    const text = 'SIRI GANNADAM GELGE';
    const key = `banner_${text}`;
    if (!s.textures.exists(key)) s.textures.addCanvas(key, paintProp('hoarding', text));
    s.add.image(t(20), t(163.2), key).setOrigin(0.5, 1).setDepth(t(163.2));
    // About half the autos fly one: every other traffic auto, Raju's, and the autos at his stand.
    s.traffic.cars.filter((c) => c.spawn.type === 'auto').forEach((c, i) => i % 2 === 0 && this.follow(c.sprite, () => c.active));
    for (const v of s.vehicles.list) if (v.def.id === 'rajuauto' || v.def.id === 'auto_mg') this.follow(v.sprite, () => true);
    for (const p of PARKED)
      if (p.type === 'auto') {
        const back = Math.cos(p.heading) > 0;
        this.flags.push(s.add.image(t(p.x) - Math.cos(p.heading) * 7, t(p.y) + 2, 'kflag_s', 0).setFlipX(back).setOrigin(back ? 1 - 2 / 13 : 2 / 13, 1).setDepth(t(p.y) + 12));
      }
  }

  /** A sagging string of little red and yellow pennants between two points (and a pole at the far end). */
  private bunting(x0: number, x1: number, y: number, endPole = false) {
    const g = this.scene.add.graphics().setDepth(y + POLE_TOP + 4);
    if (endPole) g.fillStyle(0x868e96, 1).fillRect(x1 - 1, y - 2, 2, POLE_TOP);
    const sag = Math.min(18, (x1 - x0) * 0.08);
    const at = (k: number) => ({ x: x0 + (x1 - x0) * k, y: y + Math.sin(k * Math.PI) * sag });
    g.lineStyle(1, 0x495057, 0.9);
    for (let i = 0; i < 24; i++) g.lineBetween(at(i / 24).x, at(i / 24).y, at((i + 1) / 24).x, at((i + 1) / 24).y);
    const n = Math.max(4, Math.round((x1 - x0) / 9));
    for (let i = 1; i < n; i++) {
      const p = at(i / n);
      g.fillStyle(i % 2 ? 0xfcc419 : 0xe03131, 1).fillTriangle(p.x - 3, p.y, p.x + 3, p.y, p.x, p.y + 6);
    }
  }

  private follow(ride: Ride, on: () => boolean) {
    this.autoFlags.push({ img: this.scene.add.image(0, 0, 'kflag_s', 0).setVisible(false), ride, on });
  }

  /** Flags flutter (a frame every 140 ms); auto flags ride at the back of their auto, streaming behind. */
  update(now: number) {
    const frame = Math.floor(now / 140) % FLAG_FRAMES;
    for (const f of this.flags) f.setFrame(frame);
    const view = this.scene.cameras.main.worldView;
    for (const a of this.autoFlags) {
      const r = a.ride;
      const show = a.on() && r.visible && view.contains(r.x, r.y);
      a.img.setVisible(show);
      if (!show) continue;
      const cos = Math.cos(r.rotation);
      const sin = Math.sin(r.rotation);
      const trailing = cos > 0;
      a.img
        .setFrame(frame)
        .setPosition(r.x - cos * 7, r.y - sin * 7 + 2)
        .setFlipX(trailing)
        .setOrigin(trailing ? 1 - 2 / 13 : 2 / 13, 1)
        .setDepth(r.y + 12);
    }
  }
}
