import type Phaser from 'phaser';
import { NANDI_SUMMIT } from '../../data/map';
import { poiById } from '../../data/pois';
import { fogAt, isSunrise, SUNRISE_WAIT_TO } from '../../logic/nandi';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

/** How far (px) from Sunrise Point counts as watching it. */
const WATCH_RADIUS = t(5);
const SUNRISE_SHOW_MS = 14000;

/**
 * Nandi Hills: morning fog that thickens as you climb (the summit clears at sunrise), the sunrise
 * itself from Sunrise Point, and "Wait for the sunrise" for when you get there at the wrong hour.
 */
export class NandiSystem {
  private fog: Phaser.GameObjects.Graphics;
  private sky: Phaser.GameObjects.Graphics;
  private fogKey = '';
  private sunriseDay = -1;
  private showUntil = 0;
  private nudged = false;
  readonly point = poiById('sunrisepoint')!;

  constructor(private scene: WorldScene) {
    this.fog = scene.add.graphics().setScrollFactor(0).setDepth(8960);
    this.sky = scene.add.graphics().setScrollFactor(0).setDepth(8970);
  }

  /** 0 off the hill, rising to 1 anywhere on the summit plateau (Sunrise Point included). */
  private height(x: number, y: number) {
    if (this.scene.district?.id !== 'nandi') return 0;
    const e = Math.hypot((x - t(NANDI_SUMMIT.x)) / t(14), (y - t(NANDI_SUMMIT.y)) / t(6.5));
    return e <= 1 ? 1 : Math.max(0, 1 - (e - 1) / 2.2);
  }

  update(now: number) {
    const s = this.scene;
    const cam = s.cameras.main;
    const p = s.playerFeet();
    const minutes = s.dayNight.minutes;
    const fog = Math.round(fogAt(minutes, this.height(p.x, p.y)) * 50) / 50;
    const key = `${fog}:${cam.width}x${cam.height}`;
    if (key !== this.fogKey) {
      this.fogKey = key;
      this.fog.clear();
      if (fog > 0) this.fog.fillStyle(0xe9edf2, fog).fillRect(0, 0, cam.width, cam.height);
    }
    const atPoint = Math.hypot(p.x - this.point.x, p.y - this.point.y) < WATCH_RADIUS;
    if (atPoint && isSunrise(minutes) && this.sunriseDay !== s.dayNight.day) this.startSunrise(now);
    if (atPoint && !isSunrise(minutes) && !this.nudged && this.showUntil < now) {
      this.nudged = true;
      uiStore.toast({ kind: 'hint', title: 'Sunrise Point', body: 'The sun comes up here around 5:45. Press E here to sit with a chai and wait for it.' }, 5200);
    }
    if (!atPoint) this.nudged = false;
    this.drawSunrise(now);
  }

  private startSunrise(now: number) {
    const s = this.scene;
    this.sunriseDay = s.dayNight.day;
    this.showUntil = now + SUNRISE_SHOW_MS;
    s.bump('sunrises');
    audio.chime('arrive');
    uiStore.toast({ kind: 'arrive', title: 'Sunrise at Nandi Hills!', body: 'The sun climbs out of the clouds and the whole plain turns gold. Worth the 4 AM alarm.' }, 6500);
    for (const n of s.npcs.near(this.point.x, this.point.y, t(10)).slice(0, 2))
      s.talk.say(n, ['Wow… nodi nodi!', 'Bhai, photo lo jaldi!', 'This is why we came.'][Math.floor(Math.random() * 3)], now);
  }

  /** A warm sky and the sun lifting over the top of the screen while the sunrise plays. */
  private drawSunrise(now: number) {
    const g = this.sky;
    g.clear();
    if (now >= this.showUntil) return;
    const cam = this.scene.cameras.main;
    const k = 1 - (this.showUntil - now) / SUNRISE_SHOW_MS; // 0 → 1 over the show
    const fade = Math.min(1, k * 4, (1 - k) * 4);
    // Screen-fixed graphics still scale with the camera zoom around the centre, so map screen px back.
    const z = cam.zoom;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const X = (sx: number) => cx + (sx - cx) / z;
    const Y = (sy: number) => cy + (sy - cy) / z;
    const w = cam.width;
    const h = cam.height * 0.45;
    // A warm band across the top that fades downwards, in a few steps (gradients aren't on every renderer).
    for (let i = 0; i < 8; i++) g.fillStyle(0xff8c42, 0.42 * fade * (1 - i / 8)).fillRect(X(0), Y((h * i) / 8), w / z, h / 8 / z + 1);
    const sunY = cam.height * (0.22 - 0.16 * k);
    g.fillStyle(0xffe8a3, 0.35 * fade).fillCircle(X(w / 2), Y(sunY), 46 / z);
    g.fillStyle(0xfff3bf, 0.9 * fade).fillCircle(X(w / 2), Y(sunY), 24 / z);
  }

  /** "Wait for the sunrise": sit on the rock with a chai until just before dawn. */
  waitForSunrise() {
    const dn = this.scene.dayNight;
    if (isSunrise(dn.minutes)) {
      uiStore.toast({ kind: 'info', title: "It's happening!", body: 'Look up. The sun is coming over the clouds right now.' }, 3000);
      return;
    }
    if (dn.minutes > SUNRISE_WAIT_TO) dn.day++; // waiting through the night into tomorrow
    dn.setMinutes(SUNRISE_WAIT_TO);
    this.nudged = true;
    uiStore.toast({ kind: 'hint', title: 'You wait for the sunrise…', body: 'Shawl on, chai in hand, sitting on the cold rock. 5:25 AM. The sky is turning pink.' }, 5200);
  }
}
