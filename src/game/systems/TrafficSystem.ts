import Phaser from 'phaser';
import { G, groundAt, PROPS } from '../../data/map';
import { JUNCTIONS, ROUTES, TRAFFIC, VEHICLE_SIZE, type TrafficSpawn } from '../../data/roads';
import { trafficTarget } from '../../logic/dayClock';
import { carPosition, queueLength, resolveDeadlocks, signalState, stepCar, type Obstacle, type Route, type TrafficCar } from '../../logic/traffic';
import { audio } from '../audio';
import { AMBULANCE_VARIANT, POLICE_VARIANT } from '../art/vehicles';
import { t, TILE } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

export interface CarEntity {
  logic: TrafficCar;
  spawn: TrafficSpawn;
  sprite: Phaser.Physics.Arcade.Image;
  active: boolean;
  honkCd: number;
  horizontal: boolean;
}

function placeAlong(route: Route, frac: number) {
  const pts = route.points;
  const segs = route.loop ? pts.length : pts.length - 1;
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    lens.push(Math.hypot(b.x - a.x, b.y - a.y));
    total += lens[i];
  }
  let d = frac * total;
  for (let i = 0; i < segs; i++) {
    if (d <= lens[i]) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const k = d / lens[i];
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, wp: (i + 1) % pts.length, heading: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    d -= lens[i];
  }
  return { x: pts[0].x, y: pts[0].y, wp: 1, heading: 0 };
}

export class TrafficSystem {
  readonly cars: CarEntity[] = [];
  readonly group: Phaser.Physics.Arcade.Group;
  private statics: Obstacle[] = [];
  private signals: Array<{ sprite: Phaser.GameObjects.Image; junction: string; axis: 'ew' | 'ns' }> = [];
  private respawnTimer = 0;
  /** Police and ambulance: flashing roof lights and sirens. */
  private emergency: CarEntity[] = [];
  private flashT = 0;
  private flash = false;
  private sirenAt = 0;
  /** The police siren is on while answering an accident (and now and then on patrol). */
  policeSiren = false;
  private signalTimer = 0;

