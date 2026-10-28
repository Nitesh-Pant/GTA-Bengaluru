import Phaser from 'phaser';
import { COWS, CROW_SPOTS, DOGS } from '../../data/animals';
import { boxHitsSolids, type Rect } from '../../logic/geometry';
import { mulberry32 } from '../../logic/rng';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

interface Walker {
  name: string;
  sprite: Phaser.GameObjects.Image;
  zone: Rect;
  target: { x: number; y: number } | null;
  pauseUntil: number;
  speed: number;
}

interface Dog extends Walker {
  followUntil: number;
  barkCd: number;
  frameT: number;
  frame: number;
}

interface Crow {
  sprite: Phaser.GameObjects.Image;
  home: { x: number; y: number };
  away: boolean;
  backAt: number;
}

const FOLLOW_MS = 90000;

/** Street dogs (feed one and it follows you), crows that scatter, and slow-wandering cows. */
export class AnimalSystem {
  readonly dogs: Dog[] = [];
  readonly cows: Walker[] = [];
  private crows: Crow[] = [];
  private rng = mulberry32(71);
  private cawCd = 0;
  private senseT = 0;

  constructor(private scene: WorldScene) {
    DOGS.forEach((d) => {
      const at = this.pointIn(d.zone);
      const sprite = scene.add.image(at.x, at.y, `dog_${d.variant}`, 0).setOrigin(0.5, 0.9);
      this.dogs.push({ name: d.name, sprite, zone: d.zone, target: null, pauseUntil: 0, speed: 34, followUntil: 0, barkCd: 0, frameT: 0, frame: 0 });
    });
    for (const c of COWS) {
      const at = this.pointIn(c.zone);
      const sprite = scene.add.image(at.x, at.y, 'cow').setOrigin(0.5, 0.85);
      this.cows.push({ name: c.name, sprite, zone: c.zone, target: null, pauseUntil: 0, speed: 9 });
    }
    for (const spot of CROW_SPOTS)
      for (let i = 0; i < 3; i++) {
        const home = { x: t(spot.x) + (i - 1) * 9, y: t(spot.y) + (i % 2) * 5 };
        this.crows.push({ sprite: scene.add.image(home.x, home.y, 'crow', 0).setOrigin(0.5, 1).setFlipX(i === 1).setDepth(home.y), home, away: false, backAt: 0 });
      }
  }

  private pointIn(z: Rect) {
    for (let i = 0; i < 12; i++) {
      const p = { x: t(z.x + this.rng() * z.w), y: t(z.y + this.rng() * z.h) };
      if (!boxHitsSolids(p.x, p.y - 2, 5, 3, this.scene.solids)) return p;
    }
    return { x: t(z.x + z.w / 2), y: t(z.y + z.h / 2) };
  }

