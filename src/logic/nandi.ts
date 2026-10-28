/** Nandi Hills mornings: when the fog sits on the hill and when the sun comes up (minutes since midnight). */
export const SUNRISE_START = 5 * 60 + 30;
export const SUNRISE_END = 7 * 60;
/** "Wait for the sunrise" jumps the clock here. */
export const SUNRISE_WAIT_TO = 5 * 60 + 25;

const ramp = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));

export const isSunrise = (minutes: number) => minutes >= SUNRISE_START && minutes < SUNRISE_END;

/** How thick the morning mist is in general: builds from 4 AM, lifts by 9. */
export function morningMist(minutes: number) {
  return Math.min(ramp(minutes, 4 * 60, 5 * 60), 1 - ramp(minutes, 7.5 * 60, 9 * 60));
}

/**
 * Fog over the screen (0..~0.65) for someone at `height` on the hill (0 at the foot, 1 at the summit).
 * Thicker the higher you climb, except at sunrise, when the summit sits above the clouds.
 */
export function fogAt(minutes: number, height: number) {
  const mist = morningMist(minutes);
  if (height <= 0 || mist <= 0) return 0;
  if (height > 0.8 && isSunrise(minutes)) return 0.12;
  return mist * (0.25 + 0.4 * Math.min(1, height));
}
