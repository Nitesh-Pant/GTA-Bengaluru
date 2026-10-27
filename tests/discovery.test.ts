import { describe, expect, it } from 'vitest';
import { addHint, checkDiscoveries, visibilityOf, type PoiDef } from '../src/logic/discovery';

const pois: PoiDef[] = [
  { id: 'cafe', name: 'Cafe', district: 'd', kind: 'food', x: 0, y: 0, radius: 30, description: '' },
  { id: 'secret', name: 'Secret', district: 'd', kind: 'hidden', hidden: true, x: 500, y: 0, radius: 30, description: '' },
];

describe('discovery', () => {
  it('discovers places within their radius, once', () => {
    let state = { discovered: [] as string[], hinted: [] as string[] };
    const r1 = checkDiscoveries(state, pois, 10, 10);
    expect(r1.found.map((p) => p.id)).toEqual(['cafe']);
    state = r1.state;
    expect(checkDiscoveries(state, pois, 10, 10).found).toEqual([]);
  });
  it('hidden places are secret until hinted, then shown as unknown, then known', () => {
    let state = { discovered: [] as string[], hinted: [] as string[] };
    expect(visibilityOf(state, pois[1])).toBe('secret');
    expect(visibilityOf(state, pois[0])).toBe('unknown');
    const h = addHint(state, 'secret');
    expect(h.isNew).toBe(true);
    state = h.state;
    expect(visibilityOf(state, pois[1])).toBe('unknown');
    expect(addHint(state, 'secret').isNew).toBe(false);
    state = checkDiscoveries(state, pois, 500, 0).state;
    expect(visibilityOf(state, pois[1])).toBe('known');
  });
});
