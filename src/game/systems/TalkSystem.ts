import type Phaser from 'phaser';
import { GLOSSARY, PHRASES } from '../../data/glossary';
import { glossFor, glossLine } from '../../logic/glossary';
import { CONVERSATIONS, QUIZ, type ConvNode, type ConvOption, type Conversation, type Effect } from '../../data/conversations';
import { EXCHANGES, LINE_POOLS, type Exchange } from '../../data/dialogue';
import { POIS } from '../../data/pois';
import { TECH_QUIZ, type QuizQuestion } from '../../data/techQuiz';
import { voiceOfLook, VOICE_POOLS, type Voice } from '../../data/voices';
import { bubbleDuration, DialogueDirector, type LineContext } from '../../logic/dialogueDirector';
import { visibilityOf } from '../../logic/discovery';
import { periodOf } from '../../logic/dayClock';
import { personalise } from '../../logic/player';
import { mulberry32, pick } from '../../logic/rng';
import { VoiceDirector } from '../../logic/voiceDirector';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import type { WorldScene } from '../scenes/WorldScene';
import type { Npc } from './NpcSystem';

const NEAR_RADIUS = 58;
/** NPCs in these pools offer a tech question when you talk to them. */
const QUIZZERS = new Set(['techie', 'founder', 'candidate']);
const GROUP_RADIUS = 150;
/** Voices fade out with distance and are skipped beyond this. */
const VOICE_RANGE = 340;

interface Group {
  id: string;
  members: Npc[];
  cooldownUntil: number;
  endsAt: number;
}

interface QueuedLine {
  at: number;
  speaker: Npc;
  text: string;
  duration: number;
}

export class TalkSystem {
  readonly director: DialogueDirector;
  private voices = new VoiceDirector(VOICE_POOLS, mulberry32(11));
  private rng = mulberry32(7);
  private near = new Set<string>();
  private groups = new Map<string, Group>();
  private queue: QueuedLine[] = [];
  private recentExchanges: string[] = [];
  private tick = 0;
  private convo: { npc: Npc; conv: Conversation; node: ConvNode } | null = null;
  /** The question on screen, while a quiz node is showing. */
  private quiz: QuizQuestion | null = null;
  private recentQuiz: QuizQuestion[] = [];
  private hawkerAt = new Map<string, number>();
  private hawkers: Npc[];

  constructor(private scene: WorldScene) {
    this.director = new DialogueDirector(LINE_POOLS, { rng: this.rng });
    this.hawkers = scene.npcs.npcs.filter((n) => n.def.categories.some((c) => c.startsWith('hawk_')));
    for (const n of scene.npcs.npcs) {
      const b = n.def.behaviour;
      if (b.type !== 'chat') continue;
      const g = this.groups.get(b.group) ?? { id: b.group, members: [], cooldownUntil: 4000 + this.rng() * 8000, endsAt: 0 };
      g.members.push(n);
      this.groups.set(b.group, g);
    }
  }

  private chatterMul() {
    const c = this.scene.settings.chatter;
    return c === 'low' ? { chance: 0.45, cooldown: 1.8 } : c === 'high' ? { chance: 1.4, cooldown: 0.65 } : { chance: 1, cooldown: 1 };
  }

  ctx(): LineContext {
    const s = this.scene;
    return { area: s.district.id, raining: s.weather.raining, mode: s.mode.kind === 'drive' ? 'drive' : 'walk', player: s.profile.gender, period: periodOf(s.dayNight.minutes) };
  }

  /** Speak a line from the given pools. Ambient lines obey all anti-spam gates. */
  speak(npc: Npc, categories: readonly string[], now: number, ambient: boolean, cooldownMs = 18000): boolean {
    const d = this.director;
    if (ambient ? !d.canSpeakAmbient(npc.id, now) : !d.canSpeakReaction(npc.id, now)) return false;
    // On a festival day people bring it up now and then.
    const fest = this.scene.festivals?.current;
    const pools = ambient && fest && Math.random() < 0.3 ? [fest.pool, ...categories] : categories;
    const line = d.pick(npc.id, pools, this.ctx());
    if (!line) return false;
    const dur = bubbleDuration(line.text);
    d.markSpoke(npc.id, now, dur, cooldownMs * this.chatterMul().cooldown, ambient);
    this.scene.bubbles.say(() => ({ x: npc.x, y: npc.y - 22 }), npc.name, personalise(line.text, this.scene.profile), dur, now);
    this.voice(poolOf(line.id), voiceOfLook(npc.def.look), npc.x, npc.y, now);
    return true;
  }

