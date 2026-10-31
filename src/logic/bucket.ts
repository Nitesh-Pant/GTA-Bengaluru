import type { Stats } from './save';

/** What the bucket list checks against. `marks` are one-off moments the game records (a Yulu ride, the rain…). */
export interface BucketProgress {
  stats: Stats;
  discovered: readonly string[];
  tasted: readonly string[];
  marks: readonly string[];
}

export interface BucketItem {
  id: string;
  group: string;
  title: string;
  /** How or where to do it, shown until it's done. */
  hint: string;
  done: (p: BucketProgress) => boolean;
  /** "Show me": what to point the marker at. */
  show?: BucketTarget;
}

export type BucketTarget =
  | { guide: 'yulu' | 'auto' | 'bus' | 'metro' | 'car' }
  | { job: 'delivery' | 'fares' | 'quiz' }
  | { poi: string }
  | { animal: 'dog' | 'crows' | 'monkey' }
  | { npc: string };

/** Ids of the items done, in list order. */
export const bucketDone = (items: readonly BucketItem[], p: BucketProgress) => items.filter((i) => i.done(p)).map((i) => i.id);

/** Items that became done since `before` (for "ticked off!" toasts). */
export const newlyDone = (items: readonly BucketItem[], p: BucketProgress, before: readonly string[]) =>
  items.filter((i) => !before.includes(i.id) && i.done(p));
