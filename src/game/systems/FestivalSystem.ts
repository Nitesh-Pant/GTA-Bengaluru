import Phaser from 'phaser';
import { festivalFromUrl, festivalOn, type Festival } from '../../data/festivals';
import { BUILDINGS, districtAt, type BuildingDef } from '../../data/map';
import { FLAG_FRAMES } from '../art/props';
import { darkness } from '../../logic/dayClock';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { CITY_W, t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

/** Main roads (tile row of the road's top edge) that get bunting strung across them. */
const BUNTING_ROADS = [18, 108, 164];
/** Areas whose shops get Ugadi torans (not the whole city). */
const TORAN_AREAS = new Set(['indiranagar', 'foodlane', 'mgroad', 'basavanagudi']);
/** Rajyotsava: extra flagpoles along the main roads (tiles, pole base). */
const ROAD_FLAGS: Array<[number, number]> = [
  [10, 17.4],
  [30, 17.4],
  [62, 17.4],
  [114, 17.4],
  [12, 107.4],
  [30, 107.4],
  [70, 107.4],
  [110, 107.4],
];
/** Ganesha Chaturthi: little idols at a few street corners (tiles). */
const IDOLS: Array<[number, number]> = [
  [45.6, 57.4],
  [21, 63.4],
  [86.4, 106.8],
  [110.5, 113.4],
];
/** Sankranti: kites over Cubbon Park (tiles). */
const KITES: Array<[number, number]> = [
  [5, 119],
  [11, 123],
  [16, 118],
  [8, 129],
];
const SPARKLER_MS = 7000;
const KITE_MS = 45000;


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
  private nextCracker = 0;
  private rainChecked = false;
  /** On the first load the greeting waits, so the welcome message is read first. */
  private greetAt = -1;
  /** Waving flags put up for the day (Rajyotsava), animated with the frames. */
  private waving: Phaser.GameObjects.Image[] = [];
  private kites: Array<{ img: Phaser.GameObjects.Image; x: number; y: number; phase: number }> = [];
  private kiteLines!: Phaser.GameObjects.Graphics;
  /** The host's marker, and the player's own sparkler and kite. */
  private hostMark!: Phaser.GameObjects.Image;
  private sparkUntil = 0;
  private nextSpark = 0;
  private kiteUntil = 0;
  private myKite!: Phaser.GameObjects.Image;

  constructor(private scene: WorldScene) {
    this.kiteLines = scene.add.graphics().setDepth(8100);
    this.hostMark = scene.add.image(0, 0, 'jobmark').setTint(0xff922b).setDepth(8400).setVisible(false);
    this.myKite = scene.add.image(0, 0, 'fest_kite').setDepth(8150).setVisible(false);
  }

  update(now: number) {
    const s = this.scene;
    if (s.dayNight.day !== this.day) this.begin(s.dayNight.day, now);
    this.animate(now);
    const f = this.current;
    if (!f) return;
    if (this.greetAt >= 0 && now >= this.greetAt) {
      this.greetAt = -1;
      uiStore.toast({ kind: 'hint', title: `Today: ${f.name}`, body: f.host ? `${f.greeting} Tap the ${f.name} chip to see what's on.` : f.greeting }, 7000);
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
    for (const o of [...this.decor, ...this.diyas, ...this.waving]) o.destroy();
    for (const k of this.kites) k.img.destroy();
    this.decor = [];
    this.diyas = [];
    this.waving = [];
    this.kites = [];
    this.rainChecked = false;
    const f = festivalFromUrl(location.search) ?? festivalOn(day);
    this.current = f;
    uiStore.set({ festival: f?.name ?? null, festivalInfo: f ? { greeting: f.greeting, todo: f.host?.todo ?? null } : null });
    if (!f) return;
    for (const d of f.decor ?? []) this.decorate(d);
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

  /** Put up one kind of decoration for the day. */
  private decorate(kind: NonNullable<Festival['decor']>[number]) {
    const s = this.scene;
    const city = BUILDINGS.filter((b) => b.x < CITY_W);
    const front = (b: BuildingDef) => ({ x: t(b.x + b.w / 2), y: t(b.y + b.h) });
    const houses = city.filter((b) => b.style === 'house');
    if (kind === 'torans') {
      // Mango leaves strung over shop doors, with a marigold at each end.
      for (const b of city.filter((b) => ['shop', 'cafe', 'darshini', 'kiosk', 'house'].includes(b.style) && TORAN_AREAS.has(districtAt(t(b.x + b.w / 2), t(b.y + b.h)).id))) {
        const { x, y } = front(b);
        const g = s.add.graphics().setDepth(y + 1);
        const x0 = x - 14;
        g.lineStyle(1, 0x5c940d, 1).lineBetween(x0, y - 24, x0 + 28, y - 24);
        for (let i = 0; i < 7; i++) g.fillStyle(i % 2 ? 0x2f9e44 : 0x51cf66, 1).fillTriangle(x0 + 2 + i * 4, y - 24, x0 + 5 + i * 4, y - 24, x0 + 3.5 + i * 4, y - 19);
        g.fillStyle(0xff922b, 1).fillCircle(x0, y - 24, 2).fillCircle(x0 + 28, y - 24, 2);
        this.decor.push(g);
      }
    } else if (kind === 'rangoli') {
      // A rangoli on the ground in front of each house.
      for (const b of houses) {
        const { x, y } = front(b);
        const g = s.add.graphics().setDepth(-45);
        const cy = y + 12;
        const cols = [0xe64980, 0xfab005, 0x40c057, 0x339af0];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          g.fillStyle(cols[i % 4], 0.95).fillCircle(x + Math.cos(a) * 7, cy + Math.sin(a) * 4, 2.2);
        }
        g.fillStyle(0xffffff, 0.95).fillCircle(x, cy, 2.5);
        g.lineStyle(1, 0xffffff, 0.8).strokeEllipse(x, cy, 26, 14);
        this.decor.push(g);
      }
    } else if (kind === 'lanterns') {
      // Paper star lanterns at houses and apartments, glowing after dark (with the diyas).
      for (const b of city.filter((b) => b.style === 'house' || b.style === 'apartment')) {
        const { x, y } = front(b);
        const lx = x + (b.w > 6 ? t(1.5) : 0);
        this.decor.push(s.add.image(lx, y - 20, 'fest_akash').setOrigin(0.5, 0).setDepth(y + 2));
        this.diyas.push(s.add.image(lx, y - 13, 'glow').setScale(0.5).setTint(0xff922b).setBlendMode(Phaser.BlendModes.ADD).setDepth(8955).setVisible(false));
      }
    } else if (kind === 'flags') {
      for (const [x, y] of ROAD_FLAGS) this.waving.push(s.add.image(t(x), t(y), 'kflag', 0).setOrigin(2 / 30, 1).setDepth(t(y)));
    } else if (kind === 'idols') {
      for (const [x, y] of IDOLS) this.decor.push(s.add.image(t(x), t(y), 'fest_ganeshaIdol').setOrigin(0.5, 1).setDepth(t(y)));
    } else if (kind === 'sugarcane') {
      for (const b of houses) {
        const { x, y } = front(b);
        for (const dx of [-16, 16]) this.decor.push(s.add.image(x + dx, y + 4, 'fest_sugarcane').setOrigin(0.5, 1).setDepth(y + 4));
      }
    } else if (kind === 'kites') {
      KITES.forEach(([x, y], i) => this.kites.push({ img: s.add.image(t(x), t(y), 'fest_kite').setDepth(8150), x: t(x), y: t(y), phase: i * 1.7 }));
    }
  }

  /** Flags flutter, kites bob on their strings, the host's marker bounces, your sparkler sparks. */
  private animate(now: number) {
    const s = this.scene;
    const frame = Math.floor(now / 140) % FLAG_FRAMES;
    for (const f of this.waving) f.setFrame(frame);
    const g = this.kiteLines;
    g.clear();
    for (const k of this.kites) {
      const kx = k.x + Math.sin(now / 900 + k.phase) * 6;
      const ky = k.y + Math.sin(now / 600 + k.phase) * 4;
      k.img.setPosition(kx, ky).setRotation(Math.sin(now / 700 + k.phase) * 0.2);
      g.lineStyle(1, 0xf8f9fa, 0.6).lineBetween(kx, ky + 6, kx + 30, ky + 80);
    }
    const p = s.playerFeet();
    if (now < this.kiteUntil && s.mode.kind === 'walk') {
      const kx = p.x + 34 + Math.sin(now / 800) * 6;
      const ky = p.y - 70 + Math.sin(now / 500) * 5;
      this.myKite.setVisible(true).setPosition(kx, ky).setRotation(Math.sin(now / 650) * 0.25);
      g.lineStyle(1, 0xf8f9fa, 0.8).lineBetween(p.x + 4, p.y - 12, kx, ky + 6);
    } else this.myKite.setVisible(false);
    const host = this.current?.host ? s.npcs.byId(this.current.host.npc) : undefined;
    this.hostMark.setVisible(!!host);
    if (host) this.hostMark.setPosition(host.x, host.y - 32 + Math.sin(now / 220) * 3);
    if (now < this.sparkUntil && now >= this.nextSpark) {
      this.nextSpark = now + 60;
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const spark = s.add.circle(p.x + 6, p.y - 14, 1.2, Math.random() < 0.5 ? 0xfff3bf : 0xffd43b).setDepth(8980).setBlendMode(Phaser.BlendModes.ADD);
        s.tweens.add({ targets: spark, x: spark.x + Math.cos(a) * 14, y: spark.y + Math.sin(a) * 14 + 4, alpha: 0, duration: 450, onComplete: () => spark.destroy() });
      }
    }
  }

  /** Festival activities from the hosts' conversations. */
  act(act: 'sparkler' | 'kite' | 'cheer') {
    const s = this.scene;
    const now = s.clock;
    if (act === 'sparkler') {
      this.sparkUntil = now + SPARKLER_MS;
      s.mark('sparkler');
      audio.cracker(0.3);
    } else if (act === 'kite') {
      this.kiteUntil = now + KITE_MS;
      s.mark('kite');
    } else {
      s.mark('cheer');
      audio.roar(0.6, 0);
      const p = s.playerFeet();
      s.npcs.near(p.x, p.y, t(12)).slice(0, 6).forEach((n, i) => {
        s.time.delayedCall(300 + i * 250, () => s.talk.say(n, i % 2 ? 'Jai Karnataka!' : 'Siri gannadam gelge!', s.clock));
      });
    }
  }

  /** "Show me" from the festival card: the host. */
  showHost() {
    const host = this.current?.host ? this.scene.npcs.byId(this.current.host.npc) : undefined;
    if (!host) return;
    this.scene.guides.set('tour', { x: host.x, y: host.y, label: host.name });
    uiStore.toast({ kind: 'hint', title: `Marked: ${host.name}`, body: 'Follow the arrow beside you.' }, 3000);
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
