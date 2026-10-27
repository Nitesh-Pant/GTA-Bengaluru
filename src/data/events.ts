import type { EventDef } from '../logic/eventScheduler';

/** Optional, ignorable street moments. The scheduler runs at most one at a time. */
export const EVENTS: EventDef[] = [
  { id: 'gossip', title: 'Street gossip', areas: 'any', cooldownMs: 60000, chance: 0.5, durationMs: 16000, requires: { walking: true } },
  { id: 'cricket_ball', title: 'Ball on the road!', areas: ['foodlane'], cooldownMs: 90000, chance: 0.6, durationMs: 26000, requires: { notRaining: true } },
  { id: 'food_invite', title: 'An invitation', areas: ['indiranagar', 'foodlane', 'techpark', 'metrohub', 'marathahalli'], cooldownMs: 120000, chance: 0.35, durationMs: 12000, requires: { walking: true } },
  { id: 'roadwork', title: 'Surprise roadworks', areas: ['indiranagar', 'marathahalli', 'park', 'techpark', 'foodlane'], cooldownMs: 150000, chance: 0.35, durationMs: 60000 },
  { id: 'shortcut_tip', title: 'A local tip', areas: 'any', cooldownMs: 150000, chance: 0.3, durationMs: 10000, requires: { walking: true } },
  { id: 'rain', title: 'Rain', areas: 'any', cooldownMs: 240000, chance: 0.18, durationMs: 55000, requires: { notRaining: true } },
];

/** Where surprise roadworks can appear (px are computed from tiles in the scene). Lane offset is towards the kerb. */
export const ROADWORK_SPOTS = [
  { x: 28, y: 19, axis: 'h' as const },
  { x: 64, y: 21, axis: 'h' as const },
  { x: 41, y: 34, axis: 'v' as const },
  { x: 91, y: 48, axis: 'v' as const },
  { x: 43, y: 82, axis: 'v' as const },
  { x: 74, y: 59, axis: 'h' as const },
];
