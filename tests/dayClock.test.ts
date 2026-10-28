import { describe, expect, it } from 'vitest';
import { LINE_POOLS } from '../src/data/dialogue';
import { DialogueDirector } from '../src/logic/dialogueDirector';
import { sanitize } from '../src/logic/save';
import { darkness, formatClock, isMatchTime, isRushHour, periodOf, tint, trafficTarget, wrapMinutes } from '../src/logic/dayClock';

const at = (hh: number, mm = 0) => hh * 60 + mm;

describe('day clock', () => {
  it('formats a 12-hour clock', () => {
    expect(formatClock(at(0, 5))).toBe('12:05 AM');
    expect(formatClock(at(8, 30))).toBe('8:30 AM');
    expect(formatClock(at(12))).toBe('12:00 PM');
    expect(formatClock(at(23, 59))).toBe('11:59 PM');
    expect(formatClock(at(24, 10))).toBe('12:10 AM');
  });
  it('wraps around midnight', () => {
    expect(wrapMinutes(-30)).toBe(at(23, 30));
    expect(wrapMinutes(at(25))).toBe(at(1));
  });
  it('names the periods', () => {
    expect(periodOf(at(7))).toBe('morning');
    expect(periodOf(at(13))).toBe('day');
    expect(periodOf(at(18))).toBe('evening');
    expect(periodOf(at(23))).toBe('night');
    expect(periodOf(at(3))).toBe('night');
  });
  it('is dark at night, light by day, and fades at dusk and dawn', () => {
    expect(darkness(at(12))).toBe(0);
    expect(darkness(at(23))).toBe(1);
    expect(darkness(at(19))).toBeCloseTo(0.5);
    expect(darkness(at(5, 45))).toBeCloseTo(0.5);
    expect(tint(at(12)).alpha).toBe(0);
    expect(tint(at(17, 30)).color).toBe(0xff7a2e);
    expect(tint(at(23)).alpha).toBeGreaterThan(0.5);
  });
  it('fills the roads at rush hour and thins them at night', () => {
    expect(isRushHour(at(9))).toBe(true);
    expect(isRushHour(at(18))).toBe(true);
    expect(isRushHour(at(14))).toBe(false);
    expect(trafficTarget(at(9), 20)).toBe(20);
    expect(trafficTarget(at(14), 20)).toBe(15);
    expect(trafficTarget(at(2), 20)).toBe(8);
  });
  it('IPL nights fall on every other evening', () => {
    expect(isMatchTime(0, at(19))).toBe(true);
    expect(isMatchTime(0, at(23, 30))).toBe(false);
    expect(isMatchTime(1, at(19))).toBe(false);
    expect(isMatchTime(2, at(18, 30))).toBe(true);
    expect(isMatchTime(2, at(12))).toBe(false);
  });
  it('time-of-day lines only play at their time', () => {
    const line = LINE_POOLS.ambient.find((l) => l.when?.time?.includes('night'))!;
    const d = new DialogueDirector({ ambient: [line] }, { rng: () => 0 });
    const ctx = { area: 'indiranagar', raining: false, mode: 'walk' as const };
    expect(d.pick('a', ['ambient'], { ...ctx, period: 'morning' })).toBeNull();
    expect(d.pick('b', ['ambient'], { ...ctx, period: 'night' })?.id).toBe(line.id);
  });
  it('saves the time of day, defaulting to 8 AM', () => {
    expect(sanitize({ timeOfDay: 1300 }, new Set()).timeOfDay).toBe(1300);
    expect(sanitize({ timeOfDay: 'noon' }, new Set()).timeOfDay).toBe(480);
    expect(sanitize({}, new Set()).timeOfDay).toBe(480);
  });
});
