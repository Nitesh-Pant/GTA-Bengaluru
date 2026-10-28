import { describe, expect, it } from 'vitest';
import { CONVERSATIONS, QUIZ } from '../src/data/conversations';
import { EXCHANGES, LINE_POOLS } from '../src/data/dialogue';
import { EVENTS } from '../src/data/events';
import { LOOKS } from '../src/data/looks';
import { DISTRICTS } from '../src/data/map';
import { NPCS } from '../src/data/npcs';
import { POIS, POI_IDS } from '../src/data/pois';
import { ROUTES, TRAFFIC } from '../src/data/roads';
import { RIDEABLES } from '../src/data/vehicles';

describe('content data integrity', () => {
  it('NPC ids are unique and reference real looks, pools and conversations', () => {
    expect(new Set(NPCS.map((n) => n.id)).size).toBe(NPCS.length);
    for (const n of NPCS) {
      expect(LOOKS[n.look], `${n.id} look`).toBeDefined();
      for (const c of n.categories) expect(LINE_POOLS[c], `${n.id} pool ${c}`).toBeDefined();
      if (n.conversation) expect(CONVERSATIONS[n.conversation], `${n.id} conversation`).toBeDefined();
    }
  });
  it('chat groups have at least two members', () => {
    const groups = new Map<string, number>();
    for (const n of NPCS) if (n.behaviour.type === 'chat') groups.set(n.behaviour.group, (groups.get(n.behaviour.group) ?? 0) + 1);
    for (const [g, count] of groups) expect(count, g).toBeGreaterThanOrEqual(2);
  });
  it('conversation links and effects point at real nodes and places', () => {
    for (const conv of Object.values(CONVERSATIONS)) {
      expect(conv.nodes[conv.start]).toBeDefined();
      for (const node of Object.values(conv.nodes)) {
        const effects = [...(node.effects ?? []), ...(node.options ?? []).flatMap((o) => o.effects ?? [])];
        for (const o of node.options ?? []) if (o.next && o.next !== QUIZ) expect(conv.nodes[o.next], `${conv.id}.${o.next}`).toBeDefined();
        for (const e of effects) if (e.type === 'hint' || e.type === 'destination') expect(POI_IDS.has(e.poi), e.poi).toBe(true);
      }
    }
  });
  it('has a varied pool of lines with unique ids', () => {
    const all = Object.values(LINE_POOLS).flat();
    expect(new Set(all.map((l) => l.id)).size).toBe(all.length);
    expect(all.length).toBeGreaterThan(150);
    for (const ex of EXCHANGES) expect(new Set(ex.lines.map((l) => l.who)).size, ex.id).toBe(2);
  });
  it('places are unique, belong to a district, and hidden ones have hints', () => {
    expect(POI_IDS.size).toBe(POIS.length);
    const districts = new Set(DISTRICTS.map((d) => d.id));
    for (const p of POIS) {
      expect(districts.has(p.district), p.id).toBe(true);
      if (p.hidden) expect(p.hint, p.id).toBeTruthy();
    }
  });
  it('traffic and rideables reference valid routes and types', () => {
    const routes = new Set(ROUTES.map((r) => r.id));
    for (const t of TRAFFIC) expect(routes.has(t.route), t.id).toBe(true);
    expect(RIDEABLES.map((r) => r.type)).toEqual(expect.arrayContaining(['car', 'auto']));
  });
  it('events have sensible cooldowns and probabilities', () => {
    for (const e of EVENTS) {
      expect(e.chance).toBeGreaterThan(0);
      expect(e.chance).toBeLessThanOrEqual(1);
      expect(e.cooldownMs).toBeGreaterThanOrEqual(30000);
    }
  });
});
