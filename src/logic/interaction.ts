export type InteractionKind = 'exitVehicle' | 'metro' | 'vehicle' | 'counter' | 'object' | 'npc';

/** Higher wins. An open UI always wins over world interactions (handled by the caller). */
export const INTERACTION_PRIORITY: Record<InteractionKind, number> = {
  exitVehicle: 100,
  metro: 60,
  counter: 50,
  vehicle: 40,
  object: 30,
  npc: 20,
};

export interface InteractionCandidate {
  id: string;
  kind: InteractionKind;
  x: number;
  y: number;
  radius: number;
  label: string;
}

/**
 * Choose what `E` would do right now. Returns null when a UI panel is open (the panel owns input)
 * or when nothing is in range. Ties in priority go to the nearest candidate.
 */
export function pickInteraction(
  candidates: readonly InteractionCandidate[],
  px: number,
  py: number,
  uiOpen: boolean,
): InteractionCandidate | null {
  if (uiOpen) return null;
  let best: InteractionCandidate | null = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    const d = Math.hypot(c.x - px, c.y - py);
    if (d > c.radius) continue;
    const score = INTERACTION_PRIORITY[c.kind] * 1000 - d;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