  /** Step towards a point, sliding along walls; returns true when (nearly) there. */
  private step(w: Walker, tx: number, ty: number, speed: number, dt: number) {
    const s = w.sprite;
    const dx = tx - s.x;
    const dy = ty - s.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) return true;
    const mx = (dx / d) * speed * dt;
    const my = (dy / d) * speed * dt;
    const solids = this.scene.solids;
    if (!boxHitsSolids(s.x + mx, s.y - 2, 5, 3, solids)) s.x += mx;
    if (!boxHitsSolids(s.x, s.y + my - 2, 5, 3, solids)) s.y += my;
    if (Math.abs(dx) > 1) s.setFlipX(dx < 0);
    s.setDepth(s.y);
    return false;
  }

  private wander(w: Walker, now: number, dt: number) {
    if (now < w.pauseUntil) return false;
    if (!w.target) w.target = this.pointIn(w.zone);
    if (this.step(w, w.target.x, w.target.y, w.speed, dt)) {
      w.target = null;
      w.pauseUntil = now + 2000 + this.rng() * 5000;
      return false;
    }
    return true;
  }

  /** Dogs within reach of the player that could take a biscuit. */
  feedable(x: number, y: number) {
    return this.dogs.filter((d) => d.followUntil < this.scene.clock && Math.hypot(d.sprite.x - x, d.sprite.y - y) < 28);
  }

  feed(name: string) {
    const d = this.dogs.find((x) => x.name === name);
    if (!d) return;
    d.followUntil = this.scene.clock + FOLLOW_MS;
    audio.bark(0.8);
    uiStore.toast({ kind: 'info', title: `${d.name} is following you!`, body: 'One Marie biscuit, one loyal friend. Tail at full speed.' }, 3600);
    this.scene.bump('dogsFed');
  }

  cowNear(x: number, y: number) {
    return this.cows.find((c) => Math.hypot(c.sprite.x - x, c.sprite.y - y) < 32);
  }

  update(dt: number, now: number) {
    const s = this.scene;
    const p = s.playerFeet();
    const cam = s.cameras.main.worldView;
    // Animals well off screen just wait where they are: nobody is watching.
    const near = (x: number, y: number) => x > cam.x - 160 && x < cam.right + 160 && y > cam.y - 160 && y < cam.bottom + 160;
    // Scares and barks only need checking a few times a second.
    this.senseT -= dt;
    const sense = this.senseT <= 0;
    if (sense) this.senseT = 0.2;
    for (const d of this.dogs) {
      const following = d.followUntil > now && !s.travelling;
      if (!following && !near(d.sprite.x, d.sprite.y)) continue;
      let moving: boolean;
      if (following) {
        // Trot behind the player, stopping a little short.
        const gap = Math.hypot(p.x - d.sprite.x, p.y - d.sprite.y);
        moving = gap > 22 && !this.step(d, p.x - 14, p.y + 2, Math.min(110, 40 + gap), dt);
        if (gap > 600) d.sprite.setPosition(p.x - 14, p.y + 2); // got left behind on a drive: catches up
      } else {
        if (d.followUntil && d.followUntil <= now) d.followUntil = 0;
        moving = this.wander(d, now, dt);
      }
      d.frameT += dt;
      const frame = moving && Math.floor(d.frameT * 8) % 2 ? 1 : 0;
      if (frame !== d.frame) d.sprite.setFrame((d.frame = frame));
      // Barks at vehicles rushing past, or at you driving close.
      if (sense && now > d.barkCd && cam.contains(d.sprite.x, d.sprite.y)) {
        const gap = Math.hypot(p.x - d.sprite.x, p.y - d.sprite.y);
        if (s.traffic.anyCarWithin(d.sprite.x, d.sprite.y, 34) || (s.mode.kind === 'drive' && gap < 50)) {
          d.barkCd = now + 6000 + this.rng() * 6000;
          audio.bark(1 - Math.min(1, gap / 380), (d.sprite.x - p.x) / 300);
        }
      }
    }
    for (const c of this.cows) if (near(c.sprite.x, c.sprite.y)) this.wander(c, now, dt);
    for (const c of this.crows) {
      if (!near(c.home.x, c.home.y)) continue;
      if (c.away) {
        if (now > c.backAt && Math.hypot(p.x - c.home.x, p.y - c.home.y) > 120) {
          c.away = false;
          s.tweens.killTweensOf(c.sprite);
          c.sprite.setPosition(c.home.x, c.home.y).setAlpha(1).setFrame(0);
        }
        continue;
      }
      if (sense && (Math.hypot(p.x - c.home.x, p.y - c.home.y) < 46 || s.traffic.anyCarWithin(c.home.x, c.home.y, 30))) {
        c.away = true;
        c.backAt = now + 20000 + this.rng() * 20000;
        c.sprite.setFrame(1);
        s.tweens.add({ targets: c.sprite, x: c.home.x + (this.rng() - 0.3) * 260, y: c.home.y - 220 - this.rng() * 80, alpha: 0, duration: 1400, ease: 'Quad.easeIn' });
        if (now > this.cawCd) {
          this.cawCd = now + 1500;
          audio.caw(0.8, (c.home.x - p.x) / 300);
        }
      } else if (this.rng() < dt * 0.5) {
        // Peck and hop.
        c.sprite.setFrame(this.rng() < 0.2 ? 1 : 0);
        c.sprite.x = c.home.x + (this.rng() - 0.5) * 6;
      }
    }
    if (now > this.cawCd + 9000 && this.rng() < dt * 0.08) {
      this.cawCd = now;
      const caw = this.crows.find((c) => !c.away && cam.contains(c.home.x, c.home.y));
      if (caw) audio.caw(0.5, (caw.home.x - p.x) / 300);
    }
  }
}
