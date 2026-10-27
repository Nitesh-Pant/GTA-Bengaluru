import { describe, expect, it } from 'vitest';
import { DialogueDirector, type LinePools } from '../src/logic/dialogueDirector';
import { mulberry32 } from '../src/logic/rng';

const pools: LinePools = {
  a: [
    { id: 'a1', text: 'one' },
    { id: 'a2', text: 'two' },
    { id: 'a3', text: 'three' },
  ],
  rain: [{ id: 'r1', text: 'wet', when: { rain: true } }],
};
const ctx = { area: 'x', raining: false, mode: 'walk' as const };

describe('dialogue director', () => {
  it('does not repeat a line until the pool is exhausted', () => {
    const d = new DialogueDirector(pools, { rng: mulberry32(1) });
    const seen = new Set([d.pick('n1', ['a'], ctx)!.id, d.pick('n1', ['a'], ctx)!.id, d.pick('n1', ['a'], ctx)!.id]);
    expect(seen.size).toBe(3);
  });
  it('per-speaker cooldown blocks immediate repetition', () => {
    const d = new DialogueDirector(pools, { rng: mulberry32(1), globalGapMs: 0 });
    expect(d.canSpeakAmbient('n1', 0)).toBe(true);
    d.markSpoke('n1', 0, 3000, 10000);
    expect(d.canSpeakAmbient('n1', 2000)).toBe(false);
    expect(d.canSpeakAmbient('n1', 12000)).toBe(false);
    expect(d.canSpeakAmbient('n1', 13001)).toBe(true);
  });
  it('a global gap stops everyone talking at once', () => {
    const d = new DialogueDirector(pools, { rng: mulberry32(1), globalGapMs: 1500 });
    d.markSpoke('n1', 0, 2000, 0);
    expect(d.canSpeakAmbient('n2', 500)).toBe(false);
    expect(d.canSpeakAmbient('n2', 1600)).toBe(true);
  });
  it('caps simultaneous bubbles', () => {
    const d = new DialogueDirector(pools, { rng: mulberry32(1), globalGapMs: 0, maxConcurrent: 2 });
    d.markSpoke('n1', 0, 5000, 0);
    d.markSpoke('n2', 0, 5000, 0);
    expect(d.canSpeakAmbient('n3', 100)).toBe(false);
    expect(d.canSpeakAmbient('n3', 5001)).toBe(true);
  });
  it('filters lines by context', () => {
    const d = new DialogueDirector(pools, { rng: mulberry32(1) });
    expect(d.pick('n1', ['rain'], ctx)).toBeNull();
    expect(d.pick('n1', ['rain'], { ...ctx, raining: true })?.id).toBe('r1');
  });
  it('leaving and re-entering an area does not replay the same line', () => {
    const d = new DialogueDirector(pools, { rng: mulberry32(3), globalGapMs: 0 });
    const first = d.pick('n1', ['a'], ctx)!.id;
    const second = d.pick('n1', ['a'], ctx)!.id;
    expect(second).not.toBe(first);
  });
});
