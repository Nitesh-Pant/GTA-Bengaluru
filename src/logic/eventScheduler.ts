import { shuffle, type Rng } from './rng';

export interface EventRequirements {
  walking?: boolean;
  raining?: boolean;
  notRaining?: boolean;
}

export interface EventDef {
  id: string;
  title: string;
  /** District ids where the event may start; 'any' for anywhere. */
  areas: string[] | 'any';
  cooldownMs: number;
  /** Probability per scheduler check once eligible. */
  chance: number;
  durationMs: number;
  requires?: EventRequirements;
  reward?: { hint?: string };
}

export interface SchedulerContext {
  area: string;
  raining: boolean;
  walking: boolean;
  /** Events disabled while the player is busy (dialogue, metro, paused). */
  busy: boolean;
}

/**
 * Decides when optional events start: one at a time, with a global gap,
 * per-event cooldowns and area/condition checks.
 */
export class EventScheduler {
  private lastRun = new Map<string, number>();
  private lastEnded = -Infinity;
  active: { id: string; endsAt: number } | null = null;

  constructor(
    private defs: readonly EventDef[],
    private rng: Rng,
    private minGapMs = 20000,
    startAt = 0,
  ) {
    this.lastEnded = startAt;
  }

  eligible(def: EventDef, now: number, ctx: SchedulerContext): boolean {
    if (ctx.busy) return false;
    if (def.areas !== 'any' && !def.areas.includes(ctx.area)) return false;
    const last = this.lastRun.get(def.id);
    if (last !== undefined && now - last < def.cooldownMs) return false;
    const r = def.requires;
    if (r?.walking && !ctx.walking) return false;
    if (r?.raining && !ctx.raining) return false;
    if (r?.notRaining && ctx.raining) return false;
    return true;
  }

  /** Call periodically. Returns an event to start, or null. */
  tick(now: number, ctx: SchedulerContext): EventDef | null {
    if (this.active) {
      if (now >= this.active.endsAt) this.end(this.active.id, now);
      return null;
    }
    if (now - this.lastEnded < this.minGapMs) return null;
    for (const def of shuffle(this.defs.slice(), this.rng)) {
      if (!this.eligible(def, now, ctx)) continue;
      if (this.rng() > def.chance) continue;
      this.lastRun.set(def.id, now);
      this.active = { id: def.id, endsAt: now + def.durationMs };
      return def;
    }
    return null;
  }

  /** End (complete or cancel) the active event. */
  end(id: string, now: number) {
    if (this.active?.id !== id) return;
    this.active = null;
    this.lastEnded = now;
  }
}