  constructor(private scene: WorldScene) {
    this.group = scene.physics.add.group({ immovable: true, allowGravity: false });
    for (const spawn of TRAFFIC) {
      const route = ROUTES.find((r) => r.id === spawn.route)!;
      const size = VEHICLE_SIZE[spawn.type];
      const at = placeAlong(route, spawn.at);
      const logic: TrafficCar = {
        id: spawn.id,
        route,
        wp: at.wp,
        x: at.x,
        y: at.y,
        heading: at.heading,
        speed: size.maxSpeed * 0.6,
        maxSpeed: size.maxSpeed * (0.85 + ((spawn.id.charCodeAt(2) % 4) * 0.08)),
        halfLen: size.halfLen,
        halfWidth: size.halfWidth,
        lateral: 0,
        squeezeUntil: 0,
        squeezeSide: 0,
        blockedBy: null,
        blockTime: 0,
        stuckTime: 0,
        ghostUntil: 0,
        done: false,
      };
      const sprite = scene.physics.add.image(at.x, at.y, `veh_${spawn.type}_${spawn.variant}`);
      this.group.add(sprite);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);
      body.moves = false;
      sprite.setData('car', spawn.id);
      const car: CarEntity = { logic, spawn, sprite, active: true, honkCd: 0, horizontal: true };
      this.setBodyOrientation(car, true);
      this.cars.push(car);
    }
    this.emergency = this.cars.filter((c) => c.spawn.type === 'car' && (c.spawn.variant === POLICE_VARIANT || c.spawn.variant === AMBULANCE_VARIANT));
    // Road props (cones, barriers) and the junction cow are squeezable obstacles.
    for (const p of PROPS) {
      if ((p.kind === 'cone' || p.kind === 'barrier') && groundAt(scene.ground, t(p.x), t(p.y) - 2) === G.Road)
        this.statics.push({ id: `prop_${p.x}_${p.y}`, kind: 'static', x: t(p.x), y: t(p.y) - 3, radius: 6, squeeze: true });
    }
    // Signal heads at junction corners.
    for (const j of JUNCTIONS) {
      const corners: Array<[number, number, 'ew' | 'ns']> = [
        [j.x0 - 26, j.y0 - 22, 'ns'],
        [j.x1 + 26, j.y1 + 32, 'ns'],
        [j.x1 + 26, j.y0 - 22, 'ew'],
        [j.x0 - 26, j.y1 + 32, 'ew'],
      ];
      for (const [x, y, axis] of corners) {
        const sprite = scene.add.image(x, y, 'signal_red').setOrigin(0.5, 1).setDepth(y);
        this.signals.push({ sprite, junction: j.id, axis });
      }
    }
  }

  addObstacle(o: Obstacle) {
    this.statics.push(o);
  }

  removeObstacle(id: string) {
    this.statics = this.statics.filter((o) => o.id !== id);
  }

  byId(id: string) {
    return this.cars.find((c) => c.spawn.id === id);
  }

  /** Is any active vehicle within `r` px of (x, y)? Stops at the first one found. */
  anyCarWithin(x: number, y: number, r: number) {
    const r2 = r * r;
    for (const c of this.cars) if (c.active && (c.sprite.x - x) ** 2 + (c.sprite.y - y) ** 2 < r2) return true;
    return false;
  }

  nearestCarDistance(x: number, y: number) {
    let best = Infinity;
    for (const c of this.cars) if (c.active) best = Math.min(best, Math.hypot(c.sprite.x - x, c.sprite.y - y));
    return best;
  }

  private setBodyOrientation(car: CarEntity, horizontal: boolean) {
    car.horizontal = horizontal;
    const { halfLen, halfWidth } = car.logic;
    const body = car.sprite.body as Phaser.Physics.Arcade.Body;
    const w = horizontal ? halfLen * 2 : halfWidth * 2;
    const h = horizontal ? halfWidth * 2 : halfLen * 2;
    body.setSize(w, h, false);
    body.setOffset(car.sprite.width / 2 - w / 2, car.sprite.height / 2 - h / 2);
  }

  private buildObstacles(): Obstacle[] {
    const s = this.scene;
    const obs: Obstacle[] = [];
    for (const c of this.cars) {
      if (!c.active) continue;
      const p = carPosition(c.logic);
      obs.push({ id: c.spawn.id, kind: 'vehicle', x: p.x, y: p.y, radius: c.logic.halfLen * 0.9 });
    }
    if (s.mode.kind === 'walk') {
      const f = s.playerFeet();
      obs.push({ id: 'player', kind: 'player', x: f.x, y: f.y - 3, radius: 5 });
    }
    for (const v of s.vehicles.list) {
      const driving = s.mode.kind === 'drive' && s.mode.vehicleId === v.def.id;
      obs.push({ id: v.def.id, kind: driving ? 'playerVehicle' : 'static', x: v.sprite.x, y: v.sprite.y, radius: v.def.halfLen, squeeze: !driving });
    }
    for (const n of s.npcs.npcs) {
      const g = groundAt(s.ground, n.x, n.y);
      if (g === G.Road) obs.push({ id: n.id, kind: 'ped', x: n.x, y: n.y - 3, radius: 5 });
    }
    return obs.concat(this.statics);
  }

  update(dt: number, now: number) {
    const obstacles = this.buildObstacles();
    const env = { now, obstacles, boxes: JUNCTIONS };
    for (const c of this.cars) if (c.active) stepCar(c.logic, env, dt);
    resolveDeadlocks(
      this.cars.filter((c) => c.active).map((c) => c.logic),
      now,
    );
    const cam = this.scene.cameras.main.worldView;
    for (const c of this.cars) {
      if (!c.active) continue;
      const l = c.logic;
      if (l.done) {
        c.active = false;
        c.sprite.setVisible(false);
        (c.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
        continue;
      }
      const p = carPosition(l);
      c.sprite.setPosition(p.x, p.y);
      c.sprite.setRotation(l.heading);
      c.sprite.setDepth(p.y + l.halfWidth);
      const horizontal = Math.abs(Math.cos(l.heading)) > 0.7;
      if (horizontal !== c.horizontal) this.setBodyOrientation(c, horizontal);
      (c.sprite.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      this.reactToBlocking(c, now, cam);
    }
    this.updateEmergency(dt, now);
    this.respawnTimer -= dt;
    if (this.respawnTimer <= 0) {
      this.respawnTimer = 0.5;
      this.respawn(cam);
    }
    this.signalTimer -= dt;
    if (this.signalTimer <= 0) {
      this.signalTimer = 0.2;
      for (const sig of this.signals) {
        const j = JUNCTIONS.find((x) => x.id === sig.junction)!;
        const st = signalState(now, j.timing, j.offset);
        sig.sprite.setTexture(`signal_${st[sig.axis]}`);
      }
    }
  }

  /** Take a vehicle out of the flow; it comes back later through the normal respawn. */
  retire(c: CarEntity) {
    c.active = false;
    c.sprite.setVisible(false);
    (c.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  isEmergency(c: CarEntity) {
    return this.emergency.includes(c);
  }

  private updateEmergency(dt: number, now: number) {
    this.flashT -= dt;
    if (this.flashT <= 0) {
      this.flashT = 0.25;
      this.flash = !this.flash;
      for (const c of this.emergency) if (c.active) c.sprite.setTexture(`veh_car_${c.spawn.variant}${this.flash ? 'b' : ''}`);
    }
    if (now < this.sirenAt) return;
    this.sirenAt = now + 1350;
    const s = this.scene;
    const p = s.playerFeet();
    if (Math.random() < 0.02) this.policeSiren = !this.policeSiren;
    for (const c of this.emergency) {
      if (!c.active) continue;
      const police = c.spawn.variant === POLICE_VARIANT;
      if (police && !this.policeSiren) continue;
      const d = Math.hypot(c.sprite.x - p.x, c.sprite.y - p.y);
      if (d > 560) continue;
      audio.siren(police ? 'police' : 'ambulance', 1 - d / 560, (c.sprite.x - p.x) / 400);
      // Someone nearby comments on it, now and then.
      const [n] = s.npcs.near(c.sprite.x, c.sprite.y, 110, true);
      if (n && Math.random() < 0.25) s.talk.speak(n, ['siren'], now, false, 8000);
    }
  }

  private reactToBlocking(c: CarEntity, now: number, cam: Phaser.Geom.Rectangle) {
    const l = c.logic;
    const b = l.blockedBy;
    const s = this.scene;
    if (!b) {
      if (Math.abs(l.lateral) > 6 && now > c.honkCd && Math.random() < 0.01) this.honk(c, now, 0.6);
      return;
    }
    if (b.kind === 'player' || b.kind === 'playerVehicle') {
      if (l.blockTime > 0.7 && now > c.honkCd) this.honk(c, now);
      if (l.blockTime > 2.6) {
        s.react({ type: 'player_block_vehicle', actorId: c.spawn.id, x: c.sprite.x, y: c.sprite.y, level: l.blockTime > 8 ? 2 : 1 });
        if (queueLength(this.cars.filter((x) => x.active).map((x) => x.logic), c.spawn.id) >= 2)
          s.react({ type: 'queue_grow', x: c.sprite.x, y: c.sprite.y });
      }
    } else if (b.kind === 'ped' && l.blockTime > 1.5 && now > c.honkCd) {
      this.honk(c, now, 0.6);
    } else if (b.kind === 'vehicle' && l.blockTime > 4 && now > c.honkCd && Math.random() < 0.004 && cam.contains(c.sprite.x, c.sprite.y)) {
      // Bengaluru tradition: honk at the jam, just in case it helps.
      this.honk(c, now, 0.5);
    }
  }

  honk(c: CarEntity, now: number, loudness = 1) {
    c.honkCd = now + 2600 + Math.random() * 1500;
    const cam = this.scene.cameras.main.worldView;
    const d = Math.hypot(c.sprite.x - cam.centerX, c.sprite.y - cam.centerY);
    const vol = Math.max(0, 1 - d / 520) * loudness;
    audio.honk(c.spawn.type, vol, (c.sprite.x - cam.centerX) / (cam.width / 2));
    if (vol > 0.25) {
      const word = c.spawn.type === 'auto' ? 'pom pom!' : c.spawn.type === 'bus' ? 'BAAAP!' : c.spawn.type === 'scooter' ? 'peep peep!' : 'HONK!';
      honkBubble(this.scene, c, word, now);
    }
  }

  private respawn(cam: Phaser.Geom.Rectangle) {
    const view = new Phaser.Geom.Rectangle(cam.x - 80, cam.y - 80, cam.width + 160, cam.height + 160);
    // Rush hour fills the roads; late at night most vehicles go home (only ever out of sight).
    const target = trafficTarget(this.scene.dayNight.minutes, this.cars.length);
    let active = this.cars.filter((c) => c.active).length;
    if (active > target) {
      // Any vehicle out of sight, chosen at random so no single road empties out.
      const spares = this.cars.filter((c) => c.active && !this.isEmergency(c) && !view.contains(c.sprite.x, c.sprite.y));
      if (spares.length) this.retire(spares[Math.floor(Math.random() * spares.length)]);
      return;
    }
    for (const c of this.cars) {
      if (c.active) continue;
      if (active >= target) return;
      const start = c.logic.route.points[0];
      if (view.contains(start.x, start.y)) continue;
      if (this.nearestCarDistance(start.x, start.y) < 70) continue;
      const l = c.logic;
      const next = l.route.points[1];
      Object.assign(l, { x: start.x, y: start.y, wp: 1, done: false, speed: l.maxSpeed * 0.7, lateral: 0, squeezeUntil: 0, blockTime: 0, stuckTime: 0, blockedBy: null });
      l.heading = Math.atan2(next.y - start.y, next.x - start.x);
      c.active = true;
      c.sprite.setVisible(true);
      (c.sprite.body as Phaser.Physics.Arcade.Body).enable = true;
      active++;
    }
  }

  /** Lane-blocking roadworks for events. Returns obstacle ids for removal. */
  roadworkObstacles(x: number, y: number, axis: 'h' | 'v'): Obstacle[] {
    const out: Obstacle[] = [];
    for (let i = -1; i <= 1; i++) {
      out.push({
        id: `rw_${x}_${y}_${i}`,
        kind: 'static',
        x: axis === 'h' ? x + i * TILE * 0.8 : x,
        y: axis === 'h' ? y : y + i * TILE * 0.8,
        radius: 7,
        squeeze: true,
      });
    }
    return out;
  }
}

function honkBubble(scene: WorldScene, c: CarEntity, word: string, now: number) {
  scene.bubbles.say(() => (c.active ? { x: c.sprite.x, y: c.sprite.y - 6 } : null), '', word, 900, now, 'honk');
}
