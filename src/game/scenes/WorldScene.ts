import Phaser from 'phaser';
import { BUILDINGS, buildGround, buildSolids, districtAt, PLAYER_SPAWN, PROPS, type District } from '../../data/map';
import { STATIONS } from '../../data/metro';
import { POIS, POI_IDS, poiById } from '../../data/pois';
import { METRO_TRACK } from '../../data/roads';
import { PARKED } from '../../data/vehicles';
import { addHint, checkDiscoveries } from '../../logic/discovery';
import { boxHitsSolids, type Rect } from '../../logic/geometry';
import { pickInteraction, type InteractionCandidate } from '../../logic/interaction';
import { facingFrom, walkVelocity, type DirInput, type Facing } from '../../logic/movement';
import { ReactionEngine, type Reactor, type WorldEvent } from '../../logic/reactionEngine';
import { mulberry32 } from '../../logic/rng';
import { loadSave, safeStorage, writeSave, type Settings, type Stats } from '../../logic/save';
import type { PlayerMode } from '../../logic/vehicleState';
import { inputLocked, uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { bridge } from '../bridge';
import { PLAYER_BODY, t, WALK_SPEED, WORLD_H, WORLD_W } from '../constants';
import { DECAL_PROPS } from '../art/props';
import { BubbleLayer } from '../systems/BubbleLayer';
import { EventSystem } from '../systems/EventSystem';
import { MetroSystem } from '../systems/MetroSystem';
import { NpcSystem, type Npc } from '../systems/NpcSystem';
import { TalkSystem } from '../systems/TalkSystem';
import { TrafficSystem } from '../systems/TrafficSystem';
import { VehicleSystem } from '../systems/VehicleSystem';
import { WeatherSystem } from '../systems/WeatherSystem';

const DEFAULT_SPAWN = { x: t(PLAYER_SPAWN.x), y: t(PLAYER_SPAWN.y) };
const COW = { x: t(80), y: t(19.9) };

type Keys = Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space', Phaser.Input.Keyboard.Key>;

export class WorldScene extends Phaser.Scene {
  // World data
  ground!: Uint8Array;
  solids!: Rect[];
  blockers!: Phaser.Physics.Arcade.StaticGroup;
  // Player
  player!: Phaser.Physics.Arcade.Sprite;
  mode: PlayerMode = { kind: 'walk' };
  private facing: Facing = 'down';
  // Progress
  discovered: string[] = [];
  hinted: string[] = [];
  settings!: Settings;
  stats!: Stats;
  destination: string | null = null;
  district!: District;
  // Systems
  bubbles!: BubbleLayer;
  npcs!: NpcSystem;
  traffic!: TrafficSystem;
  vehicles!: VehicleSystem;
  talk!: TalkSystem;
  weather!: WeatherSystem;
  metro!: MetroSystem;
  worldEvents!: EventSystem;
  reactions = new ReactionEngine(mulberry32(1234));
  /** Scene clock in ms; stops while paused so every cooldown pauses with it. */
  clock = 0;
  locked = false;

  private keys!: Keys;
  private viaduct!: Phaser.GameObjects.Container;
  private marker!: Phaser.GameObjects.Image;
  private markerBob = { y: 0 };
  private candidate: InteractionCandidate | null = null;
  private discoverTimer = 0;
  /** Last on-foot position known to be free; what we save, so reloads never start inside a car or wall. */
  private lastSafe: { x: number; y: number } | null = null;
  private saveTimer = 0;
  private baseZoom = 3;

  constructor() {
    super('world');
  }

  create() {
    this.clock = 0;
    this.mode = { kind: 'walk' };
    const storage = safeStorage();
    const save = loadSave(storage, POI_IDS);
    this.discovered = save.discovered;
    this.hinted = save.hinted;
    this.settings = save.settings;
    this.stats = save.stats;

    this.ground = buildGround();
    this.solids = buildSolids(this.ground);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.buildWorld();

    const spawn = this.safeSpawn(save.lastPosition);
    this.lastSafe = { ...spawn };
    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'char_player', 0);
    this.player.setOrigin(0.5, 22 / 24);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(PLAYER_BODY.w, PLAYER_BODY.h).setOffset(4, 17);
    this.player.setCollideWorldBounds(true);

    const overlay = document.getElementById('world-overlay');
    this.bubbles = new BubbleLayer(overlay ?? document.createElement('div'));
    this.npcs = new NpcSystem(this);
    this.traffic = new TrafficSystem(this);
    this.vehicles = new VehicleSystem(this);
    this.talk = new TalkSystem(this);
    this.weather = new WeatherSystem(this);
    this.metro = new MetroSystem(this);
    this.worldEvents = new EventSystem(this);
    this.traffic.addObstacle({ id: 'cow', kind: 'static', x: COW.x, y: COW.y, radius: 9, squeeze: true });

    this.setupColliders();
    this.setupInput();
    this.setupCamera();

    this.district = districtAt(spawn.x, spawn.y);
    uiStore.set({
      ready: true,
      discovered: this.discovered,
      hinted: this.hinted,
      settings: this.settings,
      stats: { ...this.stats },
      area: { name: this.district.name, tagline: this.district.tagline },
      mode: 'walk',
      vehicleName: null,
      dialogue: null,
      metro: null,
      narration: null,
      destination: null,
      raining: false,
    });
    audio.apply(this.settings);
    this.installApi();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.teardown());
  }

  // ── World construction

  private buildWorld() {
    this.add.image(0, 0, 'groundTex').setOrigin(0).setDepth(-100);

    for (const b of BUILDINGS) this.add.image(t(b.x), t(b.y), `bld_${b.id}`).setOrigin(0).setDepth(t(b.y + b.h));
    for (const p of PROPS) {
      const key = p.kind === 'hoarding' ? `prop_hoarding_${p.text}` : `prop_${p.kind}`;
      const img = this.add.image(t(p.x), t(p.y), key);
      if (DECAL_PROPS.has(p.kind)) img.setOrigin(0.5).setDepth(-50);
      else img.setOrigin(0.5, 1).setDepth(t(p.y));
    }
    this.blockers = this.physics.add.staticGroup();
    for (const r of this.solids) {
      const z = this.add.zone(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
      this.physics.add.existing(z, true);
      this.blockers.add(z);
    }
    for (const v of PARKED)
      this.add.image(t(v.x), t(v.y), `veh_${v.type}_${v.variant}`).setRotation(v.heading).setDepth(t(v.y) + 6);
    // Resting cow at the junction (solid, and traffic squeezes around her).
    this.add.image(COW.x, COW.y + 6, 'cow').setOrigin(0.5, 1).setDepth(COW.y + 6);
    const cz = this.add.zone(COW.x, COW.y, 18, 8);
    this.physics.add.existing(cz, true);
    this.blockers.add(cz);

    // Elevated metro viaduct with station canopies.
    const vy = METRO_TRACK[0].y;
    this.add.rectangle(WORLD_W / 2, vy + 14, WORLD_W, 6, 0x14101e, 0.18).setDepth(-40);
    this.viaduct = this.add.container(0, 0).setDepth(8000);
    this.viaduct.add(this.add.tileSprite(0, vy - 11, WORLD_W, 22, 'viaduct').setOrigin(0));
    for (const st of STATIONS) this.viaduct.add(this.add.image(st.platform.x, vy, 'platform').setOrigin(0.5, 0.55));
    for (let x = 48; x < WORLD_W; x += 160) this.add.rectangle(x, vy + 2, 6, 6, 0x8f8a83).setDepth(vy + 2);

    this.marker = this.add.image(0, 0, 'marker').setOrigin(0.5, 1).setDepth(8500).setVisible(false);
    this.tweens.add({ targets: this.markerBob, y: -5, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private safeSpawn(saved: { x: number; y: number } | null) {
    if (saved && saved.x > 8 && saved.y > 8 && saved.x < WORLD_W - 8 && saved.y < WORLD_H - 8 && !boxHitsSolids(saved.x, saved.y - 3, 5, 4, this.solids))
      return saved;
    return DEFAULT_SPAWN;
  }

  private setupColliders() {
    const p = this.player;
    this.physics.add.collider(p, this.blockers);
    this.physics.add.collider(p, this.npcs.group, (_a, b) => {
      const npc = (b as Phaser.GameObjects.GameObject).getData('npc') as Npc;
      const v = (p.body as Phaser.Physics.Arcade.Body).velocity;
      if (npc && v.length() > 10) this.react({ type: 'player_bump', actorId: npc.id, x: npc.x, y: npc.y });
    });
    this.physics.add.collider(p, this.traffic.group, (_a, b) => {
      const id = (b as Phaser.GameObjects.GameObject).getData('car') as string;
      const v = (p.body as Phaser.Physics.Arcade.Body).velocity;
      if (v.length() > 10) this.react({ type: 'player_bump_vehicle', actorId: id, x: p.x, y: p.y });
    });
    this.physics.add.collider(p, this.vehicles.group);
    this.physics.add.collider(this.npcs.group, this.blockers);
    this.physics.add.collider(this.vehicles.group, this.blockers);
    this.physics.add.collider(this.vehicles.group, this.vehicles.group);
    this.physics.add.collider(this.vehicles.group, this.traffic.group, (_a, b) => {
      this.vehicles.crashed((b as Phaser.GameObjects.GameObject).getData('car') as string, this.clock);
    });
    this.physics.add.collider(this.vehicles.group, this.npcs.group, (_a, b) => {
      const npc = (b as Phaser.GameObjects.GameObject).getData('npc') as Npc;
      const v = this.vehicles.driving();
      if (!npc || !v) return;
      v.speed *= 0.3;
      this.react({ type: 'player_bump', actorId: npc.id, x: npc.x, y: npc.y });
    });
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({ up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D, space: K.SPACE }) as Keys;
    kb.on('keydown-E', () => this.interact());
    kb.on('keydown-H', () => {
      if (!this.locked) this.vehicles.horn(this.clock);
    });
    // Release keys when the window loses focus so the player never keeps walking on their own.
    const blur = () => kb.resetKeys();
    window.addEventListener('blur', blur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('blur', blur));
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.15, 0.15);
    this.applyBaseZoom(false);
    const onResize = () => this.applyBaseZoom(true);
    this.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, onResize));
  }

  private applyBaseZoom(animate: boolean) {
    const h = this.scale.height;
    this.baseZoom = Phaser.Math.Clamp(Math.floor(h / 260), 2, 5);
    this.setZoomForMode(animate);
  }

  setZoomForMode(animate = true) {
    const z = this.mode.kind === 'drive' ? Math.max(2, this.baseZoom - 1) : this.baseZoom;
    if (animate) this.cameras.main.zoomTo(z, 450, 'Sine.easeInOut');
    else this.cameras.main.setZoom(z);
  }

  shake(intensity: number) {
    if (this.settings.screenShake) this.cameras.main.shake(140, intensity);
  }

  // ── Bridge for React

  private installApi() {
    bridge.api = {
      chooseOption: (i) => this.talk.choose(i),
      closeDialogue: () => this.talk.close(),
      travel: (id) => this.metro.travel(id),
      closeMetro: () => this.metro.cancel(),
      closeNarration: () => uiStore.set({ narration: null }),
      setDestination: (id) => this.setDestination(id),
      setPaused: (paused) => {
        audio.suspend(paused);
        if (paused) {
          this.persist();
          this.scene.pause();
        } else this.scene.resume();
      },
      updateSettings: (patch) => {
        this.settings = { ...this.settings, ...patch };
        audio.apply(this.settings);
        uiStore.set({ settings: this.settings });
        this.persist();
      },
      snapshot: () => {
        const v = this.vehicles?.driving();
        const metro = this.mode.kind === 'metro';
        const x = metro ? this.metro.train.x : v ? v.sprite.x : this.player.x;
        const y = metro ? this.metro.train.y : v ? v.sprite.y : this.player.y;
        const angle = v ? v.heading : ({ down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 } as const)[this.facing];
        return { x, y, angle, driving: !!v, rideables: this.vehicles.list.filter((r) => !r.occupied).map((r) => ({ x: r.sprite.x, y: r.sprite.y })) };
      },
      saveNow: () => this.persist(),
    };
  }

  private teardown() {
    bridge.api = null;
    this.bubbles?.clear();
    audio.stopAll();
  }

  // ── Shared helpers used by systems

  playerFeet() {
    const v = this.mode.kind === 'drive' ? this.vehicles.driving() : null;
    if (v) return { x: v.sprite.x, y: v.sprite.y };
    return { x: this.player.x, y: this.player.y };
  }

  /** Feed a world event through the reaction engine and apply what comes back. */
  react(e: WorldEvent) {
    const now = this.clock;
    const actors: Reactor[] = [];
    const R = 420;
    for (const n of this.npcs.npcs)
      if (Math.hypot(n.x - e.x, n.y - e.y) < R || n.id === e.actorId || e.type === 'rain_start' || e.type === 'rain_stop')
        actors.push({ id: n.id, kind: 'npc', x: n.x, y: n.y, busy: n.busy });
    for (const c of this.traffic.cars)
      if (c.active && (Math.hypot(c.sprite.x - e.x, c.sprite.y - e.y) < R || c.spawn.id === e.actorId))
        actors.push({ id: c.spawn.id, kind: 'vehicle', x: c.sprite.x, y: c.sprite.y, busy: false });
    const p = this.playerFeet();
    for (const r of this.reactions.handle(e, actors, now)) {
      const npc = this.npcs.byId(r.actorId);
      const car = npc ? undefined : this.traffic.byId(r.actorId);
      for (const a of r.actions) {
        if (npc) {
          if (a === 'startle') this.npcs.startle(npc, p.x, p.y, now);
          else if (a === 'shelter') this.npcs.seekShelter(npc);
          else if (a === 'resume') this.npcs.resume(npc);
          else if (a === 'say' && r.category) {
            const cats = r.category === 'ambient' ? npc.def.categories : [r.category];
            this.talk.speak(npc, cats, now, r.category === 'ambient', r.category === 'ambient' ? 20000 : 6000);
          }
        } else if (car) {
          if (a === 'honk' && now > car.honkCd) this.traffic.honk(car, now);
          else if (a === 'say' && r.category) this.talk.speakDriver(car.spawn.id, () => (car.active ? { x: car.sprite.x, y: car.sprite.y - 10 } : null), [r.category], now);
        }
      }
    }
  }

  hint(id: string) {
    const res = addHint({ discovered: this.discovered, hinted: this.hinted }, id);
    if (!res.isNew) return;
    this.hinted = res.state.hinted;
    const poi = poiById(id);
    uiStore.set({ hinted: this.hinted });
    uiStore.toast({ kind: 'hint', title: `New tip: ${poi?.name ?? id}`, body: 'Marked with a ? on your map. Press J to set it as a destination.' });
    audio.chime('hint');
    this.persist();
  }

  setDestination(id: string | null) {
    this.destination = id && poiById(id) ? id : null;
    uiStore.set({ destination: this.destination });
  }

  persist() {
    if (!bridge.api) return; // scene is shutting down (quit or reset)
    const storage = safeStorage();
    if (this.mode.kind === 'walk' && this.player && this.vehicles?.spotFree(this.player.x, this.player.y)) this.lastSafe = { x: this.player.x, y: this.player.y };
    const lastPosition = this.lastSafe;
    writeSave(storage, {
      version: 2,
      discovered: this.discovered,
      hinted: this.hinted,
      settings: this.settings,
      stats: this.stats,
      lastPosition,
      savedAt: Date.now(),
    });
    uiStore.set({ stats: { ...this.stats } });
  }

  // ── Interaction

  private candidates(): InteractionCandidate[] {
    const out: InteractionCandidate[] = [];
    if (this.mode.kind === 'drive') {
      const v = this.vehicles.driving()!;
      out.push({ id: 'exit', kind: 'exitVehicle', x: v.sprite.x, y: v.sprite.y, radius: Infinity, label: 'Get out' });
      return out;
    }
    if (this.mode.kind !== 'walk') return out;
    for (const s of STATIONS) out.push({ id: `metro:${s.id}`, kind: 'metro', x: s.entrance.x, y: s.entrance.y, radius: 30, label: `${s.name} Metro` });
    for (const v of this.vehicles.list)
      if (!v.occupied) out.push({ id: `veh:${v.def.id}`, kind: 'vehicle', x: v.sprite.x, y: v.sprite.y, radius: v.def.halfLen + 16, label: `Drive ${v.def.name}` });
    for (const n of this.npcs.npcs)
      if (n.def.interactable !== false && !n.busy && n.state !== 'goto')
        out.push({ id: `npc:${n.id}`, kind: 'npc', x: n.x, y: n.y - 4, radius: n.def.reach ?? 26, label: `Talk · ${n.name}` });
    out.push({ id: 'cow', kind: 'object', x: COW.x, y: COW.y, radius: 32, label: 'Say hello to Gowri' });
    const ball = this.worldEvents.ball;
    if (ball && !ball.done) out.push({ id: 'ball', kind: 'object', x: ball.sprite.x, y: ball.sprite.y, radius: 26, label: 'Throw the ball back' });
    return out;
  }

  private interact() {
    if (this.locked) return;
    if (this.mode.kind === 'drive') {
      this.vehicles.exit();
      return;
    }
    const c = this.candidate;
    if (!c) return;
    const [kind, id] = c.id.split(':');
    audio.chime('ui');
    if (kind === 'metro') this.metro.open(id);
    else if (kind === 'veh') {
      const v = this.vehicles.byId(id);
      if (v) this.vehicles.enter(v);
    } else if (kind === 'npc') {
      const n = this.npcs.byId(id);
      if (n) this.talk.open(n);
    } else if (c.id === 'cow') {
      uiStore.set({
        narration: {
          title: 'Gowri the cow',
          text: 'Gowri blinks slowly. She has rested at this junction since before the flyover was planned. Autos, buses and techies flow around her like water around a rock. She has right of way. Always.',
        },
      });
    } else if (c.id === 'ball') this.worldEvents.throwBall();
  }

  private readInput(): DirInput {
    const k = this.keys;
    return {
      up: k.up.isDown || k.w.isDown,
      down: k.down.isDown || k.s.isDown,
      left: k.left.isDown || k.a.isDown,
      right: k.right.isDown || k.d.isDown,
    };
  }

  // ── Main loop

  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    this.clock += dt * 1000;
    const now = this.clock;
    const ui = uiStore.get();
    const wasLocked = this.locked;
    this.locked = inputLocked(ui);
    if (this.locked !== wasLocked) {
      // Panels own the keyboard while open (arrow keys on sliders, scrolling the journal).
      const kb = this.input.keyboard!;
      if (this.locked) kb.disableGlobalCapture();
      else kb.enableGlobalCapture();
    }
    const input = this.readInput();

    if (this.mode.kind === 'walk') {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      const v = this.locked ? { vx: 0, vy: 0 } : walkVelocity(input, WALK_SPEED);
      body.setVelocity(v.vx, v.vy);
      if (v.vx || v.vy) {
        this.facing = facingFrom(v.vx, v.vy, this.facing);
        this.player.anims.play(`player_walk_${this.facing}`, true);
      } else {
        this.player.anims.stop();
        this.player.setFrame(['down', 'left', 'right', 'up'].indexOf(this.facing) * 3);
      }
      this.player.setDepth(this.player.y);
    }

    this.npcs.update(dt, now);
    this.traffic.update(dt, now);
    this.vehicles.update(dt, now, input, this.locked, this.keys.space.isDown);
    this.talk.update(now, dt);
    this.weather.update(dt, now);
    this.metro.update(dt, now);
    this.worldEvents.update(dt, now);

    // Interaction prompt
    const p = this.playerFeet();
    this.candidate = this.locked || this.mode.kind === 'metro' ? null : pickInteraction(this.candidates(), p.x, p.y, false);
    if (this.candidate && this.candidate.kind !== 'exitVehicle') this.bubbles.setPrompt({ x: this.candidate.x, y: this.candidate.y }, this.candidate.label);
    else if (this.candidate) this.bubbles.setPrompt({ x: p.x, y: p.y + 6 }, 'Get out');
    else this.bubbles.setPrompt(null);

    // Viaduct fades when you're underneath it.
    const vy = METRO_TRACK[0].y;
    const under = Math.abs(p.y - vy) < 34 && this.mode.kind !== 'metro';
    this.viaduct.setAlpha(Phaser.Math.Linear(this.viaduct.alpha, under ? 0.35 : 1, 0.15));
    this.metro.train.setAlpha(this.viaduct.alpha);

    this.discoverTimer -= dt;
    if (this.discoverTimer <= 0) {
      this.discoverTimer = 0.25;
      this.checkPlace(p.x, p.y);
    }
    this.updateDestination(p.x, p.y);
    this.bubbles.update(this.cameras.main, now, ui.panel === 'pause' || ui.panel === 'map');

    this.saveTimer -= dt;
    if (this.saveTimer <= 0) {
      this.saveTimer = 15;
      this.persist();
    }
  }

  private checkPlace(x: number, y: number) {
    if (this.mode.kind === 'metro') return;
    const d = districtAt(x, y);
    if (d.id !== this.district?.id) {
      this.district = d;
      uiStore.set({ area: { name: d.name, tagline: d.tagline } });
    }
    const res = checkDiscoveries({ discovered: this.discovered, hinted: this.hinted }, POIS, x, y);
    if (!res.found.length) return;
    this.discovered = res.state.discovered;
    this.hinted = this.hinted.filter((h) => !this.discovered.includes(h));
    for (const poi of res.found) {
      uiStore.toast({ kind: 'discover', title: `Discovered: ${poi.name}`, body: poi.description }, 5200);
      if (poi.kind === 'food') this.react({ type: 'food_visit', x, y });
    }
    audio.chime('discover');
    uiStore.set({ discovered: this.discovered, hinted: this.hinted });
    this.persist();
  }

  private updateDestination(x: number, y: number) {
    const poi = this.destination ? poiById(this.destination) : null;
    if (!poi || !this.settings.showMarkers) {
      this.marker.setVisible(false);
      this.bubbles.setDestination(null);
      return;
    }
    this.marker.setVisible(true).setPosition(poi.x, poi.y - 18 + this.markerBob.y);
    this.bubbles.setDestination({ x: poi.x, y: poi.y, label: poi.name });
    if (Math.hypot(poi.x - x, poi.y - y) < Math.min(poi.radius, 40)) {
      uiStore.toast({ kind: 'arrive', title: `You're at ${poi.name}`, body: 'Destination cleared. Keep wandering!' }, 3000);
      audio.chime('arrive');
      this.setDestination(null);
    }
  }
}