  /** Maybe play a recorded voice clip from `pool`, quieter and panned with distance from the player. */
  voice(pool: string, voice: Voice | null, x: number, y: number, now: number, gain = 1, force = false) {
    if (this.scene.settings.voiceVolume <= 0 || this.scene.settings.muted) return;
    const p = this.scene.playerFeet();
    const vol = (1 - Math.hypot(x - p.x, y - p.y) / VOICE_RANGE) * gain;
    if (vol < 0.15) return;
    const clip = this.voices.pick(pool, voice, now, force);
    if (!clip) return;
    const secs = audio.voice(clip.file, vol, (x - p.x) / VOICE_RANGE);
    if (secs) this.voices.markPlayed(clip, now, secs * 1000);
  }

  /** A driver (traffic car) says something from a pool. */
  speakDriver(carId: string, anchor: () => { x: number; y: number } | null, categories: readonly string[], now: number) {
    const d = this.director;
    if (!d.canSpeakReaction(carId, now)) return;
    const line = d.pick(carId, categories, this.ctx());
    if (!line) return;
    const dur = bubbleDuration(line.text);
    d.markSpoke(carId, now, dur, 4000, false);
    this.scene.bubbles.say(anchor, 'Driver', personalise(line.text, this.scene.profile), dur, now, 'driver');
    const at = anchor();
    if (at) this.voice(poolOf(line.id), 'm', at.x, at.y, now);
  }

  /** A line said to the player (event lines, tips, thanks); `pool` voices it when a clip fits. */
  say(npc: Npc, text: string, now: number, kind: 'npc' | 'event' = 'npc', pool?: string) {
    const dur = bubbleDuration(text);
    this.director.markSpoke(npc.id, now, dur, 8000, false);
    this.scene.bubbles.say(() => ({ x: npc.x, y: npc.y - 22 }), npc.name, personalise(text, this.scene.profile), dur, now, kind);
    if (pool) this.voice(pool, voiceOfLook(npc.def.look), npc.x, npc.y, now, 1, true);
    return dur;
  }

  update(now: number, dt: number) {
    // Scripted exchange lines
    while (this.queue.length && this.queue[0].at <= now) {
      const q = this.queue.shift()!;
      if (q.speaker.state === 'talk') continue;
      this.director.markSpoke(q.speaker.id, now, q.duration, 6000, false);
      this.scene.bubbles.say(() => ({ x: q.speaker.x, y: q.speaker.y - 22 }), q.speaker.name, q.text, q.duration, now);
    }
    this.tick -= dt;
    if (this.tick > 0) return;
    this.tick = 0.25;
    const s = this.scene;
    if (s.locked || s.travelling) return;
    const p = s.playerFeet();
    const walking = s.mode.kind === 'walk';

    // Proximity: entering an NPC's space may prompt an ambient line; passing by does nothing.
    for (const n of s.npcs.npcs) {
      const inside = walking && Math.hypot(n.x - p.x, n.y - p.y) < NEAR_RADIUS;
      if (inside && !this.near.has(n.id)) {
        this.near.add(n.id);
        if (n.def.behaviour.type !== 'chat' && this.rng() < this.chatterMul().chance) s.react({ type: 'player_near', actorId: n.id, x: n.x, y: n.y });
      } else if (!inside && this.near.has(n.id)) {
        this.near.delete(n.id);
        s.react({ type: 'player_pass', actorId: n.id, x: n.x, y: n.y });
      }
    }

    // Pushcart hawkers call out every so often while you're within earshot.
    for (const n of this.hawkers) {
      if (n.state !== 'active') continue;
      if (now < (this.hawkerAt.get(n.id) ?? 0) || Math.hypot(n.x - p.x, n.y - p.y) > 320) continue;
      this.hawkerAt.set(n.id, now + 11000 + this.rng() * 9000);
      this.speak(n, n.def.categories, now, false, 9000);
    }

    // Chat groups talk among themselves when the player is within earshot (or on screen, more rarely).
    const view = s.cameras.main.worldView;
    for (const g of this.groups.values()) {
      if (now < g.endsAt || now < g.cooldownUntil) continue;
      if (g.members.some((m) => m.state !== 'active')) continue;
      const cx = g.members.reduce((a, m) => a + m.x, 0) / g.members.length;
      const cy = g.members.reduce((a, m) => a + m.y, 0) / g.members.length;
      const d = Math.hypot(cx - p.x, cy - p.y);
      const close = d < GROUP_RADIUS;
      if (!close && !(view.contains(cx, cy) && this.rng() < 0.15)) continue;
      this.startExchange(g, now);
      // Background banter under the bubbles, only when everyone in the group shares a voice.
      const voices = new Set(g.members.map((m) => voiceOfLook(m.def.look)));
      if (close && voices.size === 1) this.voice('banter', [...voices][0], cx, cy, now, 0.6);
    }
  }

