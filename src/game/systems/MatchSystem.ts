import type Phaser from 'phaser';
import { BUILDINGS } from '../../data/map';
import { darkness, isMatchTime } from '../../logic/dayClock';
import { boxHitsSolids } from '../../logic/geometry';
import { mulberry32, pick } from '../../logic/rng';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { t, TILE } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

const RIVALS = ['CSK', 'MI', 'KKR', 'SRH', 'DC', 'PBKS', 'RR', 'GT', 'LSG'];
const FAN_LOOKS = ['fan', 'fan2', 'fan_f'];
const CHANTS = ['Ee sala cup namde!', 'RCB! RCB! RCB!', 'Ee sala cup namde! …Every sala.', 'Is baar cup humara hai!'];
/** Where fans gather on match nights (tiles): the stadium forecourt and MG Road. */
const CROWD_AREAS = [
  { x: 23, y: 131.5, w: 14, h: 11 },
  { x: 2, y: 106.6, w: 34, h: 0.8 },
];

/** IPL nights at Chinnaswamy: floodlights, a crowd outside, roars you can hear across town, and a result. */
export class MatchSystem {
  private rng = mulberry32(113);
  private live = false;
  private rival = '';
  private crowd: Phaser.GameObjects.Image[] = [];
  private lights: Phaser.GameObjects.Image[] = [];
  private nextRoar = 0;
  private nextChant = 0;
  private nextTalk = 0;
  private stadium: { x: number; y: number };

  constructor(private scene: WorldScene) {
    const b = BUILDINGS.find((x) => x.id === 'stadium')!;
    this.stadium = { x: t(b.x + b.w / 2), y: t(b.y + b.h / 2) };
    for (const [dx, dy] of [
      [0.1, 0.1],
      [0.9, 0.1],
      [0.1, 0.75],
      [0.9, 0.75],
    ])
      this.lights.push(
        scene.add
          .image(t(b.x) + dx * b.w * TILE, t(b.y) + dy * b.h * TILE, 'glow')
          .setScale(3)
          .setTint(0xf1f8ff)
          .setBlendMode('ADD')
          .setDepth(8950)
          .setVisible(false),
      );
  }

  update(now: number) {
    const s = this.scene;
    const live = isMatchTime(s.dayNight.day, s.dayNight.minutes);
    if (live !== this.live) {
      this.live = live;
      if (live) this.start();
      else this.finish();
    }
    if (!live) return;
    const d = darkness(s.dayNight.minutes);
    for (const l of this.lights) l.setVisible(d > 0.05).setAlpha(0.35 + d * 0.5);
    const p = s.playerFeet();
    const far = Math.hypot(p.x - this.stadium.x, p.y - this.stadium.y);
    if (far < 600) s.mark('ipl');
    if (now >= this.nextRoar) {
      this.nextRoar = now + 5000 + this.rng() * 8000;
      const vol = Math.max(0, 1 - far / 1400);
      audio.roar(vol, (this.stadium.x - p.x) / 600);
      if (far < 500 && this.rng() < 0.3) uiStore.toast({ kind: 'info', title: this.rng() < 0.5 ? 'SIX!' : 'FOUR!', body: 'The whole stadium jumps. You can feel it from the street.' }, 2400);
    }
    if (now >= this.nextChant && this.crowd.length) {
      this.nextChant = now + 3500 + this.rng() * 3000;
      const fan = pick(this.crowd, this.rng);
      const line = pick(CHANTS, this.rng);
      s.bubbles.say(() => (fan.active ? { x: fan.x, y: fan.y - 22 } : null), 'RCB fan', line, 2400, now);
      s.talk.voice('fan', null, fan.x, fan.y, now);
    }
    if (now >= this.nextTalk) {
      this.nextTalk = now + 9000 + this.rng() * 6000;
      const [n] = s.npcs.near(p.x, p.y, 260, true);
      if (n) s.talk.speak(n, ['match'], now, false, 12000);
    }
  }

  private start() {
    const s = this.scene;
    this.rival = pick(RIVALS, this.rng);
    uiStore.set({ match: `RCB vs ${this.rival}` });
    uiStore.toast({ kind: 'hint', title: `IPL night: RCB vs ${this.rival}`, body: 'Chinnaswamy is packed and MG Road is red and gold. Ee sala cup namde!' }, 5600);
    for (const area of CROWD_AREAS)
      for (let i = 0, tries = 0; i < (area.h > 2 ? 12 : 7) && tries < 60; tries++) {
        const x = t(area.x + this.rng() * area.w);
        const y = t(area.y + this.rng() * area.h);
        if (boxHitsSolids(x, y - 3, 5, 4, s.solids)) continue;
        const fan = s.add.image(x, y, `char_${pick(FAN_LOOKS, this.rng)}`, 0).setOrigin(0.5, 22 / 24).setDepth(y);
        // Bouncing on the spot.
        s.tweens.add({ targets: fan, y: y - 2, duration: 260 + this.rng() * 200, yoyo: true, repeat: -1, delay: this.rng() * 400 });
        this.crowd.push(fan);
        i++;
      }
  }

  private finish() {
    const won = this.rng() < 0.5;
    uiStore.set({ match: null });
    uiStore.toast(
      won
        ? { kind: 'arrive', title: `RCB beat ${this.rival}!`, body: 'Crackers on MG Road, honking all the way home. Ee sala cup namde!' }
        : { kind: 'info', title: `RCB lose to ${this.rival} by 2 runs`, body: 'Silence on MG Road. "Ee sala… next sala, guru."' },
      5600,
    );
    for (const f of this.crowd) {
      this.scene.tweens.killTweensOf(f);
      f.destroy();
    }
    this.crowd = [];
    for (const l of this.lights) l.setVisible(false);
  }
}
