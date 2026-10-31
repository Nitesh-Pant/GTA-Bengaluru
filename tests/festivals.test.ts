import { describe, expect, it } from 'vitest';
import { LINE_POOLS } from '../src/data/dialogue';
import { festivalFor, festivalOn, FESTIVALS, isRajyotsavaMonth, rajyotsavaNumber } from '../src/data/festivals';

describe('festival calendar', () => {
  it('starts the game on a festival so players meet one straight away', () => {
    expect(festivalOn(0)?.id).toBe('ugadi');
  });
  it('repeats every two weeks and has ordinary days in between', () => {
    expect(festivalOn(14)?.id).toBe(festivalOn(0)?.id);
    expect(festivalOn(1)).toBeNull();
    expect(festivalOn(10)?.id).toBe('deepavali');
  });
  it('every festival has lines for people to say and is on the calendar', () => {
    for (const f of FESTIVALS) {
      expect(LINE_POOLS[f.pool]?.length, f.pool).toBeGreaterThan(2);
      expect(Array.from({ length: 14 }, (_, d) => festivalOn(d)?.id), f.id).toContain(f.id);
    }
  });
});

describe('real-date festivals', () => {
  it('1 November is Kannada Rajyotsava whatever the game day', () => {
    const nov1 = new Date(2026, 10, 1, 10);
    expect(festivalFor(1, nov1)).toEqual({ festival: FESTIVALS.find((f) => f.id === 'rajyotsava'), real: true });
    expect(festivalFor(10, nov1).festival?.id).toBe('rajyotsava');
  });
  it('other dates follow the game calendar', () => {
    expect(festivalFor(10, new Date(2026, 10, 2))).toEqual({ festival: festivalOn(10), real: false });
  });
  it('counts the Rajyotsava years and flags autos all November', () => {
    expect(rajyotsavaNumber(new Date(2026, 10, 1))).toBe('70th');
    expect(rajyotsavaNumber(new Date(2027, 10, 1))).toBe('71st');
    expect(rajyotsavaNumber(new Date(2068, 10, 1))).toBe('112th');
    expect(isRajyotsavaMonth(new Date(2026, 10, 20))).toBe(true);
    expect(isRajyotsavaMonth(new Date(2026, 9, 31))).toBe(false);
  });
});
