import { describe, expect, it } from 'vitest';
import { ReactionEngine, type Reactor } from '../src/logic/reactionEngine';
import { mulberry32 } from '../src/logic/rng';

const npc: Reactor = { id: 'n1', kind: 'npc', x: 0, y: 0, busy: false };
const car: Reactor = { id: 'c1', kind: 'vehicle', x: 10, y: 0, busy: false };
const engine = () => new ReactionEngine(mulberry32(5));

describe('reaction engine', () => {
  it('passing by produces no reaction', () => {
    expect(engine().handle({ type: 'player_pass', actorId: 'n1', x: 0, y: 0 }, [npc], 0)).toEqual([]);
  });
  it('a bump gets a brief startled line', () => {
    const r = engine().handle({ type: 'player_bump', actorId: 'n1', x: 0, y: 0 }, [npc], 0);
    expect(r).toHaveLength(1);
    expect(r[0].actions).toContain('startle');
    expect(r[0].category).toBe('bump');
  });
  it('sustained obstruction is a complaint, distinct from a bump', () => {
    const r = engine().handle({ type: 'player_block_ped', actorId: 'n1', x: 0, y: 0 }, [npc], 0);
    expect(r[0].category).toBe('block_ped');
    expect(r[0].actions).not.toContain('startle');
  });
  it('cooldowns stop repeated bump reactions', () => {
    const e = engine();
    expect(e.handle({ type: 'player_bump', actorId: 'n1', x: 0, y: 0 }, [npc], 0)).toHaveLength(1);
    expect(e.handle({ type: 'player_bump', actorId: 'n1', x: 0, y: 0 }, [npc], 1000)).toHaveLength(0);
    expect(e.handle({ type: 'player_bump', actorId: 'n1', x: 0, y: 0 }, [npc], 6000)).toHaveLength(1);
  });
  it('blocking traffic escalates from a honk to a longer complaint', () => {
    const e = engine();
    const first = e.handle({ type: 'player_block_vehicle', actorId: 'c1', x: 0, y: 0, level: 1 }, [car], 0);
    expect(first[0].actions).toEqual(['honk', 'say']);
    expect(first[0].category).toBe('block_vehicle');
    const later = e.handle({ type: 'player_block_vehicle', actorId: 'c1', x: 0, y: 0, level: 2 }, [car], 9000);
    expect(later[0].category).toBe('block_vehicle_long');
  });
  it('a busy NPC (talking to the player) does not react', () => {
    expect(engine().handle({ type: 'player_bump', actorId: 'n1', x: 0, y: 0 }, [{ ...npc, busy: true }], 0)).toEqual([]);
  });
  it('a higher-priority reaction is not contradicted by a lower one', () => {
    const e = engine();
    e.handle({ type: 'player_block_ped', actorId: 'n1', x: 0, y: 0 }, [npc], 0);
    expect(e.handle({ type: 'player_near', actorId: 'n1', x: 0, y: 0 }, [npc], 500)).toEqual([]);
  });
  it('rain sends some people to shelter and makes a few comment', () => {
    const crowd: Reactor[] = Array.from({ length: 10 }, (_, i) => ({ id: `n${i}`, kind: 'npc', x: i * 10, y: 0, busy: false }));
    const r = engine().handle({ type: 'rain_start', x: 0, y: 0 }, crowd, 0);
    expect(r.filter((x) => x.actions.includes('say')).length).toBeLessThanOrEqual(3);
    expect(r.some((x) => x.actions.includes('shelter'))).toBe(true);
  });
  it('area-wide reactions share a cooldown so a crowd does not chant', () => {
    const e = engine();
    const crowd: Reactor[] = [npc, { ...npc, id: 'n2' }];
    expect(e.handle({ type: 'queue_grow', x: 0, y: 0 }, crowd, 0)).toHaveLength(1);
    expect(e.handle({ type: 'queue_grow', x: 0, y: 0 }, crowd, 2000)).toHaveLength(0);
  });
});
