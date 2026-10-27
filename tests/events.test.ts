import { describe, expect, it } from 'vitest';
import { EventScheduler, type EventDef } from '../src/logic/eventScheduler';

const defs: EventDef[] = [
  { id: 'rain', title: 'Rain', areas: 'any', cooldownMs: 60000, chance: 1, durationMs: 10000, requires: { notRaining: true } },
  { id: 'cricket', title: 'Cricket', areas: ['foodlane'], cooldownMs: 30000, chance: 1, durationMs: 5000 },
];
const ctx = { area: 'park', raining: false, walking: true, busy: false };

describe('event scheduler', () => {
  it('waits for the global gap before the first event', () => {
    const s = new EventScheduler(defs, () => 0, 20000, 0);
    expect(s.tick(5000, ctx)).toBeNull();
    expect(s.tick(21000, ctx)?.id).toBe('rain');
  });
  it('runs one event at a time and respects cooldowns', () => {
    const s = new EventScheduler(defs, () => 0, 1000, 0);
    expect(s.tick(2000, { ...ctx, area: 'foodlane' })).not.toBeNull();
    expect(s.tick(3000, { ...ctx, area: 'foodlane' })).toBeNull(); // one active
    const active = s.active!.id;
    s.end(active, 4000);
    const next = s.tick(6000, { ...ctx, area: 'foodlane' });
    expect(next?.id).not.toBe(active);
    s.end(next!.id, 7000);
    expect(s.tick(9000, { ...ctx, area: 'foodlane' })).toBeNull(); // both cooling down
  });
  it('checks areas and requirements', () => {
    const s = new EventScheduler(defs, () => 0, 0, 0);
    expect(s.eligible(defs[1], 0, ctx)).toBe(false);
    expect(s.eligible(defs[0], 0, { ...ctx, raining: true })).toBe(false);
    expect(s.eligible(defs[0], 0, { ...ctx, busy: true })).toBe(false);
  });
  it('ends timed-out events by itself', () => {
    const s = new EventScheduler(defs, () => 0, 0, 0);
    s.tick(1, ctx);
    s.tick(20000, ctx);
    expect(s.active).toBeNull();
  });
});
