import Phaser from 'phaser';
import { PROPS } from '../../data/map';
import { RIDEABLES, type RideableDef } from '../../data/vehicles';
import { boxHitsSolids } from '../../logic/geometry';
import { stepDrive, type DirInput, type DriveParams } from '../../logic/movement';
import { enterVehicle, exitVehicle, type RideableInfo } from '../../logic/vehicleState';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { PLAYER_BODY, t, WORLD_H, WORLD_W } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

export class Rideable {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  speed = 0;
  heading: number;
  occupied = false;

  constructor(
    scene: Phaser.Scene,
    readonly def: RideableDef,
  ) {
    this.heading = def.heading;
    this.sprite = scene.physics.add.sprite(def.x, def.y, `veh_${def.type}_${def.variant}`);
    this.sprite.setRotation(def.heading);
    const r = Math.max(4, def.halfWidth);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(r, this.sprite.width / 2 - r, this.sprite.height / 2 - r);
    body.setCollideWorldBounds(true);
    this.park();
  }

  park() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.pushable = false;
    body.setImmovable(true);
  }

  info(): RideableInfo {
    return { id: this.def.id, occupied: this.occupied, x: this.sprite.x, y: this.sprite.y, heading: this.heading, speed: this.speed, halfLen: this.def.halfLen, halfWidth: this.def.halfWidth };
  }
}

const POTHOLES = PROPS.filter((p) => p.kind === 'pothole').map((p) => ({ x: t(p.x), y: t(p.y) }));

export class VehicleSystem {
  readonly list: Rideable[] = [];
  readonly group: Phaser.Physics.Arcade.Group;
  private bumpCd = 0;
  private hornCd = 0;
  /** 1 on big screens; lower on phones, where less road is visible ahead. Set by WorldScene with the zoom. */
  speedScale = 1;

  constructor(private scene: WorldScene) {
    this.group = scene.physics.add.group();
    for (const def of RIDEABLES) {
      const r = new Rideable(scene, def);
      this.group.add(r.sprite);
      r.park();
      this.list.push(r);
    }
  }

  byId(id: string) {
    return this.list.find((v) => v.def.id === id);
  }

  /** Driving params for this screen: small screens get a lower top speed (never below a brisk 100). */
  paramsFor(v: Rideable): DriveParams {
    const p = v.def.params;
    if (this.speedScale >= 1) return p;
    return { ...p, maxSpeed: Math.max(Math.min(p.maxSpeed, 100), p.maxSpeed * this.speedScale) };
  }

  driving(): Rideable | null {
    const m = this.scene.mode;
    return m.kind === 'drive' ? (this.byId(m.vehicleId) ?? null) : null;
  }

