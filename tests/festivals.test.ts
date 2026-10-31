import { describe, expect, it } from 'vitest';
import { LINE_POOLS } from '../src/data/dialogue';
import { festivalOn, FESTIVALS } from '../src/data/festivals';

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

