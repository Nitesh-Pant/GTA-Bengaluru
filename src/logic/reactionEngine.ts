import type { Rng } from './rng';

export type WorldEventType =
  | 'player_near'
  | 'player_pass'
  | 'player_bump'
  | 'player_block_ped'
  | 'player_block_vehicle'
  | 'queue_grow'
  | 'vehicle_near_ped'
  | 'player_bump_vehicle'
  | 'player_vehicle_crash'
  | 'player_enter_vehicle'
  | 'player_exit_vehicle'
  | 'food_visit'
  | 'metro_enter'
  | 'rain_start'
  | 'rain_stop'
  | 'random_event';

export interface WorldEvent {
  type: WorldEventType;
  /** The NPC or vehicle directly involved, if any. */
  actorId?: string;
  x: number;
  y: number;
  /** Escalation level for sustained events (e.g. how long traffic has been blocked). */
  level?: number;
  category?: string;
}

export interface Reactor {
  id: string;
  kind: 'npc' | 'vehicle';
  x: number;
  y: number;
  /** Talking to the player, travelling, or otherwise unavailable. */
  busy: boolean;
}

export type ReactionAction = 'say' | 'honk' | 'startle' | 'shelter' | 'resume';

export interface Reaction {
  actorId: string;
  actions: ReactionAction[];
  category?: string;
  priority: number;
}

interface Rule {
  priority: number;
  /** Who responds: the directly involved actor, or nearby actors. */
  target: 'actor' | 'nearby' | 'none';
  actorKinds?: Array<Reactor['kind']>;
  radius: number;
  maxResponders: number;
  chance: number;
  cooldownMs: number;
  actions: ReactionAction[];
  category?: string;
  /** Escalated category when event.level >= 2. */
  escalated?: string;
  /** Extra action applied to a fraction of all NPCs (e.g. seeking shelter in rain). */
  massAction?: { action: ReactionAction; chance: number };
  /** How long the reaction "owns" the actor so lower-priority events can't contradict it. */
  holdMs: number;
}

export const REACTION_RULES: Record<WorldEventType, Rule> = {
  // Simply passing by is explicitly a non-event: NPCs carry on with what they were doing.
  player_pass: { priority: 0, target: 'none', radius: 0, maxResponders: 0, chance: 0, cooldownMs: 0, actions: [], holdMs: 0 },
  player_near: { priority: 1, target: 'actor', actorKinds: ['npc'], radius: 0, maxResponders: 1, chance: 0.45, cooldownMs: 22000, actions: ['say'], category: 'ambient', holdMs: 0 },
  player_bump: { priority: 3, target: 'actor', actorKinds: ['npc'], radius: 0, maxResponders: 1, chance: 1, cooldownMs: 5000, actions: ['startle', 'say'], category: 'bump', holdMs: 1500 },
  player_block_ped: { priority: 4, target: 'actor', actorKinds: ['npc'], radius: 0, maxResponders: 1, chance: 1, cooldownMs: 9000, actions: ['say'], category: 'block_ped', holdMs: 2500 },
  player_block_vehicle: { priority: 4, target: 'actor', actorKinds: ['vehicle'], radius: 0, maxResponders: 1, chance: 1, cooldownMs: 5000, actions: ['honk', 'say'], category: 'block_vehicle', escalated: 'block_vehicle_long', holdMs: 3000 },
  queue_grow: { priority: 3, target: 'nearby', actorKinds: ['npc', 'vehicle'], radius: 220, maxResponders: 1, chance: 1, cooldownMs: 14000, actions: ['say'], category: 'queue', holdMs: 3000 },
  vehicle_near_ped: { priority: 3, target: 'actor', actorKinds: ['npc'], radius: 0, maxResponders: 1, chance: 0.8, cooldownMs: 7000, actions: ['startle', 'say'], category: 'vehicle_near', holdMs: 1500 },
  player_bump_vehicle: { priority: 3, target: 'actor', actorKinds: ['vehicle'], radius: 0, maxResponders: 1, chance: 1, cooldownMs: 6000, actions: ['say'], category: 'bump_vehicle', holdMs: 2000 },
  player_vehicle_crash: { priority: 5, target: 'actor', actorKinds: ['vehicle'], radius: 0, maxResponders: 1, chance: 1, cooldownMs: 6000, actions: ['honk', 'say'], category: 'crash', holdMs: 3000 },
  player_enter_vehicle: { priority: 2, target: 'nearby', actorKinds: ['npc'], radius: 110, maxResponders: 1, chance: 0.6, cooldownMs: 20000, actions: ['say'], category: 'enter_vehicle', holdMs: 0 },
  player_exit_vehicle: { priority: 2, target: 'nearby', actorKinds: ['npc'], radius: 110, maxResponders: 1, chance: 0.35, cooldownMs: 20000, actions: ['say'], category: 'exit_vehicle', holdMs: 0 },
  food_visit: { priority: 2, target: 'nearby', actorKinds: ['npc'], radius: 140, maxResponders: 1, chance: 0.9, cooldownMs: 15000, actions: ['say'], category: 'food_visit', holdMs: 0 },
  metro_enter: { priority: 2, target: 'nearby', actorKinds: ['npc'], radius: 140, maxResponders: 1, chance: 0.8, cooldownMs: 15000, actions: ['say'], category: 'metro', holdMs: 0 },
  rain_start: { priority: 3, target: 'nearby', actorKinds: ['npc'], radius: 360, maxResponders: 3, chance: 1, cooldownMs: 30000, actions: ['say'], category: 'rain_start', massAction: { action: 'shelter', chance: 0.6 }, holdMs: 2000 },
  rain_stop: { priority: 2, target: 'nearby', actorKinds: ['npc'], radius: 300, maxResponders: 2, chance: 1, cooldownMs: 30000, actions: ['say'], category: 'rain_stop', massAction: { action: 'resume', chance: 1 }, holdMs: 0 },
  random_event: { priority: 3, target: 'actor', radius: 0, maxResponders: 1, chance: 1, cooldownMs: 0, actions: ['say'], holdMs: 2500 },
};

