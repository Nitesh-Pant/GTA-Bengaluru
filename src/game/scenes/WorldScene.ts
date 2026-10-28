import Phaser from 'phaser';
import { ACHIEVEMENTS } from '../../data/achievements';
import { DISHES, dishById } from '../../data/food';
import { BUILDINGS, buildGround, buildSolids, districtAt, PLAYER_SPAWN, PROPS, type District } from '../../data/map';
import { STATIONS } from '../../data/metro';
import { POIS, poiById } from '../../data/pois';
import { METRO_TRACK, ROAD_GRID } from '../../data/roads';
import { guideRoute, pointsAlong } from '../../logic/bikeRide';
import { JOB_INFO } from '../../data/jobs';
import { JobSystem } from '../systems/JobSystem';
import { NandiSystem } from '../systems/NandiSystem';
import { AirportSystem } from '../systems/AirportSystem';
import { FestivalSystem } from '../systems/FestivalSystem';
import { PARKED } from '../../data/vehicles';
import { newlyUnlocked } from '../../logic/achievements';
import { addressOf, type PlayerProfile } from '../../logic/player';
import { addHint, checkDiscoveries } from '../../logic/discovery';
import { boxHitsSolids, closest, dist, type Point, type Rect } from '../../logic/geometry';
import { darkness } from '../../logic/dayClock';
import { CHAR_DIRS, CHAR_FRAMES } from '../art/characters';
import { pickInteraction, type InteractionCandidate } from '../../logic/interaction';
import { facingFrom, stickDrive, walkVelocity, type DirInput, type Facing } from '../../logic/movement';
import { ReactionEngine, type Reactor, type WorldEvent } from '../../logic/reactionEngine';
import { mulberry32 } from '../../logic/rng';
import { safeStorage, STAT_KEYS, writeSave, type Settings, type Stats } from '../../logic/save';
import { loadGameSave } from '../../session';
import type { PlayerMode } from '../../logic/vehicleState';
import { inputLocked, uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { bridge, GUIDE_KINDS, type GuideKind } from '../bridge';
import { PLAYER_BODY, t, WALK_SPEED, WORLD_H, WORLD_W } from '../constants';
import { isTouchDevice, touch } from '../touch';
import { DECAL_PROPS, propKey } from '../art/props';
import { BubbleLayer } from '../systems/BubbleLayer';
import { AnimalSystem } from '../systems/AnimalSystem';
import { BusSystem } from '../systems/BusSystem';
import { FareSystem } from '../systems/FareSystem';
import { MatchSystem } from '../systems/MatchSystem';
import { BUS_STOPS } from '../../data/transit';
import { DayNightSystem } from '../systems/DayNightSystem';
import { DeliverySystem } from '../systems/DeliverySystem';
import { RideSystem } from '../systems/RideSystem';
import { addCharacter } from './BootScene';
import { playerLook } from '../../data/player';
import { EventSystem } from '../systems/EventSystem';
import { MetroSystem } from '../systems/MetroSystem';
import { NpcSystem, type Npc } from '../systems/NpcSystem';
import { TalkSystem } from '../systems/TalkSystem';
import { TrafficSystem } from '../systems/TrafficSystem';
import { VehicleSystem } from '../systems/VehicleSystem';
import { WeatherSystem } from '../systems/WeatherSystem';

/** Remembers that this browser has seen the first-time tour. */
export const TOUR_KEY = 'bsam.tourSeen';
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
  tasted: string[] = [];
  achievements: string[] = [];
  /** Who the player is: name, gender (how NPCs address them) and outfit. */
  profile!: PlayerProfile;
  settings!: Settings;
  stats!: Stats;
  destination: string | null = null;
  /** Guide markers owned by jobs (delivery, auto fare), by job id. The newest is shown instead of the destination. */
  readonly guides = new Map<string, { x: number; y: number; label: string }>();
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
  dayNight!: DayNightSystem;
  ride!: RideSystem;
  animals!: AnimalSystem;
  buses!: BusSystem;
  fares!: FareSystem;
  match!: MatchSystem;
  deliveries!: DeliverySystem;
  jobs!: JobSystem;
  nandi!: NandiSystem;
  airport!: AirportSystem;
  festivals!: FestivalSystem;
  reactions = new ReactionEngine(mulberry32(1234));
  /** Scene clock in ms; stops while paused so every cooldown pauses with it. */
  clock = 0;
  locked = false;

  private keys!: Keys;
  private viaduct!: Phaser.GameObjects.Container;
  /** Silk Board's metro flyover, unfinished over the junction itself. */
  private flyover!: Phaser.GameObjects.Container;
  private inSilkBoard = false;
  private marker!: Phaser.GameObjects.Image;
  private markerBob = { y: 0 };
  /** GPS-style dotted route to the active marker (see drawRoute). */
  private routeGfx!: Phaser.GameObjects.Graphics;
  private route: Point[] = [];
  private routeTarget: Point | null = null;
  private routeUntil = 0;
  private candidate: InteractionCandidate | null = null;
  private discoverTimer = 0;
  /** Last on-foot position known to be free; what we save, so reloads never start inside a car or wall. */
  private lastSafe: { x: number; y: number } | null = null;
  private saveTimer = 0;
  private baseZoom = 3;
  private npcBumpAt = 0;
  private statsKey = '';
  /** Reused every frame for the name tag position. */
  private tagAt = { x: 0, y: 0 };

  constructor() {
    super('world');
  }

  create() {
    this.clock = 0;
    this.mode = { kind: 'walk' };
    const storage = safeStorage();
    const save = loadGameSave(storage);
    this.discovered = save.discovered;
    this.hinted = save.hinted;
    this.tasted = save.tasted;
    this.achievements = save.achievements;
    this.profile = uiStore.get().player;
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
    this.bubbles.glosses = this.settings.glosses;
    this.npcs = new NpcSystem(this);
    this.traffic = new TrafficSystem(this);
    this.vehicles = new VehicleSystem(this);
    this.talk = new TalkSystem(this);
    this.weather = new WeatherSystem(this);
    this.metro = new MetroSystem(this);
    this.worldEvents = new EventSystem(this);
    this.dayNight = new DayNightSystem(this, save.timeOfDay);
    this.dayNight.day = save.day;
    this.ride = new RideSystem(this);
    this.animals = new AnimalSystem(this);
    this.buses = new BusSystem(this);
    this.fares = new FareSystem(this);
    this.match = new MatchSystem(this);
    this.deliveries = new DeliverySystem(this);
    this.jobs = new JobSystem(this);
    this.nandi = new NandiSystem(this);
    this.airport = new AirportSystem(this);
    this.festivals = new FestivalSystem(this);
    this.traffic.addObstacle({ id: 'cow', kind: 'static', x: COW.x, y: COW.y, radius: 9, squeeze: true });

    this.setupColliders();
    this.setupInput();
    this.setupCamera();

    this.district = districtAt(spawn.x, spawn.y);
    uiStore.set({
      ready: true,
      discovered: this.discovered,
      hinted: this.hinted,
      tasted: this.tasted,
      achievements: this.achievements,
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
    const who = addressOf(this.profile);
    uiStore.toast(
      this.discovered.length
        ? { kind: 'info', title: `Welcome back, ${who}!`, body: 'Bengaluru missed you. Traffic did not.' }
        : { kind: 'info', title: `Namaskara, ${who}!`, body: 'Bengaluru ge swagatha. No missions: wander, eat, talk. J opens your journal.' },
      5200,
    );
    // First time in the city: the guided tour (also on the Hints button).
    const store = safeStorage();
    try {
      if (store && !store.getItem(TOUR_KEY)) {
        store.setItem(TOUR_KEY, '1');
        uiStore.set({ panel: 'tour' });
      }
    } catch {
      /* storage blocked: skip the automatic tour */
    }
    this.installApi();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.teardown());
  }

  // ── World construction

  private buildWorld() {
    this.add.image(0, 0, 'groundTex').setOrigin(0).setDepth(-100);

    for (const b of BUILDINGS) this.add.image(t(b.x), t(b.y), `bld_${b.id}`).setOrigin(0).setDepth(t(b.y + b.h));
    for (const p of PROPS) {
      const img = this.add.image(t(p.x), t(p.y), propKey(p));
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
    const vw = METRO_TRACK[1].x;
    this.add.rectangle(vw / 2, vy + 14, vw, 6, 0x14101e, 0.18).setDepth(-40);
    this.viaduct = this.add.container(0, 0).setDepth(8000);
    this.viaduct.add(this.add.tileSprite(0, vy - 11, vw, 22, 'viaduct').setOrigin(0));
    for (const st of STATIONS) this.viaduct.add(this.add.image(st.platform.x, vy, 'platform').setOrigin(0.5, 0.55));
    for (let x = 48; x < vw; x += 160) this.add.rectangle(x, vy + 2, 6, 6, 0x8f8a83).setDepth(vy + 2);
    // Silk Board: a metro flyover on both sides of the junction, with the bit over it still missing.
    const fy = t(110);
    this.flyover = this.add.container(0, 0).setDepth(8000);
    for (const [x0, x1] of [
      [116, 129],
      [135, 148],
    ]) {
      this.flyover.add(this.add.tileSprite(t(x0), fy - 11, t(x1 - x0), 22, 'viaduct').setOrigin(0));
      for (let x = x0 + 3; x < x1; x += 6) this.add.rectangle(t(x), fy + 2, 6, 6, 0x8f8a83).setDepth(fy + 2);
    }

    // Pedal boats drifting around Ulsoor Lake.
    for (let i = 0; i < 3; i++) {
      const boat = this.add.image(0, 0, `boat_${i % 2}`);
      const orbit = { a: (i / 3) * Math.PI * 2 };
      const place = () => {
        const x = t(68.5) + Math.cos(orbit.a) * t(5 - i * 1.2);
        const y = t(44.5) + Math.sin(orbit.a) * t(3 - i * 0.6);
        boat.setPosition(x, y).setDepth(y).setRotation(orbit.a + Math.PI / 2);
      };
      place();
      this.tweens.add({ targets: orbit, a: orbit.a + Math.PI * 2, duration: 60000 + i * 15000, repeat: -1, onUpdate: place });
    }

    this.marker = this.add.image(0, 0, 'marker').setOrigin(0.5, 1).setDepth(8500).setVisible(false);
    // On the ground: above road decals and shadows, below people, vehicles and buildings.
    this.routeGfx = this.add.graphics().setDepth(-30);
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
    this.physics.add.collider(this.vehicles.group, this.npcs.group, (a, b) => {
      const npc = (b as Phaser.GameObjects.GameObject).getData('npc') as Npc;
      const v = this.vehicles.driving();
      // Only the vehicle you're driving slows down; an NPC leaning on a parked Yulu is not your problem.
      if (!npc || !v || a !== v.sprite || this.clock < this.npcBumpAt) return;
      // One bump slows you once, instead of dragging you to a crawl for as long as you touch them.
      this.npcBumpAt = this.clock + 600;
      v.speed *= 0.4;
      this.react({ type: 'player_bump', actorId: npc.id, x: npc.x, y: npc.y });
    });
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({ up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D, space: K.SPACE }) as Keys;
    kb.on('keydown-E', () => this.interact());
    kb.on('keydown-H', () => this.honk());
    kb.on('keydown-R', () => this.ride.open());
    kb.on('keydown-F', () => {
      if (!this.locked && !this.travelling) uiStore.set({ panel: 'find' });
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
    // Use the shorter side (width counts a bit more) so phones in portrait still see the street.
    const h = Math.min(this.scale.height, this.scale.width * 0.75);
    this.baseZoom = Phaser.Math.Clamp(Math.floor(h / 260), 2, 5);
    // Phones see less road ahead at the same zoom, so vehicles top out slower there.
    const view = Math.min(this.scale.width, this.scale.height) / this.driveZoom;
    this.vehicles.speedScale = Phaser.Math.Clamp(view / 340, 0.5, 1);
    this.setZoomForMode(animate);
  }

  private get driveZoom() {
    return Math.max(2, this.baseZoom - 1);
  }

  setZoomForMode(animate = true) {
    const z = this.mode.kind === 'drive' ? this.driveZoom : this.baseZoom;
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
        this.bubbles.glosses = this.settings.glosses;
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
        return {
          x,
          y,
          angle,
          driving: !!v,
          rideables: this.vehicles.list.filter((r) => !r.occupied).map((r) => ({ x: r.sprite.x, y: r.sprite.y })),
          target: this.routeTarget,
          route: this.route,
          jobs: this.jobs.spots(),
        };
      },
      saveNow: () => this.persist(),
      interact: () => this.interact(),
      horn: () => this.honk(),
      setProfile: (p) => this.setProfile(p),
      setTime: (m) => {
        if (m < this.dayNight.minutes) this.dayNight.day++; // jumping "back" to morning is tomorrow
        this.dayNight.setMinutes(m);
        this.persist();
      },
      bookRide: (id) => this.ride.book(id),
      openRide: () => this.ride.open(),
      cancelJob: (id) => {
        if (id === 'delivery') this.deliveries.cancel();
      },
      takeBus: (id) => this.buses.take(id),
      showNearest: (kind) => this.showNearest(kind),
      acceptJob: (id, alt) => this.jobs.accept(id, alt),
      snoozeJob: (id) => this.jobs.snooze(id),
      nearestJobs: () => this.jobs.nearest().map(({ kind, label, distance }) => ({ kind, label, distance })),
      showJob: (kind) => {
        const best = this.jobs.nearest().find((j) => j.kind === kind);
        if (!best) return;
        this.guides.set('tour', { ...best.at, label: `${JOB_INFO[kind].name}: ${best.label}` });
        uiStore.toast({ kind: 'hint', title: `Marked: ${JOB_INFO[kind].name}`, body: `${best.label}. Follow the arrow beside you.` }, 3600);
      },
      nearestRides: () =>
        GUIDE_KINDS.flatMap((kind) => {
          const n = this.nearestOf(kind);
          return n ? [{ kind, label: n.item.label, distance: n.distance }] : [];
        }),
    };
  }

  private teardown() {
    bridge.api = null;
    this.bubbles?.clear();
    audio.stopAll();
  }

  // ── Shared helpers used by systems

  /** On the metro or riding pillion: the player isn't walking or driving. */
  get travelling() {
    return this.mode.kind === 'metro' || this.mode.kind === 'ride';
  }

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

  /** Driving through Silk Board junction counts as surviving it (once per pass). */
  private checkSilkBoard(x: number, y: number) {
    const inside = this.mode.kind === 'drive' && x > t(130) && x < t(134) && y > t(108) && y < t(112);
    if (inside && !this.inSilkBoard) {
      this.bump('silkboard');
      if (this.stats.silkboard === 1)
        uiStore.toast({ kind: 'arrive', title: 'You survived Silk Board!', body: 'Bengalureans will respect you now. Tell everyone how long it took. Add twenty minutes.' }, 5200);
    }
    this.inSilkBoard = inside;
  }

  /** The food you're holding (Nandi Hills monkeys know). Set whenever you order something. */
  snack: { name: string; at: number } | null = null;

  /** Stamp a dish in the food book (first time only). */
  taste(id: string) {
    const dish = dishById(id);
    if (dish) this.snack = { name: dish.name, at: this.clock };
    if (!dish || this.tasted.includes(id)) return;
    this.tasted = [...this.tasted, id];
    uiStore.set({ tasted: this.tasted });
    uiStore.toast({ kind: 'taste', title: `Food book: ${dish.name}`, body: `${this.tasted.length}/${DISHES.length} dishes stamped. ${dish.blurb}` }, 4600);
    this.persist();
  }

  private checkAchievements() {
    const fresh = newlyUnlocked(ACHIEVEMENTS, { stats: this.stats, discovered: this.discovered, tasted: this.tasted }, this.achievements);
    if (!fresh.length) return;
    this.achievements = [...this.achievements, ...fresh.map((a) => a.id)];
    uiStore.set({ achievements: this.achievements });
    for (const a of fresh) uiStore.toast({ kind: 'achievement', title: `Achievement: ${a.title}`, body: a.description }, 5200);
    audio.chime('discover');
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
    this.checkAchievements();
    writeSave(storage, {
      version: 2,
      discovered: this.discovered,
      hinted: this.hinted,
      tasted: this.tasted,
      achievements: this.achievements,
      player: this.profile,
      timeOfDay: Math.floor(this.dayNight.minutes),
      day: this.dayNight.day,
      settings: this.settings,
      stats: this.stats,
      lastPosition,
      savedAt: Date.now(),
    });
    // Only tell React when something changed (this runs every 15 s and after many actions).
    const key = STAT_KEYS.map((k) => this.stats[k]).join(',');
    if (key !== this.statsKey) {
      this.statsKey = key;
      uiStore.set({ stats: { ...this.stats } });
    }
  }

  // ── Interaction

  /** Fixed things you can use (metro entrances, bus stops, Gowri): built once. */
  private fixedSpots: InteractionCandidate[] = [
    ...STATIONS.map((st): InteractionCandidate => ({ id: `metro:${st.id}`, kind: 'metro', x: st.entrance.x, y: st.entrance.y, radius: 30, label: `${st.name} Metro` })),
    ...BUS_STOPS.map((b): InteractionCandidate => ({ id: `bus:${b.id}`, kind: 'metro', x: t(b.x), y: t(b.y), radius: 30, label: `BMTC bus stop · ${b.name}` })),
    { id: 'cow', kind: 'object', x: COW.x, y: COW.y, radius: 32, label: 'Say hello to Gowri' },
    { id: 'sunrise', kind: 'object', x: poiById('sunrisepoint')!.x, y: poiById('sunrisepoint')!.y, radius: 34, label: 'Wait for the sunrise' },
  ];

  /** What E could do from here. Only things already within reach are listed, so this stays cheap every frame. */
  private candidates(): InteractionCandidate[] {
    if (this.mode.kind === 'drive') {
      const v = this.vehicles.driving()!;
      return [{ id: 'exit', kind: 'exitVehicle', x: v.sprite.x, y: v.sprite.y, radius: Infinity, label: 'Get out' }];
    }
    if (this.mode.kind !== 'walk') return [];
    const p = this.playerFeet();
    const reach = (x: number, y: number, r: number) => (x - p.x) ** 2 + (y - p.y) ** 2 <= r * r;
    const out = this.fixedSpots.filter((c) => reach(c.x, c.y, c.radius));
    for (const v of this.vehicles.list) {
      const r = v.def.halfLen + 16;
      if (!v.occupied && reach(v.sprite.x, v.sprite.y, r)) out.push({ id: `veh:${v.def.id}`, kind: 'vehicle', x: v.sprite.x, y: v.sprite.y, radius: r, label: `Drive ${v.def.name}` });
    }
    for (const n of this.npcs.npcs) {
      const r = n.def.reach ?? 26;
      if (n.def.interactable !== false && !n.busy && n.state !== 'goto' && reach(n.x, n.y - 4, r))
        out.push({ id: `npc:${n.id}`, kind: 'npc', x: n.x, y: n.y - 4, radius: r, label: `Talk · ${n.name}` });
    }
    for (const d of this.animals.feedable(p.x, p.y)) out.push({ id: `dog:${d.name}`, kind: 'object', x: d.sprite.x, y: d.sprite.y - 6, radius: 28, label: `Give ${d.name} a biscuit` });
    const cow = this.animals.cowNear(p.x, p.y);
    if (cow) out.push({ id: `cow:${cow.name}`, kind: 'object', x: cow.sprite.x, y: cow.sprite.y - 8, radius: 32, label: `Say hello to ${cow.name}` });
    const ball = this.worldEvents.ball;
    if (ball && !ball.done) out.push({ id: 'ball', kind: 'object', x: ball.sprite.x, y: ball.sprite.y, radius: 26, label: 'Throw the ball back' });
    return out;
  }


  private setProfile(p: PlayerProfile) {
    this.profile = p;
    this.player.anims.stop();
    addCharacter(this, 'player', playerLook(p));
    this.player.setTexture('char_player', this.idleFrame());
    uiStore.set({ player: p });
    uiStore.toast({ kind: 'info', title: `New look, ${addressOf(p)}!`, body: 'Sakkath aagi kaantira.' }, 3000);
    this.persist();
  }

  /** The closest bike, auto, bus stop… to the player, with its distance in world px. */
  private nearestOf(kind: GuideKind) {
    const p = this.playerFeet();
    const vehicleType = { yulu: 'scooter', auto: 'auto', car: 'car' } as const;
    const spots: Array<{ x: number; y: number; label: string }> =
      kind === 'bus'
        ? BUS_STOPS.map((b) => ({ x: t(b.x), y: t(b.y), label: `Bus stop: ${b.name}` }))
        : kind === 'metro'
          ? STATIONS.map((st) => ({ x: st.entrance.x, y: st.entrance.y, label: `${st.name} Metro` }))
          : this.vehicles.list.filter((v) => !v.occupied && v.def.type === vehicleType[kind]).map((v) => ({ x: v.sprite.x, y: v.sprite.y, label: v.def.name }));
    return closest(spots, p);
  }

  /** "Show me" / Find a ride: mark the nearest one; the marker clears when you get there. */
  private showNearest(kind: GuideKind) {
    const best = this.nearestOf(kind);
    if (!best) return;
    this.guides.set('tour', best.item);
    uiStore.toast({ kind: 'hint', title: `Marked: ${best.item.label}`, body: 'Follow the arrow beside you. The marker clears when you get there.' }, 3600);
  }

  /** Count something the player did (a ride, a fare, a biscuit…) and save. */
  bump(stat: keyof Stats, by = 1) {
    this.stats[stat] += by;
    this.persist();
  }

  /** Standing frame for the direction the player faces. */
  private idleFrame() {
    return CHAR_DIRS.indexOf(this.facing) * CHAR_FRAMES;
  }

  private honk() {
    if (!this.locked && this.vehicles.horn(this.clock)) this.stats.honks++;
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
    else if (kind === 'bus') this.buses.open(id);
    else if (kind === 'veh') {
      const v = this.vehicles.byId(id);
      if (v) this.vehicles.enter(v);
    } else if (kind === 'npc') {
      const n = this.npcs.byId(id);
      if (n) this.talk.open(n);
    } else if (c.id === 'cow') {
      this.bump('cow');
      uiStore.set({
        narration: {
          title: 'Gowri the cow',
          text: 'Gowri blinks slowly. She has rested at this junction since before the flyover was planned. Autos, buses and techies flow around her like water around a rock. She has right of way. Always.',
        },
      });
    } else if (c.id === 'ball') this.worldEvents.throwBall();
    else if (c.id === 'sunrise') this.nandi.waitForSunrise();
    else if (kind === 'dog') this.animals.feed(id);
    else if (kind === 'cow') {
      this.bump('cow');
      uiStore.toast({ kind: 'info', title: `${id} the cow`, body: 'She chews slowly and looks right through you. Somehow, you feel blessed.' }, 3200);
    }
  }

  private readonly touchUi = isTouchDevice();

  private readInput(): DirInput {
    const k = this.keys;
    return {
      up: k.up.isDown || k.w.isDown || touch.up,
      down: k.down.isDown || k.s.isDown || touch.down,
      left: k.left.isDown || k.a.isDown || touch.left,
      right: k.right.isDown || k.d.isDown || touch.right,
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
        this.player.setFrame(this.idleFrame());
      }
      this.player.setDepth(this.player.y);
    }

    this.npcs.update(dt, now);
    this.traffic.update(dt, now);
    const car = this.vehicles.driving();
    const steer = car && (touch.stick.x || touch.stick.y) ? stickDrive(touch.stick, car, this.vehicles.paramsFor(car)) : input;
    this.vehicles.update(dt, now, steer, this.locked, this.keys.space.isDown || touch.brake);
    this.talk.update(now, dt);
    this.dayNight.update(dt);
    this.ride.update(now);
    this.animals.update(dt, now);
    this.fares.update(now);
    this.match.update(now);
    this.nandi.update(now);
    this.airport.update(now);
    this.festivals.update(now);
    this.deliveries.update(now);
    this.jobs.update(now);
    this.weather.update(dt, now);
    this.metro.update(dt, now);
    this.worldEvents.update(dt, now);

    // Interaction prompt
    const p = this.playerFeet();
    this.candidate = this.locked || this.travelling ? null : pickInteraction(this.candidates(), p.x, p.y, false);
    if (this.candidate && this.candidate.kind !== 'exitVehicle') this.bubbles.setPrompt({ x: this.candidate.x, y: this.candidate.y }, this.candidate.label);
    // Phones have their own Get out button, so the floating E prompt would only mislead there.
    else if (this.candidate && !this.touchUi) this.bubbles.setPrompt({ x: p.x, y: p.y + 6 }, 'Get out');
    else this.bubbles.setPrompt(null);

    // Viaduct fades when you're underneath it.
    const vy = METRO_TRACK[0].y;
    const under = Math.abs(p.y - vy) < 34 && !this.travelling;
    this.viaduct.setAlpha(Phaser.Math.Linear(this.viaduct.alpha, under ? 0.35 : 1, 0.15));
    this.metro.train.setAlpha(this.viaduct.alpha);
    const underFly = Math.abs(p.y - t(110)) < 34 && p.x > t(114) && p.x < t(150);
    this.flyover.setAlpha(Phaser.Math.Linear(this.flyover.alpha, underFly ? 0.35 : 1, 0.15));
    this.checkSilkBoard(p.x, p.y);

    this.discoverTimer -= dt;
    if (this.discoverTimer <= 0) {
      this.discoverTimer = 0.25;
      this.checkPlace(p.x, p.y);
    }
    this.updateDestination(p.x, p.y);
    const tourMark = this.guides.get('tour');
    if (tourMark && (tourMark.x - p.x) ** 2 + (tourMark.y - p.y) ** 2 < 40 * 40) {
      this.guides.delete('tour');
      uiStore.toast({ kind: 'arrive', title: `Here: ${tourMark.label}`, body: 'Press E to use it.' }, 2600);
    }
    if (this.mode.kind === 'walk' || this.mode.kind === 'drive') {
      this.tagAt.x = p.x;
      this.tagAt.y = p.y - (this.mode.kind === 'walk' ? 30 : 24);
      this.bubbles.setNameTag(this.tagAt, this.profile.name);
    } else this.bubbles.setNameTag(null);
    this.bubbles.update(this.cameras.main, now, ui.panel === 'pause' || ui.panel === 'map');

    this.saveTimer -= dt;
    if (this.saveTimer <= 0) {
      this.saveTimer = 15;
      this.persist();
    }
  }

  private checkPlace(x: number, y: number) {
    if (this.travelling) return;
    const d = districtAt(x, y);
    const night = darkness(this.dayNight.minutes) > 0.5;
    const near = (id: string, tiles: number) => {
      const poi = poiById(id)!;
      return dist(poi.x, poi.y, x, y) < t(tiles);
    };
    const leafy = d.id === 'park' || d.id === 'cubbon' || d.id === 'nandi' || near('btmlake', 18);
    audio.setNature({ birds: (leafy || d.id === 'lalbagh') && !night, crickets: night, bell: near('temple', 14) || near('bulltemple', 12), festival: near('pandal', 16) });
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
    const w = [...this.guides.values()].pop();
    if (w) {
      this.marker.setVisible(true).setPosition(w.x, w.y - 18 + this.markerBob.y);
      this.bubbles.setDestination(w, { x, y });
      this.drawRoute(w, x, y);
      return;
    }
    const poi = this.destination ? poiById(this.destination) : null;
    if (!poi || !this.settings.showMarkers) {
      this.marker.setVisible(false);
      this.bubbles.setDestination(null);
      this.drawRoute(null, x, y);
      return;
    }
    this.marker.setVisible(true).setPosition(poi.x, poi.y - 18 + this.markerBob.y);
    this.bubbles.setDestination({ x: poi.x, y: poi.y, label: poi.name }, { x, y });
    this.drawRoute(poi, x, y);
    if (Math.hypot(poi.x - x, poi.y - y) < Math.min(poi.radius, 40)) {
      uiStore.toast({ kind: 'arrive', title: `You're at ${poi.name}`, body: 'Destination cleared. Keep wandering!' }, 3000);
      audio.chime('arrive');
      this.setDestination(null);
    }
  }

  /**
   * A pulsing ring on the marked spot and, if "Route dots" is on in settings, red dots from you to it
   * along the main roads (straight when it's close), drifting towards it. Re-planned twice a second.
   */
  private drawRoute(target: Point | null, x: number, y: number) {
    const g = this.routeGfx;
    g.clear();
    if (!target) {
      this.route = [];
      this.routeTarget = null;
      return;
    }
    g.lineStyle(2, 0xff6b6b, 0.9).strokeCircle(target.x, target.y, 11 + Math.sin(this.clock / 180) * 2.5);
    if (!this.settings.showRoute) {
      this.route = [];
      this.routeTarget = { x: target.x, y: target.y };
      return;
    }
    const moved = !this.routeTarget || this.routeTarget.x !== target.x || this.routeTarget.y !== target.y;
    if (moved || this.clock >= this.routeUntil) {
      this.route = guideRoute({ x, y }, target, ROAD_GRID, t(12));
      this.routeTarget = { x: target.x, y: target.y };
      this.routeUntil = this.clock + 500;
    } else this.route[0] = { x, y };
    const view = this.cameras.main.worldView;
    for (const d of pointsAlong(this.route, 14, (this.clock / 40) % 14)) {
      if (d.x < view.x - 8 || d.y < view.y - 8 || d.x > view.right + 8 || d.y > view.bottom + 8) continue;
      g.fillStyle(0x1c1726, 0.55).fillCircle(d.x, d.y, 3.2);
      g.fillStyle(0xff6b6b, 1).fillCircle(d.x, d.y, 2.2);
    }
  }
}
