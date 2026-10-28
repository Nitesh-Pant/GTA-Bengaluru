import Phaser from 'phaser';
import { BUILDINGS, PROPS } from '../../data/map';
import { darkness, formatClock, isRushHour, MINUTES_PER_SECOND, periodOf, tint, wrapMinutes } from '../../logic/dayClock';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { t, TILE } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

/** Building styles that keep a light on at night. */
const LIT = new Set(['shop', 'cafe', 'pub', 'darshini', 'mall', 'metro', 'office', 'kiosk', 'temple']);

/**
 * The city clock and its lighting: a screen tint for dawn, dusk and night, plus additive glows for
 * streetlamps, shopfronts and headlights that fade in as it gets dark.
 */
export class DayNightSystem {
  minutes: number;
  /** Days since you arrived (for IPL nights). */
  day = 0;
  private powerCut = false;
  private overlay: Phaser.GameObjects.Graphics;
  private glows: Array<{ img: Phaser.GameObjects.Image; strength: number }> = [];
  private headlights: Phaser.GameObjects.Image[] = [];
  private shownSlot = -1;
  private tintKey = '';
  private glowLevel = -1;
  private glowLit = false;
  private cullT = 0;
  private headlightsShown = 0;

  constructor(
    private scene: WorldScene,
    startMinutes: number,
  ) {
    this.minutes = wrapMinutes(startMinutes);
    this.overlay = scene.add.graphics().setScrollFactor(0).setDepth(8900);
    const glow = (x: number, y: number, scale: number, color: number, strength: number) => {
      const img = scene.add.image(x, y, 'glow').setScale(scale).setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(8950).setVisible(false);
      this.glows.push({ img, strength });
    };
    for (const p of PROPS) if (p.kind === 'lamp') glow(t(p.x) + 3, t(p.y) - 24, 1.5, 0xffe8a3, 0.85);
    for (const b of BUILDINGS)
      if (LIT.has(b.style)) glow(t(b.x + b.w / 2), t(b.y + b.h) + 2, Math.min(2.6, (b.w * TILE) / 64), 0xffc878, 0.55);
    for (const b of BUILDINGS) {
      if (b.style === 'vidhana') for (let k = 0; k < 6; k++) glow(t(b.x) + ((k + 0.5) * b.w * TILE) / 6, t(b.y + b.h) - 40, 1.8, 0xfff3bf, 0.75);
      if (b.style === 'pandal') [0xff6b6b, 0xffd43b, 0x69db7c].forEach((col, k) => glow(t(b.x) + ((k + 1) * b.w * TILE) / 4, t(b.y + b.h) - 24, 1.4, col, 0.8));
    }
    const vehicles = scene.traffic.cars.length + scene.vehicles.list.length;
    for (let i = 0; i < vehicles; i++)
      this.headlights.push(scene.add.image(0, 0, 'glow').setScale(0.7, 0.45).setTint(0xfff3bf).setBlendMode(Phaser.BlendModes.ADD).setDepth(8950).setVisible(false));
  }

  /** Jump to a time of day; the HUD clock updates straight away, even while paused. */
  setMinutes(m: number) {
    this.minutes = wrapMinutes(m);
    this.publish();
  }

  /** Lamps and shopfronts go dark (headlights stay on) and every inverter starts humming. */
  setPowerCut(on: boolean) {
    this.powerCut = on;
    audio.setInverter(on);
  }

  /** Push the HUD clock (10-minute steps). */
  private publish() {
    this.shownSlot = Math.floor(this.minutes / 10);
    uiStore.set({ clock: { label: formatClock(this.shownSlot * 10), period: periodOf(this.minutes), rush: isRushHour(this.minutes) } });
  }

  update(dt: number) {
    const before = this.minutes;
    this.minutes = wrapMinutes(this.minutes + dt * MINUTES_PER_SECOND);
    if (this.minutes < before) this.day++;
    if (Math.floor(this.minutes / 10) !== this.shownSlot) this.publish();
    const cam = this.scene.cameras.main;
    const d = darkness(this.minutes);
    const { color, alpha: base } = tint(this.minutes);
    const alpha = Math.round(Math.min(0.85, base + (this.powerCut ? 0.18 * d : 0)) * 200) / 200;
    // The tint only needs redrawing when it (or the screen size) actually changes.
    const tintKey = `${color}:${alpha}:${cam.width}x${cam.height}`;
    if (tintKey !== this.tintKey) {
      this.tintKey = tintKey;
      this.overlay.clear();
      if (alpha > 0.01) this.overlay.fillStyle(color, alpha).fillRect(0, 0, cam.width, cam.height);
    }
    // Lamps and shopfronts: refresh on a change of light, and a few times a second to show only what's near the camera.
    const lit = d > 0.02 && !this.powerCut;
    const level = Math.round(d * 100);
    this.cullT -= dt;
    if (level !== this.glowLevel || lit !== this.glowLit || (lit && this.cullT <= 0)) {
      this.cullT = 0.25;
      const view = cam.worldView;
      for (const g of this.glows) {
        const near = g.img.x > view.x - 120 && g.img.x < view.right + 120 && g.img.y > view.y - 120 && g.img.y < view.bottom + 120;
        g.img.setVisible(lit && near);
        if (level !== this.glowLevel) g.img.setAlpha(d * g.strength);
      }
      this.glowLevel = level;
      this.glowLit = lit;
    }
    // Headlights follow every active vehicle after dark.
    let i = 0;
    if (d > 0.02) {
      const shine = (x: number, y: number, heading: number, ahead: number) => {
        const h = this.headlights[i++];
        if (!h) return;
        h.setVisible(true)
          .setAlpha(d * 0.8)
          .setRotation(heading)
          .setPosition(x + Math.cos(heading) * ahead, y + Math.sin(heading) * ahead);
      };
      for (const c of this.scene.traffic.cars) if (c.active) shine(c.sprite.x, c.sprite.y, c.logic.heading, c.logic.halfLen + 14);
      const v = this.scene.vehicles.driving();
      if (v) shine(v.sprite.x, v.sprite.y, v.heading, v.def.halfLen + 14);
    }
    for (let k = i; k < this.headlightsShown; k++) this.headlights[k].setVisible(false);
    this.headlightsShown = i;
  }
}
