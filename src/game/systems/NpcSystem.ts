import Phaser from 'phaser';
import { BUILDINGS } from '../../data/map';
import { NPCS, type NpcDef } from '../../data/npcs';
import { JUNCTIONS } from '../../data/roads';
import { facingFrom, type Facing } from '../../logic/movement';
import { signalState } from '../../logic/traffic';
import { mulberry32 } from '../../logic/rng';
import { t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

export type NpcState = 'active' | 'talk' | 'startled' | 'shelter' | 'goto' | 'event';

const SHELTER_STYLES = new Set(['shop', 'cafe', 'darshini', 'pub', 'metro', 'mall', 'kiosk']);
const BLOCK_COMPLAINT_AFTER = 1.3;

export class Npc {
  readonly id: string;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  state: NpcState = 'active';
  facing: Facing;
  target: { x: number; y: number } | null = null;
  pauseUntil = 0;
  wp = 0;
  wpDir = 1;
  waitingSince = -1;
  stuckTime = 0;
  blockedByPlayer = 0;
  stateUntil = 0;
  lookUntil = 0;
  lookFacing: Facing | null = null;
  home: { x: number; y: number };
  gotoDone: (() => void) | null = null;
  private last = { x: 0, y: 0 };

  constructor(
    scene: Phaser.Scene,
    readonly def: NpcDef,
  ) {
    this.id = def.id;
    this.home = { x: t(def.x), y: t(def.y) };
    this.sprite = scene.physics.add.sprite(this.home.x, this.home.y, `char_${def.look}`, 0);
    this.sprite.setOrigin(0.5, 22 / 24);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(8, 6).setOffset(4, 17);
    body.pushable = false;
    this.facing = def.behaviour.type === 'idle' || def.behaviour.type === 'chat' ? def.behaviour.facing : 'down';
    this.sprite.setData('npc', this);
    this.last = { ...this.home };
    this.face(this.facing);
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }
  get speed() {
    return this.def.speed ?? 32;
  }
  get name() {
    return this.def.name;
  }
  get busy() {
    return this.state === 'talk' || this.state === 'event';
  }

  face(f: Facing) {
    this.facing = f;
    const row = ['down', 'left', 'right', 'up'].indexOf(f);
    this.sprite.anims.stop();
    this.sprite.setFrame(row * 3);
  }

  faceTowards(x: number, y: number) {
    this.face(facingFrom(x - this.x, y - this.y, this.facing));
  }

  /** Walk somewhere for an event or reaction, then call back. */
  goTo(x: number, y: number, done?: () => void) {
    this.state = 'goto';
    this.target = { x, y };
    this.gotoDone = done ?? null;
  }

  release() {
    this.state = 'active';
    this.target = null;
    this.gotoDone = null;
  }

  movedSince(): number {
    const d = Math.hypot(this.x - this.last.x, this.y - this.last.y);
    this.last = { x: this.x, y: this.y };
    return d;
  }
}

export class NpcSystem {
  readonly npcs: Npc[] = [];
  readonly group: Phaser.Physics.Arcade.Group;
  private rng = mulberry32(42);
  private shelterPoints: Array<{ x: number; y: number }>;

  constructor(private scene: WorldScene) {
    this.group = scene.physics.add.group();
    for (const def of NPCS) {
      const npc = new Npc(scene, def);
      this.group.add(npc.sprite);
      (npc.sprite.body as Phaser.Physics.Arcade.Body).pushable = false;
      this.npcs.push(npc);
    }
    this.shelterPoints = BUILDINGS.filter((b) => SHELTER_STYLES.has(b.style)).flatMap((b) => {
      const pts = [];
      for (let i = 1; i < b.w; i += 3) pts.push({ x: t(b.x + i) + 4, y: t(b.y + b.h) + 7 });
      return pts;
    });
  }

  byId(id: string) {
    return this.npcs.find((n) => n.id === id);
  }

  startle(npc: Npc, fromX: number, fromY: number, now: number) {
    if (npc.state === 'talk') return;
    const prev = npc.state;
    npc.faceTowards(fromX, fromY);
    npc.state = 'startled';
    npc.stateUntil = now + 900;
    (npc.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.scene.tweens.add({ targets: npc.sprite, y: npc.y - 3, duration: 90, yoyo: true });
    npc.sprite.setData('resumeState', prev === 'startled' ? 'active' : prev);
  }

  seekShelter(npc: Npc) {
    const b = npc.def.behaviour.type;
    if (npc.busy || b === 'idle' || b === 'chat' || npc.state === 'goto') return;
    let best: { x: number; y: number } | null = null;
    let bestD = 320;
    for (const p of this.shelterPoints) {
      const d = Math.hypot(p.x - npc.x, p.y - npc.y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) return;
    npc.state = 'shelter';
    npc.target = { x: best.x + (this.rng() - 0.5) * 10, y: best.y };
  }

  resume(npc: Npc) {
    if (npc.state === 'shelter') {
      npc.state = 'active';
      npc.target = null;
    }
  }

  update(dt: number, now: number) {
    const s = this.scene;
    const p = s.playerFeet();
    const playerWalking = s.mode.kind === 'walk';
    for (const npc of this.npcs) {
      const body = npc.sprite.body as Phaser.Physics.Arcade.Body;
      npc.sprite.setDepth(npc.y);
      if (npc.state === 'talk' || npc.state === 'event') {
        body.setVelocity(0, 0);
        this.stand(npc);
        continue;
      }
      if (npc.state === 'startled') {
        body.setVelocity(0, 0);
        if (now >= npc.stateUntil) npc.state = (npc.sprite.getData('resumeState') as NpcState) ?? 'active';
        continue;
      }
      const target = this.chooseTarget(npc, now);
      if (!target) {
        body.setVelocity(0, 0);
        this.idleLook(npc, now, p, playerWalking);
        continue;
      }
      const dx = target.x - npc.x;
      const dy = target.y - npc.y;
      const d = Math.hypot(dx, dy);
      if (d < 2.5) {
        body.setVelocity(0, 0);
        this.arrive(npc, now);
        continue;
      }
      const ux = dx / d;
      const uy = dy / d;
      // Never walk into the player: stop and (eventually) complain instead.
      const rx = p.x - npc.x;
      const ry = p.y - npc.y;
      const ahead = rx * ux + ry * uy;
      const side = Math.abs(rx * -uy + ry * ux);
      if (playerWalking && ahead > 0 && ahead < 15 && side < 9) {
        body.setVelocity(0, 0);
        this.stand(npc);
        npc.faceTowards(p.x, p.y);
        npc.blockedByPlayer += dt;
        if (npc.blockedByPlayer > BLOCK_COMPLAINT_AFTER) {
          npc.blockedByPlayer = -4;
          s.react({ type: 'player_block_ped', actorId: npc.id, x: npc.x, y: npc.y });
        }
        continue;
      }
      npc.blockedByPlayer = Math.max(0, npc.blockedByPlayer - dt);
      const speed = npc.state === 'shelter' ? npc.speed * 1.8 : npc.speed;
      body.setVelocity(ux * speed, uy * speed);
      const f = facingFrom(ux, uy, npc.facing);
      npc.facing = f;
      npc.sprite.anims.play(`${npc.def.look}_walk_${f}`, true);
      // Stuck against something solid? Try another way.
      const moved = npc.movedSince();
      if (moved < speed * dt * 0.25) npc.stuckTime += dt;
      else npc.stuckTime = Math.max(0, npc.stuckTime - dt);
      if (npc.stuckTime > 0.9) {
        npc.stuckTime = 0;
        this.unstick(npc, now);
      }
    }
  }

  private stand(npc: Npc) {
    if (npc.sprite.anims.isPlaying) npc.face(npc.facing);
  }

  private idleLook(npc: Npc, now: number, p: { x: number; y: number }, playerWalking: boolean) {
    this.stand(npc);
    const b = npc.def.behaviour;
    const home: Facing = b.type === 'idle' || b.type === 'chat' ? b.facing : npc.facing;
    // Glance at the player when they come close; otherwise occasionally look around.
    if (playerWalking && Math.hypot(p.x - npc.x, p.y - npc.y) < 34 && b.type !== 'chat') {
      const f = facingFrom(p.x - npc.x, p.y - npc.y, npc.facing);
      if (f !== npc.facing) npc.face(f);
      npc.lookUntil = now + 1500;
      return;
    }
    if (now < npc.lookUntil) return;
    if (npc.lookFacing) {
      npc.lookFacing = null;
      if (npc.facing !== home) npc.face(home);
      npc.lookUntil = now + 3000 + this.rng() * 6000;
      return;
    }
    if (b.type === 'idle' && this.rng() < 0.5) {
      const options: Facing[] = home === 'down' || home === 'up' ? ['left', 'right'] : ['down', 'up'];
      npc.lookFacing = options[Math.floor(this.rng() * 2)];
      npc.face(npc.lookFacing);
      npc.lookUntil = now + 1200 + this.rng() * 1200;
    } else {
      npc.lookUntil = now + 2500 + this.rng() * 4000;
    }
  }

  private chooseTarget(npc: Npc, now: number): { x: number; y: number } | null {
    if (npc.state === 'goto' || npc.state === 'shelter') return npc.target;
    if (now < npc.pauseUntil) return null;
    const b = npc.def.behaviour;
    switch (b.type) {
      case 'idle':
      case 'chat':
        return Math.hypot(npc.x - npc.home.x, npc.y - npc.home.y) > 3 ? npc.home : null;
      case 'wander': {
        if (!npc.target) {
          const z = b.zone;
          npc.target = { x: t(z.x + this.rng() * z.w), y: t(z.y + this.rng() * z.h) };
        }
        return npc.target;
      }
      case 'route': {
        const pt = b.points[npc.wp];
        return { x: t(pt.x), y: t(pt.y) };
      }
    }
  }

  private arrive(npc: Npc, now: number) {
    this.stand(npc);
    if (npc.state === 'goto') {
      const done = npc.gotoDone;
      npc.gotoDone = null;
      npc.target = null;
      npc.state = 'event';
      done?.();
      return;
    }
    if (npc.state === 'shelter') {
      npc.face('down');
      return;
    }
    const b = npc.def.behaviour;
    if (b.type === 'idle' || b.type === 'chat') {
      npc.face(b.facing);
      return;
    }
    if (b.type === 'wander') {
      npc.target = null;
      npc.pauseUntil = now + 1500 + this.rng() * 3500;
      return;
    }
    // Route: pause, wait for a safe crossing, then advance.
    const pts = b.points;
    const here = pts[npc.wp];
    if (here.pause && npc.waitingSince < 0) {
      npc.pauseUntil = now + here.pause * 1000;
      npc.waitingSince = now;
      return;
    }
    let next = npc.wp + npc.wpDir;
    if (next >= pts.length || next < 0) {
      if (b.loop) next = 0;
      else {
        npc.wpDir *= -1;
        next = npc.wp + npc.wpDir;
      }
    }
    const legStart = pts[Math.min(npc.wp, next)];
    if (legStart.cross && !this.safeToCross(legStart.cross, here, pts[next], now)) {
      if (npc.waitingSince < 0) npc.waitingSince = now;
      // Patience runs out eventually; traffic will stop for pedestrians anyway.
      if (now - npc.waitingSince < 20000) {
        npc.face(facingFrom(pts[next].x - here.x, pts[next].y - here.y, npc.facing));
        return;
      }
    }
    npc.waitingSince = -1;
    npc.wp = next;
  }

  private safeToCross(rule: string, a: { x: number; y: number }, b: { x: number; y: number }, now: number): boolean {
    if (rule === 'gap') {
      const mx = t((a.x + b.x) / 2);
      const my = t((a.y + b.y) / 2);
      return this.scene.traffic.nearestCarDistance(mx, my) > 130;
    }
    const [jid, axis] = rule.split(':');
    const j = JUNCTIONS.find((x) => x.id === jid);
    if (!j) return true;
    const s = signalState(now, undefined, j.offset);
    return (axis === 'ns' ? s.ns : s.ew) === 'red';
  }

  private unstick(npc: Npc, now: number) {
    const b = npc.def.behaviour;
    if (npc.state === 'goto') {
      // Close enough: treat as arrived.
      this.arrive(npc, now);
      return;
    }
    if (npc.state === 'shelter') {
      npc.target = null;
      npc.state = 'active';
      return;
    }
    if (b.type === 'wander') npc.target = null;
    else if (b.type === 'route') {
      npc.wp = (npc.wp + npc.wpDir + b.points.length) % b.points.length;
      npc.waitingSince = -1;
    } else {
      // Idle NPCs that got nudged simply snap home.
      npc.sprite.setPosition(npc.home.x, npc.home.y);
    }
  }

  /** NPCs near a point, nearest first, optionally only those free for an event. */
  near(x: number, y: number, radius: number, freeOnly = false): Npc[] {
    return this.npcs
      .filter((n) => Math.hypot(n.x - x, n.y - y) <= radius && (!freeOnly || (n.state === 'active' && n.def.behaviour.type !== 'chat')))
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  }
}
