import Phaser from 'phaser';
import { festivalFor, isRajyotsavaMonth, rajyotsavaNumber, type Festival } from '../../data/festivals';
import { BUILDINGS } from '../../data/map';
import { PARKED } from '../../data/vehicles';
import { darkness } from '../../logic/dayClock';
import { uiStore } from '../../store/uiStore';
import { FLAG_FRAMES, paintProp } from '../art/props';
import { audio } from '../audio';
import { CITY_W, t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

/** Main roads (tile row of the road's top edge) that get bunting strung across them. */
const BUNTING_ROADS = [18, 108, 164];

/** Rajyotsava flagpoles (tiles, pole base): Vidhana Soudha and the big junction circles. */
const FLAGPOLES: Array<[number, number]> = [
  [12, 161.7],
  [28, 161.7],
  [45, 17.5],
  [93, 17.4],
  [38.6, 107.4],
  [126.6, 106.9],
];

/**
 * Festivals by season (see src/data/festivals.ts): bunting across the main roads in the festival's
 * colours, Deepavali diyas and crackers after dark, the Kadlekai Parishe groundnut fair, monsoon rain,
 * a HUD chip, a morning greeting, and festival lines in people's mouths.
 */
export class FestivalSystem {
  current: Festival | null = null;
  private day = -1;
  private decor: Phaser.GameObjects.GameObject[] = [];
  private diyas: Phaser.GameObjects.Image[] = [];
  /** Waving Kannada flags: on poles, and riding on autos (which follow their vehicle). */
  private flags: Phaser.GameObjects.Image[] = [];
  private autoFlags: Array<{ img: Phaser.GameObjects.Image; ride: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Visible; on: () => boolean }> = [];
  private greeting = '';
  private nextCracker = 0;
  private rainChecked = false;
  /** On the first load the greeting waits, so the welcome message is read first. */
  private greetAt = -1;

  constructor(private scene: WorldScene) {}

  update(now: number) {
    const s = this.scene;
    if (s.dayNight.day !== this.day) this.begin(s.dayNight.day, now);
    this.waveFlags(now);
    const f = this.current;
    if (!f) return;
    if (this.greetAt >= 0 && now >= this.greetAt) {
      this.greetAt = -1;
      uiStore.toast({ kind: 'hint', title: `Today: ${f.name}`, body: this.greeting }, 7000);
    }
    const dark = darkness(s.dayNight.minutes);
    if (f.lights) {
      const a = dark * 0.9;
      for (const d of this.diyas) d.setAlpha(a).setVisible(a > 0.02);
      if (dark > 0.5 && now > this.nextCracker) {
        this.nextCracker = now + 1500 + Math.random() * 3500;
        this.cracker();
      }
    }
    if (f.rainy && !this.rainChecked && s.dayNight.minutes > 9 * 60) {
      this.rainChecked = true;
      s.weather.start(120000, now);
    }
  }

  /** A new day: take down yesterday's decorations and put up today's. */
  private begin(day: number, now: number) {
    const s = this.scene;
    const first = this.day < 0;
    this.day = day;
    for (const o of [...this.decor, ...this.diyas, ...this.flags]) o.destroy();
    for (const a of this.autoFlags) a.img.destroy();
    this.decor = [];
    this.diyas = [];
    this.flags = [];
    this.autoFlags = [];
    this.rainChecked = false;
    const today = new Date();
    const { festival: f, real } = festivalFor(day, today);
    this.current = f;
    uiStore.set({ festival: f?.name ?? null });
    if (f?.id === 'rajyotsava' || isRajyotsavaMonth(today)) this.flagAutos();
    if (!f) return;
    this.greeting =
      real && f.id === 'rajyotsava'
        ? `Karnataka turns ${rajyotsavaNumber(today).replace(/\D+$/, '')} today! On 1 November 1956 the Kannada-speaking regions became one state. Red and yellow flags fly everywhere. Siri gannadam gelge!`
        : f.greeting;
    if (f.id === 'rajyotsava') this.hoistFlags(today);
    if (f.colours.length) this.bunting(f.colours);
    if (f.lights) this.lightDiyas();
    if (f.fair) this.groundnutFair();
    this.greetAt = first ? now + 7000 : now;
    // Count festival days you live through (not the same day again after a reload).
    if (!first || (day === 0 && s.stats.festivals === 0)) s.bump('festivals');
  }

  /** Strings of little triangular flags hung across the main roads, every few blocks. */
  private bunting(colours: number[]) {
    const s = this.scene;
    for (const row of BUNTING_ROADS)
      for (let x = 8; x < CITY_W; x += 14) {
        if (Math.abs(x - 42) < 4 || Math.abs(x - 90) < 4) continue; // not across a junction
        const g = s.add.graphics().setDepth(7900);
        const x0 = t(x);
        const y0 = t(row - 1.4);
        const y1 = t(row + 5.4);
        g.lineStyle(1, 0x495057, 0.9).lineBetween(x0, y0, x0 + 6, y1);
        for (let i = 0; i < 9; i++) {
          const k = (i + 0.5) / 9;
          const fx = x0 + 6 * k + Math.sin(k * Math.PI) * 5;
          const fy = y0 + (y1 - y0) * k;
          g.fillStyle(colours[i % colours.length], 0.95).fillTriangle(fx, fy, fx + 5, fy + 2, fx, fy + 5);
        }
        this.decor.push(g);
      }
  }

  /** Rajyotsava: big flags on poles at Vidhana Soudha and the junction circles, and a banner. */
  private hoistFlags(today: Date) {
    const s = this.scene;
    for (const [x, y] of FLAGPOLES) this.flags.push(s.add.image(t(x), t(y), 'kflag', 0).setOrigin(2 / 30, 1).setDepth(t(y)));
    const text = `${rajyotsavaNumber(today).toUpperCase()} KANNADA RAJYOTSAVA`;
    const key = `banner_${text}`;
    if (!s.textures.exists(key)) s.textures.addCanvas(key, paintProp('hoarding', text));
    this.decor.push(s.add.image(t(20), t(163.2), key).setOrigin(0.5, 1).setDepth(t(163.2)));
  }

  /** Every auto, traffic or borrowable, flies a little Kannada flag at the back. */
  private flagAutos() {
    const s = this.scene;
    const add = (ride: Phaser.GameObjects.Image, on: () => boolean) => this.autoFlags.push({ img: s.add.image(0, 0, 'kflag_s', 0).setVisible(false), ride, on });
    for (const c of s.traffic.cars) if (c.spawn.type === 'auto') add(c.sprite, () => c.active);
    for (const v of s.vehicles.list) if (v.def.type === 'auto') add(v.sprite, () => true);
    // Parked autos (the KR Puram stand) get one too; they never move, so the flag just waves.
    for (const p of PARKED)
      if (p.type === 'auto') {
        const back = Math.cos(p.heading) > 0;
        this.flags.push(s.add.image(t(p.x) - Math.cos(p.heading) * 7, t(p.y) + 2, 'kflag_s', 0).setFlipX(back).setOrigin(back ? 1 - 2 / 13 : 2 / 13, 1).setDepth(t(p.y) + 12));
      }
  }

  /** Flags flutter (a frame every 140 ms) and ride along at the back of their auto. */
  private waveFlags(now: number) {
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
      // The pole stands at the back of the auto; the cloth streams away from the direction of travel.
      const trailing = cos > 0;
      a.img
        .setFrame(frame)
        .setPosition(r.x - cos * 7, r.y - sin * 7 + 2)
        .setFlipX(trailing)
        .setOrigin(trailing ? 1 - 2 / 13 : 2 / 13, 1)
        .setDepth(r.y + 12);
    }
  }

  /** A pair of diyas glowing at the foot of every building in the city, after dark. */
  private lightDiyas() {
    const s = this.scene;
    for (const b of BUILDINGS) {
      if (b.x >= CITY_W) continue;
      for (const k of [0.25, 0.75]) {
        const img = s.add.image(t(b.x + b.w * k), t(b.y + b.h) + 1, 'glow').setScale(0.35).setTint(0xffa94d).setBlendMode(Phaser.BlendModes.ADD).setDepth(8955).setVisible(false);
        this.diyas.push(img);
      }
    }
  }

  /** A firework bursting somewhere over the screen, with a crack. */
  private cracker() {
    const s = this.scene;
    const view = s.cameras.main.worldView;
    const x = view.x + view.width * (0.15 + Math.random() * 0.7);
    const y = view.y + view.height * (0.15 + Math.random() * 0.4);
    const colour = [0xffd43b, 0xff6b6b, 0x74c0fc, 0x8ce99a, 0xf783ac][Math.floor(Math.random() * 5)];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const spark = s.add.circle(x, y, 1.6, colour).setDepth(8980).setBlendMode(Phaser.BlendModes.ADD);
      s.tweens.add({ targets: spark, x: x + Math.cos(a) * 28, y: y + Math.sin(a) * 28 + 8, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => spark.destroy() });
    }
    const p = s.playerFeet();
    audio.cracker(0.6, (x - p.x) / 300);
  }

  /** Kadlekai Parishe: groundnut heaps and stalls lining the road by Bull Temple. */
  private groundnutFair() {
    const s = this.scene;
    for (let x = 46; x < 86; x += 5) {
      const img = s.add.image(t(x), t(162.4), 'prop_vegStall').setOrigin(0.5, 1).setDepth(t(162.4));
      this.decor.push(img);
    }
  }
}
