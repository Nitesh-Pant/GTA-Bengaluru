import type { Rng } from './rng';

export interface LineCondition {
  rain?: boolean;
  areas?: string[];
  mode?: 'walk' | 'drive';
}

export interface Line {
  id: string;
  text: string;
  when?: LineCondition;
}

export type LinePools = Record<string, Line[]>;

export interface LineContext {
  area: string;
  raining: boolean;
  mode: 'walk' | 'drive';
}

export interface DirectorOptions {
  rng: Rng;
  recentGlobal?: number;
  recentPerSpeaker?: number;
  /** Minimum gap between two new ambient lines anywhere in the world. */
  globalGapMs?: number;
  maxConcurrent?: number;
}

const matches = (l: Line, ctx: LineContext) => {
  const w = l.when;
  if (!w) return true;
  if (w.rain !== undefined && w.rain !== ctx.raining) return false;
  if (w.areas && !w.areas.includes(ctx.area)) return false;
  if (w.mode && w.mode !== ctx.mode) return false;
  return true;
};

/**
 * Chooses lines and enforces the anti-spam rules: per-speaker cooldowns, a global gap between
 * ambient lines, a cap on simultaneous bubbles, and recent-line memory (global + per speaker).
 */
export class DialogueDirector {
  private recent: string[] = [];
  private perSpeaker = new Map<string, string[]>();
  private cooldownUntil = new Map<string, number>();
  private lastAmbientAt = -Infinity;
  private active = new Map<string, number>(); // speaker -> bubble end time
  private readonly opts: Required<DirectorOptions>;

  constructor(
    private pools: LinePools,
    opts: DirectorOptions,
  ) {
    this.opts = { recentGlobal: 40, recentPerSpeaker: 8, globalGapMs: 1400, maxConcurrent: 3, ...opts };
  }

  pick(speakerId: string, categories: readonly string[], ctx: LineContext): Line | null {
    const mine = this.perSpeaker.get(speakerId) ?? [];
    const all: Line[] = [];
    for (const c of categories) for (const l of this.pools[c] ?? []) if (matches(l, ctx)) all.push(l);
    if (all.length === 0) return null;
    const fresh = all.filter((l) => !this.recent.includes(l.id) && !mine.includes(l.id));
    // If everything is recent, fall back to lines this speaker hasn't said lately.
    const pool = fresh.length ? fresh : all.filter((l) => !mine.includes(l.id));
    if (pool.length === 0) return null;
    // Prefer context-specific lines a little, so rain/area lines surface when relevant.
    const weighted = pool.flatMap((l) => (l.when ? [l, l] : [l]));
    const line = weighted[Math.floor(this.opts.rng() * weighted.length) % weighted.length];
    this.remember(speakerId, line.id);
    return line;
  }

  private remember(speakerId: string, lineId: string) {
    this.recent.push(lineId);
    if (this.recent.length > this.opts.recentGlobal) this.recent.shift();
    const mine = this.perSpeaker.get(speakerId) ?? [];
    mine.push(lineId);
    if (mine.length > this.opts.recentPerSpeaker) mine.shift();
    this.perSpeaker.set(speakerId, mine);
  }

  /** Whether an *ambient* (unprompted) line may start now for this speaker. */
  canSpeakAmbient(speakerId: string, now: number): boolean {
    this.prune(now);
    if ((this.cooldownUntil.get(speakerId) ?? -Infinity) > now) return false;
    if (this.active.has(speakerId)) return false;
    if (now - this.lastAmbientAt < this.opts.globalGapMs) return false;
    return this.active.size < this.opts.maxConcurrent;
  }

  /** Whether a reaction (bump, complaint...) may interrupt; ignores the global gap. */
  canSpeakReaction(speakerId: string, now: number): boolean {
    this.prune(now);
    return !this.active.has(speakerId) || this.active.size < this.opts.maxConcurrent + 1;
  }

  markSpoke(speakerId: string, now: number, durationMs: number, cooldownMs: number, ambient = true) {
    this.active.set(speakerId, now + durationMs);
    this.cooldownUntil.set(speakerId, now + durationMs + cooldownMs);
    if (ambient) this.lastAmbientAt = now;
  }

  isOnCooldown(speakerId: string, now: number) {
    return (this.cooldownUntil.get(speakerId) ?? -Infinity) > now;
  }

  private prune(now: number) {
    for (const [k, until] of this.active) if (until <= now) this.active.delete(k);
  }
}

/** Reading time for a bubble, so longer lines stay up longer. */
export const bubbleDuration = (text: string) => Math.max(2600, Math.min(6500, 1600 + text.length * 60));
