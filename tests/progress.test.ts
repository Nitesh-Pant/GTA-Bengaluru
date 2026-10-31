import { MARKS } from '../src/data/bucket';
import { FESTIVALS } from '../src/data/festivals';
import { describe, expect, it } from 'vitest';
import { CONVERSATIONS, type Effect } from '../src/data/conversations';
import { DISH_IDS, DISHES } from '../src/data/food';
import { NPCS } from '../src/data/npcs';
import { defaultStats, sanitize } from '../src/logic/save';

const effectsOf = (convId: string): Effect[] =>
  Object.values(CONVERSATIONS[convId].nodes).flatMap((n) => [...(n.effects ?? []), ...(n.options ?? []).flatMap((o) => o.effects ?? [])]);

describe('food book', () => {
  it('every taste effect names a real dish', () => {
    for (const id of Object.keys(CONVERSATIONS))
      for (const e of effectsOf(id)) if (e.type === 'taste') expect(DISH_IDS.has(e.dish), `${id}: ${e.dish}`).toBe(true);
  });
  it('dish ids are unique', () => {
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(DISHES.length);
  });
  it('every dish can be ordered from some NPC (festival foods from that festival\'s host)', () => {
    const convs = [...NPCS.flatMap((n) => (n.conversation ? [n.conversation] : [])), ...FESTIVALS.flatMap((f) => (f.host ? [f.host.conversation] : []))];
    const orderable = new Set(convs.flatMap((c) => effectsOf(c)).flatMap((e) => (e.type === 'taste' ? [e.dish] : [])));
    for (const d of DISHES) expect(orderable.has(d.id), d.id).toBe(true);
  });
});

describe('progress saves', () => {
  it('keeps known dishes and bucket-list moments, drops unknown ones, and defaults new stats', () => {
    const d = sanitize({ tasted: ['masala_dose', 'pizza', 'masala_dose'], marks: ['yulu', 'fake'], stats: { chai: 3, honks: 'lots' } }, new Set(), { dishes: DISH_IDS, marks: new Set<string>(MARKS) });
    expect(d.tasted).toEqual(['masala_dose']);
    expect(d.marks).toEqual(['yulu']);
    expect(d.stats).toEqual({ ...defaultStats(), chai: 3 });
  });
  it('old saves without the new fields still load', () => {
    const d = sanitize({ version: 2, discovered: [], stats: { chai: 2, dosa: 1, metroRides: 0, drives: 4 } }, new Set());
    expect(d.tasted).toEqual([]);
    expect(d.marks).toEqual([]);
    expect(d.stats.drives).toBe(4);
    expect(d.stats.cow).toBe(0);
  });
});
