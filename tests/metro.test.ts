import { describe, expect, it } from 'vitest';
import { STATIONS } from '../src/data/metro';
import { METRO_TRACK } from '../src/data/roads';
import { destinationsFrom, planTrip, pointAt, validateNetwork } from '../src/logic/metro';

describe('metro network', () => {
  it('is valid and two-way', () => {
    expect(validateNetwork(STATIONS)).toEqual([]);
    expect(STATIONS.length).toBeGreaterThanOrEqual(2);
  });
  it('travels in both directions to the right platform', () => {
    const there = planTrip(STATIONS, METRO_TRACK, 'indiranagar', 'hub')!;
    const back = planTrip(STATIONS, METRO_TRACK, 'hub', 'indiranagar')!;
    expect(there.to.id).toBe('hub');
    expect(back.to.id).toBe('indiranagar');
    expect(pointAt(METRO_TRACK, there.endAlong).x).toBeCloseTo(there.to.platform.x);
    expect(pointAt(METRO_TRACK, back.endAlong).x).toBeCloseTo(back.to.platform.x);
    expect(there.durationMs).toBeGreaterThan(2000);
  });
  it('rejects trips to unconnected or same stations', () => {
    expect(planTrip(STATIONS, METRO_TRACK, 'hub', 'hub')).toBeNull();
    expect(planTrip(STATIONS, METRO_TRACK, 'hub', 'nowhere')).toBeNull();
  });
  it('lists destinations from a station', () => {
    expect(destinationsFrom(STATIONS, 'indiranagar').map((s) => s.id)).toEqual(['hub']);
  });
  it('flags one-way or dangling links', () => {
    const broken = [
      { ...STATIONS[0], connections: ['hub', 'ghost'] },
      { ...STATIONS[1], connections: [] },
    ];
    const errs = validateNetwork(broken);
    expect(errs.some((e) => e.includes('ghost'))).toBe(true);
    expect(errs.some((e) => e.includes('one-way'))).toBe(true);
  });
});
