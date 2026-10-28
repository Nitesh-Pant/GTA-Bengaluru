export type Violation = 'red' | 'speed' | 'helmet';
export type ChallanAction = 'pay' | 'adjust' | 'plead';

/** Fines in rupees. */
export const FINES: Record<Violation, number> = { red: 500, speed: 1000, helmet: 500 };

/**
 * How a challan ends. Paying is the fine. "Swalpa adjust maadi, sir" works a bit under half the time,
 * and costs extra when it doesn't. "I'm new to Bengaluru" always works the first time, rarely after.
 */
export function challanOutcome(action: ChallanAction, fine: number, earlierChallans: number, rng: () => number): { letOff: boolean; fine: number } {
  if (action === 'pay') return { letOff: false, fine };
  if (action === 'adjust') return rng() < 0.45 ? { letOff: true, fine: 0 } : { letOff: false, fine: fine + 200 };
  return earlierChallans === 0 || rng() < 0.25 ? { letOff: true, fine: 0 } : { letOff: false, fine };
}