/**
 * Turns world events into proportionate NPC/vehicle reactions. Independent of rendering:
 * callers feed in events and actor snapshots, and apply the returned reactions.
 */
export class ReactionEngine {
  private cooldowns = new Map<string, number>();
  private holds = new Map<string, { until: number; priority: number }>();

  constructor(
    private rng: Rng,
    private rules: Record<WorldEventType, Rule> = REACTION_RULES,
  ) {}

  handle(event: WorldEvent, actors: readonly Reactor[], now: number): Reaction[] {
    const rule = this.rules[event.type];
    if (!rule || rule.target === 'none') return [];
    const out: Reaction[] = [];
    const category =
      event.category ?? ((event.level ?? 0) >= 2 && rule.escalated ? rule.escalated : rule.category);

    const eligible = (a: Reactor) => {
      if (a.busy) return false;
      if (rule.actorKinds && !rule.actorKinds.includes(a.kind)) return false;
      const hold = this.holds.get(a.id);
      if (hold && hold.until > now && hold.priority >= rule.priority) return false;
      return true;
    };

    let responders: Reactor[] = [];
    if (rule.target === 'actor') {
      const a = actors.find((x) => x.id === event.actorId);
      if (a) responders = [a];
    } else {
      responders = actors
        .filter((a) => Math.hypot(a.x - event.x, a.y - event.y) <= rule.radius)
        .sort((a, b) => Math.hypot(a.x - event.x, a.y - event.y) - Math.hypot(b.x - event.x, b.y - event.y));
    }

    // Area-wide events share one cooldown; actor events are per actor.
    const globalKey = `${event.type}:*`;
    if (rule.target === 'nearby' && (this.cooldowns.get(globalKey) ?? -Infinity) > now) {
      return this.massOnly(rule, actors, now);
    }

    for (const a of responders) {
      if (out.length >= rule.maxResponders) break;
      if (!eligible(a)) continue;
      const key = `${event.type}:${a.id}`;
      if ((this.cooldowns.get(key) ?? -Infinity) > now) continue;
      if (this.rng() > rule.chance) {
        this.cooldowns.set(key, now + rule.cooldownMs / 2);
        continue;
      }
      this.cooldowns.set(key, now + rule.cooldownMs);
      if (rule.holdMs) this.holds.set(a.id, { until: now + rule.holdMs, priority: rule.priority });
      out.push({ actorId: a.id, actions: rule.actions, category, priority: rule.priority });
    }
    if (rule.target === 'nearby' && out.length) this.cooldowns.set(globalKey, now + rule.cooldownMs);
    return out.concat(this.massOnly(rule, actors, now, new Set(out.map((r) => r.actorId))));
  }

  private massOnly(rule: Rule, actors: readonly Reactor[], _now: number, skip = new Set<string>()): Reaction[] {
    if (!rule.massAction) return [];
    const res: Reaction[] = [];
    for (const a of actors) {
      if (a.kind !== 'npc' || a.busy || skip.has(a.id)) continue;
      if (this.rng() <= rule.massAction.chance) res.push({ actorId: a.id, actions: [rule.massAction.action], priority: rule.priority });
    }
    return res;
  }
}
