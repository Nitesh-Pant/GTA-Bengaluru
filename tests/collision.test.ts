import { describe, expect, it } from 'vitest';
import { BUILDINGS, buildGround, buildSolids, G, groundAt, PLAYER_SPAWN } from '../src/data/map';
import { STATIONS } from '../src/data/metro';
import { NPCS } from '../src/data/npcs';
import { RIDEABLES } from '../src/data/vehicles';
import { boxHitsSolids, pointInRect } from '../src/logic/geometry';

const ground = buildGround();
const solids = buildSolids(ground);
const playerFits = (x: number, y: number) => !boxHitsSolids(x, y - 3, 4, 3, solids);

describe('collision data', () => {
  it('every building is solid', () => {
    for (const b of BUILDINGS) expect(boxHitsSolids((b.x + b.w / 2) * 16, (b.y + b.h / 2) * 16, 1, 1, solids)).toBe(true);
  });
  it('water is solid but roads are not', () => {
    expect(solids.some((s) => pointInRect(68.5 * 16, 44.5 * 16, s))).toBe(true);
    expect(groundAt(ground, 20 * 16, 19 * 16)).toBe(G.Road);
    expect(boxHitsSolids(20 * 16, 19 * 16, 4, 3, solids)).toBe(false);
  });
  it('the player spawn is walkable', () => {
    expect(playerFits(PLAYER_SPAWN.x * 16, PLAYER_SPAWN.y * 16)).toBe(true);
  });
  it('metro exits are walkable so arrival never traps the player', () => {
    for (const s of STATIONS) expect(playerFits(s.exit.x, s.exit.y), s.id).toBe(true);
  });
  it('rideable vehicles are not parked inside anything', () => {
    for (const r of RIDEABLES) expect(boxHitsSolids(r.x, r.y, r.halfWidth, r.halfWidth, solids), r.id).toBe(false);
  });
  it('NPCs start outside walls', () => {
    for (const n of NPCS) expect(solids.some((s) => pointInRect(n.x * 16, n.y * 16 - 1, s)), n.id).toBe(false);
  });
  it('wander zones are mostly walkable', () => {
    for (const n of NPCS) {
      if (n.behaviour.type !== 'wander') continue;
      const z = n.behaviour.zone;
      let free = 0;
      let total = 0;
      for (let x = z.x; x <= z.x + z.w; x += 0.5)
        for (let y = z.y; y <= z.y + z.h; y += 0.5) {
          total++;
          if (playerFits(x * 16, y * 16)) free++;
        }
      expect(free / total, n.id).toBeGreaterThan(0.7);
    }
  });
});
