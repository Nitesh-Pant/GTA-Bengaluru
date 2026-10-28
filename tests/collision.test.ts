import { describe, expect, it } from 'vitest';
import { BUILDINGS, buildGround, buildSolids, G, groundAt, PLAYER_SPAWN } from '../src/data/map';
import { STATIONS } from '../src/data/metro';
import { NPCS } from '../src/data/npcs';
import { BUS_STOPS, HAIL_SPOTS } from '../src/data/transit';
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
  it('bus stops and auto hail spots are on open pavement', () => {
    for (const p of [...BUS_STOPS, ...HAIL_SPOTS]) {
      expect(playerFits(p.x * 16, p.y * 16), `${p.x},${p.y}`).toBe(true);
      expect(groundAt(ground, p.x * 16, p.y * 16), `${p.x},${p.y}`).not.toBe(G.Road);
    }
  });
  it('lanes stay open where they meet the main roads', () => {
    // 12th Main and the Marathahalli lane cross the sidewalks of 100 Feet Road into the road.
    for (const [x, y] of [[19, 22.5], [19, 23.5], [109, 22.5], [109, 23.5]]) expect(boxHitsSolids(x * 16, y * 16, 7, 4, solids), `${x},${y}`).toBe(false);
  });
  it('Yulu bikes are not parked on any NPC route or wander zone', () => {
    for (const r of RIDEABLES.filter((v) => v.id.startsWith('yulu'))) {
      const x = r.x / 16;
      const y = r.y / 16;
      for (const n of NPCS) {
        const b = n.behaviour;
        if (b.type === 'wander') expect(x >= b.zone.x - 0.6 && x <= b.zone.x + b.zone.w + 0.6 && y >= b.zone.y - 0.5 && y <= b.zone.y + b.zone.h + 0.5, `${r.id} in ${n.id}'s zone`).toBe(false);
        if (b.type === 'route')
          b.points.forEach((p, i) => {
            const q = b.points[(i + 1) % b.points.length];
            for (let k = 0; k <= 40; k++) {
              const px = p.x + ((q.x - p.x) * k) / 40;
              const py = p.y + ((q.y - p.y) * k) / 40;
              expect(Math.abs(px - x) < 0.8 && Math.abs(py - y) < 0.6, `${r.id} on ${n.id}'s route`).toBe(false);
            }
          });
      }
    }
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
