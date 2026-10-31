import { describe, expect, it } from 'vitest';
import { LINE_POOLS } from '../src/data/dialogue';
import { CONVERSATIONS } from '../src/data/conversations';
import { festivalFromUrl, festivalOn, FESTIVALS } from '../src/data/festivals';
import { NPCS } from '../src/data/npcs';

describe('festival calendar', () => {
  it('every day is a festival, one after another, then round again', () => {
    expect(festivalOn(0).id).toBe(FESTIVALS[0].id);
    expect(festivalOn(1).id).toBe(FESTIVALS[1].id);
    expect(festivalOn(FESTIVALS.length).id).toBe(FESTIVALS[0].id);
  });
  it('a game can start on any festival and carries on in order from there', () => {
    expect(festivalOn(0, 3).id).toBe(FESTIVALS[3].id);
    expect(festivalOn(1, FESTIVALS.length - 1).id).toBe(FESTIVALS[0].id);
  });
  it('every festival has lines for people to say', () => {
    for (const f of FESTIVALS) expect(LINE_POOLS[f.pool]?.length, f.pool).toBeGreaterThan(2);
  });
  it('festival hosts are real people with a festival conversation', () => {
    for (const f of FESTIVALS)
      if (f.host) {
        expect(NPCS.some((n) => n.id === f.host!.npc), `${f.id} host`).toBe(true);
        expect(CONVERSATIONS[f.host.conversation], `${f.id} conversation`).toBeDefined();
      }
  });
  it('a festival can be forced from the address for trying it out', () => {
    expect(festivalFromUrl('?festival=deepavali')?.name).toBe('Deepavali');
    expect(festivalFromUrl('?festival=nope')).toBeUndefined();
    expect(festivalFromUrl('')).toBeUndefined();
  });
});