  enter(v: Rideable) {
    const s = this.scene;
    const f = s.playerFeet();
    const mode = enterVehicle(s.mode, v.info(), f.x, f.y);
    if (!mode) return;
    s.mode = mode;
    v.occupied = true;
    v.speed = 0;
    const body = v.sprite.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(false);
    body.pushable = true;
    s.player.setVisible(false);
    (s.player.body as Phaser.Physics.Arcade.Body).enable = false;
    (s.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    s.cameras.main.startFollow(v.sprite, true, 0.12, 0.12);
    s.setZoomForMode();
    uiStore.set({ mode: 'drive', vehicleName: v.def.name });
    uiStore.toast({ kind: 'info', title: v.def.name, body: v.def.note }, 5200);
    s.stats.drives++;
    s.persist();
    s.react({ type: 'player_enter_vehicle', x: v.sprite.x, y: v.sprite.y });
    audio.engine(0, v.def.type);
  }

  exit(): boolean {
    const s = this.scene;
    const v = this.driving();
    if (!v) return false;
    const res = exitVehicle(s.mode, v.info(), (x, y) => this.spotFree(x, y));
    if (!res.ok) {
      if (res.reason === 'moving') uiStore.toast({ kind: 'info', title: 'Swalpa slow maadi', body: 'Slow down before getting out.' }, 2200);
      else if (res.reason === 'blocked') uiStore.toast({ kind: 'info', title: 'No space here', body: 'Move somewhere with room to open the door.' }, 2200);
      return false;
    }
    s.mode = res.mode;
    v.occupied = false;
    v.speed = 0;
    v.park();
    const pb = s.player.body as Phaser.Physics.Arcade.Body;
    s.player.setPosition(res.x, res.y);
    pb.enable = true;
    pb.reset(res.x, res.y);
    s.player.setVisible(true);
    s.cameras.main.startFollow(s.player, true, 0.15, 0.15);
    s.setZoomForMode();
    uiStore.set({ mode: 'walk', vehicleName: null });
    s.react({ type: 'player_exit_vehicle', x: res.x, y: res.y });
    audio.engine(null);
    return true;
  }

  spotFree(x: number, y: number) {
    if (x < 8 || y < 8 || x > WORLD_W - 8 || y > WORLD_H - 8) return false;
    if (boxHitsSolids(x, y - 3, PLAYER_BODY.w / 2 + 1, PLAYER_BODY.h / 2 + 1, this.scene.solids)) return false;
    return this.scene.traffic.nearestCarDistance(x, y) > 18;
  }

  update(dt: number, now: number, input: DirInput, locked: boolean, handbrake = false) {
    for (const v of this.list) v.sprite.setDepth(v.sprite.y + 6);
    const v = this.driving();
    if (!v) return;
    const body = v.sprite.body as Phaser.Physics.Arcade.Body;
    const none: DirInput = { up: false, down: false, left: false, right: false };
    const params = this.paramsFor(v);
    const next = stepDrive({ speed: v.speed, heading: v.heading }, locked ? none : input, params, dt, locked || handbrake);
    // Scraping a wall bleeds speed instead of stopping dead.
    if (!body.blocked.none && Math.abs(next.speed) > 30) {
      next.speed *= 0.6;
      if (Math.abs(v.speed) > 110 && now > this.bumpCd) {
        this.bumpCd = now + 600;
        audio.thud();
        this.scene.shake(0.004);
      }
    }
    v.speed = next.speed;
    v.heading = next.heading;
    body.setVelocity(Math.cos(v.heading) * v.speed, Math.sin(v.heading) * v.speed);
    v.sprite.setRotation(v.heading);
    // The camera leads the vehicle so the road ahead is on screen (most needed on small phones).
    const cam = this.scene.cameras.main;
    // Each axis leads by a share of the view along it, so a tall phone sees far up and down the road.
    const lead = (v.speed / params.maxSpeed) * 0.3;
    const ease = Math.min(1, dt * 3);
    cam.followOffset.x += (-Math.cos(v.heading) * lead * (cam.width / cam.zoom) - cam.followOffset.x) * ease;
    cam.followOffset.y += (-Math.sin(v.heading) * lead * (cam.height / cam.zoom) - cam.followOffset.y) * ease;
    audio.engine(Math.min(1, Math.abs(v.speed) / params.maxSpeed), v.def.type);
    // Potholes: a proper Bengaluru welcome.
    if (Math.abs(v.speed) > 60 && now > this.bumpCd) {
      for (const p of POTHOLES)
        if (Math.hypot(p.x - v.sprite.x, p.y - v.sprite.y) < 9) {
          this.bumpCd = now + 900;
          audio.thud();
          this.scene.shake(0.006);
          v.speed *= 0.75;
          break;
        }
    }
    // Warn pedestrians ahead when moving quickly.
    if (Math.abs(v.speed) > 50) {
      const fx = Math.cos(v.heading) * Math.sign(v.speed);
      const fy = Math.sin(v.heading) * Math.sign(v.speed);
      for (const n of this.scene.npcs.near(v.sprite.x, v.sprite.y, 46)) {
        const ahead = (n.x - v.sprite.x) * fx + (n.y - v.sprite.y) * fy;
        if (ahead > 4) this.scene.react({ type: 'vehicle_near_ped', actorId: n.id, x: n.x, y: n.y });
      }
    }
  }

  /** Returns true if the horn actually sounded. */
  horn(now: number) {
    const v = this.driving();
    if (!v || now < this.hornCd) return false;
    this.hornCd = now + 450;
    audio.honk(v.def.type, 1);
    this.scene.bubbles.say(() => ({ x: v.sprite.x, y: v.sprite.y - 6 }), '', v.def.type === 'auto' ? 'pom pom!' : v.def.type === 'scooter' ? 'peep!' : 'HONK!', 700, now, 'honk');
    for (const n of this.scene.npcs.near(v.sprite.x, v.sprite.y, 80)) this.scene.react({ type: 'vehicle_near_ped', actorId: n.id, x: n.x, y: n.y });
    return true;
  }

  /** Player-driven vehicle hit a traffic car. */
  crashed(carId: string, now: number) {
    const v = this.driving();
    if (!v) return;
    const fast = Math.abs(v.speed) > 55;
    v.speed *= -0.25;
    if (now > this.bumpCd) {
      this.bumpCd = now + 500;
      audio.thud();
      if (fast) this.scene.shake(0.006);
    }
    const car = this.scene.traffic.byId(carId);
    if (car) this.scene.react({ type: fast ? 'player_vehicle_crash' : 'player_bump_vehicle', actorId: carId, x: car.sprite.x, y: car.sprite.y });
  }
}
