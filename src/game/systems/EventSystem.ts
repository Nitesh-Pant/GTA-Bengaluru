import Phaser from 'phaser';
import { EXCHANGES, LINE_POOLS } from '../../data/dialogue';
import { EVENTS, ROADWORK_SPOTS } from '../../data/events';
import { POIS } from '../../data/pois';
import { visibilityOf } from '../../logic/discovery';
import { EventScheduler, type EventDef } from '../../logic/eventScheduler';
import type { Obstacle } from '../../logic/traffic';
import { bubbleDuration } from '../../logic/dialogueDirector';
import { mulberry32, pick } from '../../logic/rng';
import { uiStore } from '../../store/uiStore';
import { LANE, ROAD_CENTRES } from '../../data/roads';
import { nearest } from '../../logic/geometry';
import { darkness } from '../../logic/dayClock';
import { audio } from '../audio';
import { t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';
import type { Npc } from './NpcSystem';

const TIPS: Record<string, string> = {
  graffiti: 'Psst! 12th Main hinde mural wall ide, adara back alli ondu gully. Sakkath art!',
  shortcut: 'Marathahalli alli hardware shop mattu tailor madhye ondu gully ide. Traffic skip!',
  kerebench: 'Lake south-east alli bushes hinde ondu secret bench ide. Sunrise alli swarga.',
  banyan: 'Maidan pakka ondu hale doddamara ide. Uncles alli politics maathadtare.',
  bennedose: 'Original benne dose beka? Chai stall pakka chikka daari, south side.',
};

interface Active {
  def: EventDef;
  cleanup: () => void;
  update?: (now: number) => void;
}

/** Runs optional street moments. Every event can be ignored; none blocks the player. */
export class EventSystem {
  private scheduler: EventScheduler;
  private rng = mulberry32(99);
  private tick = 0;
  private active: Active | null = null;
  /** Interactable thing an event exposes (e.g. a cricket ball to throw back). */
  ball: { sprite: Phaser.GameObjects.Image; kid: Npc; done: boolean } | null = null;

  constructor(private scene: WorldScene) {
    this.scheduler = new EventScheduler(EVENTS, this.rng, 25000, scene.clock);
  }

  update(dt: number, now: number) {
    this.active?.update?.(now);
    if (this.active && !this.scheduler.active) this.finish();
    this.tick -= dt;
    if (this.tick > 0) return;
    this.tick = 3;
    const s = this.scene;
    const def = this.scheduler.tick(now, {
      area: s.district.id,
      raining: s.weather.raining,
      walking: s.mode.kind === 'walk',
      busy: s.locked || s.travelling,
    });
    if (this.active && !this.scheduler.active) this.finish();
    if (def) this.begin(def, now);
  }

  private finish() {
    this.active?.cleanup();
    this.active = null;
    uiStore.set({ eventTitle: null });
  }

  private begin(def: EventDef, now: number) {
    const run = this.handlers[def.id]?.(now);
    if (!run) {
      // Couldn't start here (no suitable NPCs nearby); end quietly so the cooldown applies.
      this.scheduler.end(def.id, now);
      return;
    }
    this.active = { def, ...run };
    uiStore.set({ eventTitle: def.title });
  }

  private end(now: number) {
    if (this.active) this.scheduler.end(this.active.def.id, now);
  }

  private freeNear(radius: number, n: number): Npc[] {
    const p = this.scene.playerFeet();
    return this.scene.npcs.near(p.x, p.y, radius, true).slice(0, n);
  }

  private handlers: Record<string, (now: number) => Omit<Active, 'def'> | null> = {
    gossip: (now) => {
      const pair = this.freeNear(170, 2);
      if (pair.length < 2) return null;
      const [a, b] = pair;
      a.state = 'event';
      b.state = 'event';
      a.faceTowards(b.x, b.y);
      b.faceTowards(a.x, a.y);
      const area = this.scene.district.id;
      const topic = area === 'park' ? 'park' : area === 'foodlane' ? 'food' : area === 'techpark' ? 'techie' : this.scene.weather.raining ? 'rain' : 'traffic';
      const ex = pick(EXCHANGES.filter((e) => e.topic === topic || e.topic === 'general'), this.rng);
      const until = this.scene.talk.playExchange([a, b], ex, now);
      return {
        update: (t2) => {
          if (t2 > until + 400) this.end(t2);
        },
        cleanup: () => {
          a.release();
          b.release();
        },
      };
    },

    // Two people argue (verbally, comedically), a small crowd gathers to comment, someone makes peace.
    argument: (now) => {
      const s = this.scene;
      const adults = this.freeNear(200, 8).filter((n) => !n.def.look.startsWith('kid'));
      if (adults.length < 2) return null;
      const [a, b, ...rest] = adults;
      a.state = 'event';
      b.state = 'event';
      a.faceTowards(b.x, b.y);
      b.faceTowards(a.x, a.y);
      const ex = pick(EXCHANGES.filter((e) => e.topic === 'fight'), this.rng);
      const until = s.talk.playExchange([a, b], ex, now);
      s.talk.voice('argument', 'm', (a.x + b.x) / 2, (a.y + b.y) / 2, now, 1, true);
      const crowd = rest.slice(0, 3);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      crowd.forEach((n, i) => {
        const ang = Math.PI * (0.25 + i * 0.25);
        n.goTo(mx + Math.cos(ang) * 30, my + Math.sin(ang) * 22, () => {
          n.faceTowards(mx, my);
          s.talk.say(n, pick(LINE_POOLS.onlooker, this.rng).text, s.clock, 'event');
        });
      });
      let settled = false;
      return {
        update: (t2) => {
          if (!settled && t2 > until) {
            settled = true;
            const peacemaker = crowd.find((n) => n.state === 'event') ?? a;
            s.talk.say(peacemaker, pick(LINE_POOLS.peacemaker, this.rng).text, t2, 'event');
          }
          if (t2 > until + 3500) this.end(t2);
        },
        cleanup: () => {
          for (const n of [a, b, ...crowd]) n.release();
        },
      };
    },

    // Lights out after dark: lamps and shops go dark, inverters hum, everyone complains.
    power_cut: (now) => {
      const s = this.scene;
      if (darkness(s.dayNight.minutes) < 0.4) return null;
      s.dayNight.setPowerCut(true);
      const voices = this.freeNear(260, 3);
      for (const n of voices) s.talk.say(n, pick(LINE_POOLS.power_cut, this.rng).text, now, 'event');
      return {
        cleanup: () => {
          s.dayNight.setPowerCut(false);
          const [n] = this.freeNear(260, 1);
          if (n) s.talk.say(n, pick(LINE_POOLS.power_back, this.rng).text, s.clock, 'event');
        },
      };
    },

    // The BBMP garbage van drives through on the nearest main road, jingle blaring.
    garbage_van: (now) => {
      const s = this.scene;
      const p = s.playerFeet();
      const y = nearest([LANE.H1E, LANE.H2E, LANE.H3E], p.y);
      if (Math.abs(y - p.y) > 320) return null;
      const cam = s.cameras.main.worldView;
      const van = s.add.image(cam.x - 60, y, 'bbmp_van').setDepth(y + 8);
      const block: Obstacle = { id: 'bbmp_van', kind: 'vehicle', x: van.x, y, radius: 18 };
      s.traffic.addObstacle(block);
      s.tweens.add({ targets: van, x: cam.right + 80, duration: 18000, onUpdate: () => (block.x = van.x) });
      let nextTune = now;
      const shouted = new Set<string>();
      return {
        update: (t2) => {
          const p2 = s.playerFeet();
          if (t2 >= nextTune) {
            nextTune = t2 + 3000;
            audio.jingle(Math.max(0, 1 - Math.hypot(van.x - p2.x, van.y - p2.y) / 520), (van.x - p2.x) / 400);
          }
          if (shouted.size < 3)
            for (const n of s.npcs.near(van.x, van.y, 120, true))
              if (!shouted.has(n.id) && shouted.size < 3) {
                shouted.add(n.id);
                s.talk.say(n, pick(LINE_POOLS.garbage, this.rng).text, t2, 'event');
              }
          if (van.x > s.cameras.main.worldView.right + 60) this.end(t2);
        },
        cleanup: () => {
          s.traffic.removeObstacle('bbmp_van');
          van.destroy();
        },
      };
    },

    // A car and a scooter touch: both stop where they are, the drivers get out and shout,
    // traffic queues and honks behind them, a crowd gathers, and the police siren starts.
    accident: (now) => {
      const s = this.scene;
      const p = s.playerFeet();
      const view = s.cameras.main.worldView;
      const car = s.traffic.cars.find(
        (c) => c.active && c.spawn.type === 'car' && !s.traffic.isEmergency(c) && view.contains(c.sprite.x, c.sprite.y) && Math.hypot(c.sprite.x - p.x, c.sprite.y - p.y) > 70,
      );
      if (!car) return null;
      const { x, y } = car.sprite;
      const h = car.logic.heading;
      s.traffic.retire(car);
      const wreck = s.add.image(x, y, car.sprite.texture.key).setRotation(h).setDepth(y + 8);
      const bx = x - Math.cos(h) * 26;
      const by = y - Math.sin(h) * 26;
      const bike = s.add.image(bx, by, 'veh_scooter_0').setRotation(h + Math.PI / 2).setDepth(by + 8);
      const blocks: Obstacle[] = [
        { id: 'crash_car', kind: 'static', x, y, radius: 15, squeeze: true },
        { id: 'crash_bike', kind: 'static', x: bx, y: by, radius: 9, squeeze: true },
      ];
      for (const b of blocks) s.traffic.addObstacle(b);
      // The two drivers, standing beside their vehicles.
      const side = { x: Math.sin(h) * 16, y: -Math.cos(h) * 16 };
      const drivers = [
        { name: 'Car driver', sprite: s.add.image(x + side.x, y + side.y, 'char_commuter', 0) },
        { name: 'Scooter rider', sprite: s.add.image(bx + side.x, by + side.y, 'char_delivery', 0) },
      ];
      for (const d of drivers) d.sprite.setOrigin(0.5, 22 / 24).setDepth(d.sprite.y);
      drivers[0].sprite.setFlipX(drivers[1].sprite.x < drivers[0].sprite.x);
      const shout = (i: number, pool: 'roadrage' | 'roadrage_end', at: number) => {
        const d = drivers[i];
        const line = pick(LINE_POOLS[pool], this.rng).text;
        s.bubbles.say(() => (d.sprite.active ? { x: d.sprite.x, y: d.sprite.y - 22 } : null), d.name, line, bubbleDuration(line), at);
      };
      s.talk.voice('argument', 'm', x, y, now, 1, true);
      s.traffic.policeSiren = true;
      audio.thud();
      // Onlookers drift over to watch and comment.
      const crowd = this.freeNear(260, 3).filter((n) => !n.def.look.startsWith('kid'));
      crowd.forEach((n, i) => {
        const ang = Math.PI * (0.2 + i * 0.3);
        n.goTo(x + Math.cos(ang) * 40, y + 24 + Math.sin(ang) * 10, () => {
          n.faceTowards(x, y);
          s.talk.say(n, pick(LINE_POOLS.onlooker, this.rng).text, s.clock, 'event');
        });
      });
      let turn = 0;
      let nextShout = now + 300;
      const calmAt = now + 17000;
      return {
        update: (t2) => {
          if (t2 >= nextShout && t2 < calmAt) {
            shout(turn++ % 2, 'roadrage', t2);
            nextShout = t2 + 2300;
          } else if (t2 >= calmAt && turn >= 0) {
            shout(0, 'roadrage_end', t2);
            turn = -1;
          }
          if (t2 > calmAt + 4500) this.end(t2);
        },
        cleanup: () => {
          for (const b of blocks) s.traffic.removeObstacle(b.id);
          for (const img of [wreck, bike, ...drivers.map((d) => d.sprite)]) img.destroy();
          for (const n of crowd) n.release();
          s.traffic.policeSiren = false;
        },
      };
    },

    cricket_ball: (now) => {
      const s = this.scene;
      const p = s.playerFeet();
      const kids = s.npcs.npcs.filter((n) => n.def.role === 'Gully cricketer' && n.state === 'active');
      if (!kids.length || Math.hypot(p.x - t(12), p.y - t(84)) > 420) return null;
      const kid = kids.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      const sprite = s.add.image(t(12), t(80), 'ball').setDepth(t(80));
      const dest = { x: t(14 + this.rng() * 18), y: t(75.6) };
      s.tweens.add({ targets: sprite, x: dest.x, y: dest.y, duration: 1800, ease: 'Quad.easeOut', onUpdate: () => sprite.setDepth(sprite.y), angle: 720 });
      kid.state = 'event';
      kid.faceTowards(dest.x, dest.y);
      s.talk.say(kid, pick(LINE_POOLS.cricket_ball, this.rng).text, now, 'event', 'cricket_ball');
      this.ball = { sprite, kid, done: false };
      const fetchAt = now + 14000;
      let fetching = false;
      return {
        update: (t2) => {
          if (!this.ball || this.ball.done || fetching || t2 < fetchAt) return;
          // Nobody helped: the kid fetches it, no hard feelings.
          fetching = true;
          kid.goTo(sprite.x, sprite.y + 2, () => {
            sprite.setVisible(false);
            kid.goTo(kid.home.x, kid.home.y, () => this.end(this.scene.clock));
          });
        },
        cleanup: () => {
          sprite.destroy();
          kid.release();
          this.ball = null;
        },
      };
    },

    food_invite: (now) => {
      const [npc] = this.freeNear(150, 1);
      if (!npc) return null;
      const s = this.scene;
      const state = { discovered: s.discovered, hinted: s.hinted };
      const food = POIS.filter((p) => p.kind === 'food' || p.id === 'bennedose').filter((p) => visibilityOf(state, p) !== 'known');
      const poi = food.length ? pick(food, this.rng) : null;
      const p = s.playerFeet();
      npc.goTo(p.x + (npc.x < p.x ? -14 : 14), p.y, () => {
        npc.faceTowards(s.playerFeet().x, s.playerFeet().y);
        const text = poi ? `Bro, ${poi.name} ge banni! ${poi.kind === 'food' ? 'Sakkath oota ide.' : 'Secret spot, nodi.'}` : 'Oota aaytha? Illa andre darshini ge hogona!';
        s.talk.say(npc, text, s.clock, 'event');
        if (poi) s.hint(poi.id);
      });
      return {
        update: (t2) => {
          if (t2 > now + 11000) this.end(t2);
        },
        cleanup: () => npc.release(),
      };
    },

    roadwork: (now) => {
      const s = this.scene;
      const p = s.playerFeet();
      const spots = ROADWORK_SPOTS.map((sp) => ({ sp, d: Math.hypot(t(sp.x) - p.x, t(sp.y) - p.y) }))
        .filter((x) => x.d > 140 && x.d < 700)
        .sort((a, b) => a.d - b.d);
      if (!spots.length) return null;
      const { sp } = spots[0];
      // Barriers sit towards the kerb so traffic can squeeze past on the other side.
      const kerb = (v: number, centres: number[]) => Math.sign(v - nearest(centres, v)) * 4;
      const x = t(sp.x) + (sp.axis === 'v' ? kerb(t(sp.x), ROAD_CENTRES.v) : 0);
      const y = t(sp.y) + (sp.axis === 'h' ? kerb(t(sp.y), ROAD_CENTRES.h) : 0);
      const obstacles: Obstacle[] = s.traffic.roadworkObstacles(x, y, sp.axis);
      const sprites: Phaser.GameObjects.Image[] = [];
      const bodies: Phaser.GameObjects.Zone[] = [];
      for (const o of obstacles) {
        s.traffic.addObstacle(o);
        const img = s.add.image(o.x, o.y + 4, sprites.length % 2 ? 'prop_cone' : 'prop_barrier').setOrigin(0.5, 1).setDepth(o.y + 4).setAlpha(0);
        if (sp.axis === 'v') img.setAngle(90);
        s.tweens.add({ targets: img, alpha: 1, duration: 400 });
        sprites.push(img);
        const z = s.add.zone(o.x, o.y, 12, 8);
        s.physics.add.existing(z, true);
        s.blockers.add(z);
        bodies.push(z);
      }
      const [npc] = s.npcs.near(x, y, 300, true);
      if (npc && Math.hypot(p.x - x, p.y - y) < 420) s.talk.speak(npc, ['roadwork'], now, false);
      // A crew member minds the barriers, on the kerb side.
      const wx = x + (sp.axis === 'v' ? Math.sign(x - t(sp.x)) * 14 : 18);
      const wy = y + (sp.axis === 'h' ? Math.sign(y - t(sp.y)) * 14 : 18);
      const worker = s.add.image(wx, wy, 'char_worker', 0).setOrigin(0.5, 22 / 24).setDepth(wy);
      sprites.push(worker);
      const line = pick(LINE_POOLS.worker, this.rng).text;
      s.bubbles.say(() => (worker.active ? { x: worker.x, y: worker.y - 22 } : null), 'Road crew', line, bubbleDuration(line), now);
      return {
        cleanup: () => {
          for (const o of obstacles) s.traffic.removeObstacle(o.id);
          sprites.forEach((img) => s.tweens.add({ targets: img, alpha: 0, duration: 500, onComplete: () => img.destroy() }));
          bodies.forEach((z) => z.destroy());
        },
      };
    },

    shortcut_tip: (now) => {
      const s = this.scene;
      const state = { discovered: s.discovered, hinted: s.hinted };
      const secrets = POIS.filter((p) => p.hidden && visibilityOf(state, p) === 'secret' && TIPS[p.id]);
      if (!secrets.length) return null;
      const [npc] = this.freeNear(110, 1);
      if (!npc) return null;
      const poi = pick(secrets, this.rng);
      npc.state = 'event';
      npc.faceTowards(s.playerFeet().x, s.playerFeet().y);
      s.talk.say(npc, TIPS[poi.id], now, 'event');
      s.hint(poi.id);
      return {
        update: (t2) => {
          if (t2 > now + 6000) this.end(t2);
        },
        cleanup: () => npc.release(),
      };
    },

    rain: (now) => {
      this.scene.weather.start(45000 + this.rng() * 25000, now);
      return {
        update: (t2) => {
          if (!this.scene.weather.raining) this.end(t2);
        },
        cleanup: () => {},
      };
    },
  };

  /** Player throws the ball back: a tiny optional good deed. */
  throwBall() {
    const b = this.ball;
    if (!b || b.done) return;
    b.done = true;
    const s = this.scene;
    s.tweens.add({
      targets: b.sprite,
      x: b.kid.x,
      y: b.kid.y - 8,
      duration: 650,
      ease: 'Sine.easeOut',
      onComplete: () => {
        b.sprite.setVisible(false);
        s.talk.say(b.kid, pick(LINE_POOLS.cricket_thanks, this.rng).text, s.clock, 'event', 'cricket_thanks');
        s.bump('throws');
        if (s.discovered.includes('maidan')) s.hint('banyan');
        this.end(s.clock);
      },
    });
  }
}
