import type { Stats } from './save';

export interface Progress {
  stats: Stats;
  discovered: readonly string[];
  tasted: readonly string[];
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  done: (p: Progress) => boolean;
}

/** Achievements that are done now but weren't unlocked before, in definition order. */
export function newlyUnlocked(defs: readonly AchievementDef[], p: Progress, unlocked: readonly string[]): AchievementDef[] {
  return defs.filter((a) => !unlocked.includes(a.id) && a.done(p));
}