  private startExchange(g: Group, now: number) {
    const raining = this.scene.weather.raining;
    const topics = new Set(g.members.flatMap((m) => m.def.topics ?? ['general']));
    let options = EXCHANGES.filter((e) => topics.has(e.topic) && !this.recentExchanges.includes(e.id) && (e.topic !== 'rain' || raining));
    if (raining) {
      const rainy = options.filter((e) => e.topic === 'rain');
      if (rainy.length && this.rng() < 0.6) options = rainy;
    }
    if (!options.length) options = EXCHANGES.filter((e) => e.topic === 'general');
    const ex = pick(options, this.rng);
    g.endsAt = this.playExchange(g.members, ex, now);
    g.cooldownUntil = g.endsAt + (30000 + this.rng() * 25000) * this.chatterMul().cooldown;
  }

  /** Queue a two-person exchange; returns when it ends (scene clock). */
  playExchange(members: Npc[], ex: Exchange, now: number) {
    this.recentExchanges.push(ex.id);
    if (this.recentExchanges.length > 8) this.recentExchanges.shift();
    let at = Math.max(now, this.queueEnd(now)) + 200;
    for (const l of ex.lines) {
      const speaker = members[l.who % members.length];
      const duration = bubbleDuration(l.text);
      this.queue.push({ at, speaker, text: l.text, duration });
      at += duration + 250;
    }
    return at;
  }

  private queueEnd(now: number) {
    if (!this.queue.length) return now;
    const last = this.queue[this.queue.length - 1];
    return last.at + last.duration;
  }

  // ── Conversations (E)

