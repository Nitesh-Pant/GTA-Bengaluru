import { describe, expect, it } from 'vitest';
import { fogAt, isSunrise, morningMist, SUNRISE_WAIT_TO } from '../src/logic/nandi';

const h = (hours: number) => hours * 60;

describe('Nandi Hills mornings', () => {
  it('has mist only in the early morning', () => {
    expect(morningMist(h(3))).toBe(0);
    expect(morningMist(h(6))).toBe(1);
    expect(morningMist(h(8.25))).toBeCloseTo(0.5, 5);
    expect(morningMist(h(12))).toBe(0);
  });
  it('gets foggier the higher you climb', () => {
    expect(fogAt(h(5.2), 0)).toBe(0);
    expect(fogAt(h(5.2), 0.3)).toBeLessThan(fogAt(h(5.2), 0.7));
    expect(fogAt(h(14), 1)).toBe(0);
  });
  it('puts the summit above the clouds at sunrise', () => {
    expect(isSunrise(h(6))).toBe(true);
    expect(fogAt(h(6), 1)).toBeLessThan(fogAt(h(6), 0.5));
    expect(fogAt(h(7.5), 1)).toBeGreaterThan(0.5);
  });
  it('waiting for the sunrise lands just before it', () => {
    expect(isSunrise(SUNRISE_WAIT_TO)).toBe(false);
    expect(isSunrise(SUNRISE_WAIT_TO + 6)).toBe(true);
  });
});
