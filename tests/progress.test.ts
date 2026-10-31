import { FESTIVALS } from '../src/data/festivals';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_IDS, ACHIEVEMENTS } from '../src/data/achievements';
import { CONVERSATIONS, type Effect } from '../src/data/conversations';
import { DISH_IDS, DISHES } from '../src/data/food';
import { NPCS } from '../src/data/npcs';
import { POIS } from '../src/data/pois';
import { newlyUnlocked } from '../src/logic/achievements';
import { defaultStats, sanitize } from '../src/logic/save';

const effectsOf = (convId: string): Effect[] =>
  Object.values(CONVERSATIONS[convId].nodes).flatMap((n) => [...(n.effects ?? []), ...(n.options ?? []).flatMap((o) => o.effects ?? [])]);

describe('food book', () => {
  it('every taste effect names a real dish', () => {
    for (const id of Object.keys(CONVERSATIONS))
      for (const e of effectsOf(id)) if (e.type === 'taste') expect(DISH_IDS.has(e.dish), `${id}: ${e.dish}`).toBe(true);
  });
  it('every dish can be ordered from some NPC (festival foods from that festival\'s host)', () => {
    const convs = [...NPCS.flatMap((n) => (n.conversation ? [n.conversation] : [])), ...FESTIVALS.flatMap((f) => (f.host ? [f.host.conversation] : []))];
    const orderable = new Set(convs.flatMap((c) => effectsOf(c)).flatMap((e) => (e.type === 'taste' ? [e.dish] : [])));
    for (const d of DISHES) expect(orderable.has(d.id), d.id).toBe(true);
  });
});

describe('achievements', () => {
  const none = { stats: defaultStats(), discovered: [], tasted: [] };
  it('ids are unique and nothing is unlocked at the start', () => {
    expect(ACHIEVEMENT_IDS.size).toBe(ACHIEVEMENTS.length);
    expect(newlyUnlocked(ACHIEVEMENTS, none, [])).toEqual([]);
  });
  it('unlocks from stats, places and dishes, and only once', () => {
    const p = { stats: { ...defaultStats(), chai: 1, honks: 50 }, discovered: POIS.map((x) => x.id), tasted: DISHES.map((d) => d.id) };
    const ids = newlyUnlocked(ACHIEVEMENTS, p, []).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['first_chai', 'honk_50', 'taste_5', 'taste_all', 'stations', 'campus', 'insider', 'all_places']));
    expect(ids).not.toContain('chai_10');
    expect(newlyUnlocked(ACHIEVEMENTS, p, ids)).toEqual([]);
  });
});

describe('progress saves', () => {
  it('keeps known dishes and achievements, drops unknown ones, and defaults new stats', () => {
    const d = sanitize({ tasted: ['masala_dose', 'pizza', 'masala_dose'], achievements: ['cow', 'fake'], stats: { chai: 3, honks: 'lots' } }, new Set(), { dishes: DISH_IDS, achievements: ACHIEVEMENT_IDS });
    expect(d.tasted).toEqual(['masala_dose']);
    expect(d.achievements).toEqual(['cow']);
    expect(d.stats).toEqual({ ...defaultStats(), chai: 3 });
  });
  it('old saves without the new fields still load', () => {
    const d = sanitize({ version: 2, discovered: [], stats: { chai: 2, dosa: 1, metroRides: 0, drives: 4 } }, new Set());
    expect(d.tasted).toEqual([]);
    expect(d.achievements).toEqual([]);
    expect(d.stats.drives).toBe(4);
    expect(d.stats.cow).toBe(0);
  });
});