  open(npc: Npc) {
    const conv = npc.def.conversation ? CONVERSATIONS[npc.def.conversation] : this.genericConversation(npc);
    npc.state = 'talk';
    npc.faceTowards(this.scene.playerFeet().x, this.scene.playerFeet().y);
    (npc.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.convo = { npc, conv, node: conv.nodes[conv.start] };
    this.show();
    this.voice(`talk:${conv.id}`, voiceOfLook(npc.def.look), npc.x, npc.y, this.scene.clock, 1, true);
  }

  private show() {
    if (!this.convo) return;
    const { npc, node } = this.convo;
    this.apply(node.effects);
    const options = (node.options ?? [{ label: 'Sari! (Leave)' }]).map((o) => o.label);
    uiStore.set({
      dialogue: {
        speaker: node.speaker === '' ? '' : (node.speaker ?? npc.name),
        role: npc.def.role,
        text: personalise(node.text, this.scene.profile),
        gloss: this.scene.settings.glosses ? glossLine(glossFor(node.text, GLOSSARY, PHRASES, 4)) : '',
        options,
      },
    });
  }

  choose(i: number) {
    if (!this.convo) return;
    const opt: ConvOption | undefined = (this.convo.node.options ?? [{ label: 'Leave' }])[i];
    if (!opt) return;
    if (this.quiz) return this.answerQuiz(i);
    this.apply(opt.effects);
    if (opt.next === QUIZ) {
      this.askQuiz();
    } else if (opt.next && this.convo.conv.nodes[opt.next]) {
      this.convo.node = this.convo.conv.nodes[opt.next];
      this.show();
    } else this.close();
  }

  /** A random tech question the player hasn't seen lately. */
  private askQuiz() {
    if (!this.convo) return;
    const fresh = TECH_QUIZ.filter((q) => !this.recentQuiz.includes(q));
    const q = pick(fresh.length ? fresh : TECH_QUIZ, this.rng);
    this.recentQuiz = [...this.recentQuiz.slice(-8), q];
    this.quiz = q;
    this.convo.node = { text: q.q, options: q.options.map((label) => ({ label })) };
    this.show();
  }

  private answerQuiz(i: number) {
    const q = this.quiz!;
    this.quiz = null;
    const right = i === q.answer;
    if (right) this.scene.bump('quiz');
    this.convo!.node = {
      text: right ? `Correct! ${q.why}` : `Ayyo, no. It's "${q.options[q.answer]}". ${q.why}`,
      options: [{ label: 'Ask me another!', next: QUIZ }, { label: 'Enough for today (Leave)' }],
    };
    this.show();
  }

  close() {
    this.quiz = null;
    if (this.convo) {
      const npc = this.convo.npc;
      npc.state = 'active';
      npc.pauseUntil = this.scene.clock + 1200;
      this.director.markSpoke(npc.id, this.scene.clock, 0, 15000, false);
    }
    this.convo = null;
    uiStore.set({ dialogue: null });
  }

  get talkingTo() {
    return this.convo?.npc ?? null;
  }

  private apply(effects?: Effect[]) {
    for (const e of effects ?? []) {
      const s = this.scene;
      if (e.type === 'hint') s.hint(e.poi);
      else if (e.type === 'destination') s.setDestination(e.poi);
      else if (e.type === 'taste') s.taste(e.dish);
      else if (e.type === 'job') s.deliveries.start();
      else if (e.type === 'stat') {
        s.stats[e.stat]++;
        s.persist();
      } else if (e.type === 'world') {
        const p = s.playerFeet();
        s.react({ type: 'food_visit', x: p.x, y: p.y });
      }
    }
  }

  /** NPCs without a written conversation still chat, and may point out something nearby. */
  private genericConversation(npc: Npc): Conversation {
    const line = this.director.pick(npc.id, npc.def.categories, this.ctx())?.text ?? 'Namaskara!';
    const s = this.scene;
    const state = { discovered: s.discovered, hinted: s.hinted };
    const near = POIS.filter((p) => visibilityOf(state, p) !== 'known' && (!p.hidden || this.rng() < 0.35))
      .map((p) => ({ p, d: Math.hypot(p.x - npc.x, p.y - npc.y) }))
      .sort((a, b) => a.d - b.d)[0]?.p;
    const tip: ConvNode = near
      ? {
          text: near.hidden
            ? `Psst… ${near.name} gothaa? ${near.hint ?? ''}. Yaarigu helbedi!`
            : `${near.name} nodidira? ${near.description}`,
          effects: [{ type: 'hint', poi: near.id }],
          options: [{ label: 'Thanks! (Leave)' }],
        }
      : { text: 'Neevu already ella nodbittidira! Local aagbittiri, guru.', options: [{ label: 'Haha, thanks!' }] };
    return {
      id: `generic_${npc.id}`,
      start: 'a',
      nodes: {
        a: {
          text: line,
          options: [
            { label: 'Illi yenu special ide?', next: 'tip' },
            ...(npc.def.categories.some((c) => QUIZZERS.has(c)) ? [{ label: 'Ask me a tech question!', next: QUIZ }] : []),
            { label: 'Sari, bartini! (Leave)' },
          ],
        },
        tip,
      },
    };
  }
}

/** Line ids are `${pool}.${index}` (see LINE_POOLS). */
const poolOf = (lineId: string) => lineId.slice(0, lineId.lastIndexOf('.'));
