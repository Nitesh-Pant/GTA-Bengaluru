/** Time of day in game minutes since midnight (0–1439). Pure helpers for lighting, traffic and dialogue. */
export const DAY_MINUTES = 24 * 60;
/** Game minutes per real second: a full day takes 16 real minutes. */
export const MINUTES_PER_SECOND = 1.5;
/** New games start at 8 in the morning. */
export const START_MINUTES = 8 * 60;

export type Period = 'morning' | 'day' | 'evening' | 'night';

const h = (hours: number) => hours * 60;

export const wrapMinutes = (m: number) => ((m % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

export function periodOf(m: number): Period {
  const t = wrapMinutes(m);
  if (t >= h(5) && t < h(11)) return 'morning';
  if (t >= h(11) && t < h(17)) return 'day';
  if (t >= h(17) && t < h(20.5)) return 'evening';
  return 'night';
}

/** Office rush: 8:30–10:30 and 17:30–20:00. */
export function isRushHour(m: number) {
  const t = wrapMinutes(m);
  return (t >= h(8.5) && t < h(10.5)) || (t >= h(17.5) && t < h(20));
}

const ramp = (t: number, from: number, to: number) => Math.max(0, Math.min(1, (t - from) / (to - from)));

/** 0 in daylight, 1 in the dead of night; smooth dusk (18:00–20:00) and dawn (5:00–6:30). */
export function darkness(m: number) {
  const t = wrapMinutes(m);
  if (t >= h(6.5) && t < h(18)) return 0;
  if (t >= h(18) && t < h(20)) return ramp(t, h(18), h(20));
  if (t >= h(5) && t < h(6.5)) return 1 - ramp(t, h(5), h(6.5));
  return 1;
}

/** Screen tint: warm at dawn and dusk, deep blue at night. */
export function tint(m: number): { color: number; alpha: number } {
  const d = darkness(m);
  const t = wrapMinutes(m);
  const golden = (t >= h(17) && t < h(19)) || (t >= h(5) && t < h(7));
  if (golden && d < 0.5) return { color: 0xff7a2e, alpha: 0.18 + d * 0.2 };
  return { color: 0x0b1030, alpha: d * 0.58 };
}

/** IPL nights: every other day (day 0 included), 18:30–23:00. */
export const isMatchTime = (day: number, m: number) => day % 2 === 0 && wrapMinutes(m) >= h(18.5) && wrapMinutes(m) < h(23);

/** How many of the traffic vehicles should be on the road. */
export function trafficTarget(m: number, total: number) {
  if (isRushHour(m)) return total;
  if (periodOf(m) === 'night') return Math.max(3, Math.round(total * 0.4));
  return Math.round(total * 0.75);
}

/** The four parts of the day, in order: label, and where the time jumps to when you pick it. */
export const PERIODS: ReadonlyArray<{ id: Period; label: string; jumpTo: number }> = [
  { id: 'morning', label: 'Morning', jumpTo: h(7) },
  { id: 'day', label: 'Afternoon', jumpTo: h(13) },
  { id: 'evening', label: 'Evening', jumpTo: h(18.5) },
  { id: 'night', label: 'Night', jumpTo: h(22) },
];
export const periodLabel = (p: Period) => PERIODS.find((x) => x.id === p)!.label;
/** The part of the day after `p` (night wraps to morning). */
export const nextPeriod = (p: Period) => PERIODS[(PERIODS.findIndex((x) => x.id === p) + 1) % PERIODS.length];

/** Seconds as m:ss, for timers. */
export const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;

export function formatClock(m: number) {
  const t = Math.floor(wrapMinutes(m));
  const hh = Math.floor(t / 60);
  const mm = t % 60;
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
}
