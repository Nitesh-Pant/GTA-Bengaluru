import type Phaser from 'phaser';
import { audio } from '../audio';
import { t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

/** Runway centre line and ends (tiles), on the south side of NH 44. */
const RUNWAY_Y = 73;
const ROLL_FROM = 167;
const LIFT_OFF = 184;
const ROLL_MS = 7000;
const CLIMB_MS = 3500;

/**
 * Kempegowda Airport: a plane parked on the apron and, every minute or so, one rolling down the
 * runway, lifting off over the vineyards (its shadow falling behind) and climbing out of sight.
 */
export class AirportSystem {
  private plane: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private nextAt: number;
  private startAt = -1;

  constructor(private scene: WorldScene) {
    scene.add.image(t(178), t(66.5), 'plane').setDepth(t(66.5) + 20).setFlipX(true);
    this.shadow = scene.add.image(0, 0, 'plane_shadow').setVisible(false);
    this.plane = scene.add.image(0, 0, 'plane').setVisible(false);
    this.nextAt = scene.clock + 8000;
  }

  update(now: number) {
    if (this.startAt < 0) {
      if (now < this.nextAt) return;
      this.startAt = now;
      const p = this.scene.playerFeet();
      const d = Math.hypot(p.x - t(LIFT_OFF), p.y - t(RUNWAY_Y));
      audio.jet(Math.max(0, 1 - d / t(45)), (t(LIFT_OFF) - p.x) / 400);
    }
    const k = now - this.startAt;
    if (k > ROLL_MS + CLIMB_MS) {
      this.plane.setVisible(false);
      this.shadow.setVisible(false);
      this.startAt = -1;
      this.nextAt = now + 50000 + Math.random() * 30000;
      return;
    }
    const y = t(RUNWAY_Y);
    let x: number;
    let lift = 0;
    if (k < ROLL_MS) {
      const r = k / ROLL_MS;
      x = t(ROLL_FROM) + (t(LIFT_OFF) - t(ROLL_FROM)) * r * r; // accelerating roll
    } else {
      const c = (k - ROLL_MS) / CLIMB_MS;
      x = t(LIFT_OFF) + t(14) * c + t(6) * c * c;
      lift = c;
    }
    // Climbing: the plane rises (up the screen and larger) while its shadow stays on the ground.
    this.shadow.setVisible(true).setPosition(x + lift * 30, y + 4).setAlpha(1 - lift);
    this.plane
      .setVisible(true)
      .setPosition(x, y - lift * 70)
      .setScale(1 + lift * 0.7)
      .setAlpha(1 - lift * lift)
      .setDepth(lift > 0 ? 8600 : y + 20);
  }
}
