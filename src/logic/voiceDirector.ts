import type { Voice, VoiceClip } from '../data/voices';
import { pick, type Rng } from './rng';

export interface VoiceOptions {
  /** Chance that a line gets a recorded voice at all; the rest stay text-only. */
  chance: number;
  /** Silence after any clip ends before the next may start. */
  gapMs: number;
  /** How long before the same clip may play again. */
  clipCooldownMs: number;
}

const DEFAULTS: VoiceOptions = { chance: 0.55, gapMs: 3500, clipCooldownMs: 40000 };

/** Picks the occasional voice clip: one at a time, matched to the speaker's voice, never the same clip twice in a row. */
export class VoiceDirector {
  private busyUntil = -Infinity;
  private lastPlayed = new Map<string, number>();
  private opts: VoiceOptions;

  constructor(
    private pools: Record<string, VoiceClip[]>,
    private rng: Rng,
    opts: Partial<VoiceOptions> = {},
  ) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  /** `force` is for one-off moments (announcements, opening a conversation): no chance roll, no waiting. */
  pick(pool: string, voice: Voice | null, now: number, force = false): VoiceClip | null {
    if (!force && now < this.busyUntil) return null;
    const fits = (c: VoiceClip) => !c.voice || !voice || c.voice === voice;
    const options = (this.pools[pool] ?? []).filter((c) => fits(c) && (force || now >= (this.lastPlayed.get(c.file) ?? -Infinity) + this.opts.clipCooldownMs));
    if (!options.length || (!force && this.rng() >= this.opts.chance)) return null;
    return pick(options, this.rng);
  }

  markPlayed(clip: VoiceClip, now: number, durationMs: number) {
    this.busyUntil = now + durationMs + this.opts.gapMs;
    this.lastPlayed.set(clip.file, now);
  }
}
