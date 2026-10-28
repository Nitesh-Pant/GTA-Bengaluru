import { describe, expect, it } from 'vitest';
import { POIS } from '../src/data/pois';
import { pathLength, planRide, type RoadGrid } from '../src/logic/bikeRide';
import { pointAt } from '../src/logic/metro';
import { pickDelivery } from '../src/logic/delivery';
import { mulberry32 } from '../src/logic/rng';

const T = 16;
const grid: RoadGrid = { hs: [20 * T, 60 * T, 110 * T], vs: [42 * T, 90 * T], minX: T, maxX: 127 * T };
const onRoad = (p: { x: number; y: number }) => grid.hs.includes(p.y) || grid.vs.includes(p.x);

describe('bike taxi route', () => {
  it('stays on main roads and changes road only at a junction', () => {
    const pts = planRide({ x: 26 * T, y: 17 * T }, { x: 110 * T, y: 105 * T }, grid);
    for (const p of pts) expect(onRoad(p)).toBe(true);
    for (let i = 1; i < pts.length; i++) expect(pts[i].x === pts[i - 1].x || pts[i].y === pts[i - 1].y).toBe(true);
    expect(pts[0]).toEqual({ x: 26 * T, y: 20 * T });
    expect(pts[pts.length - 1]).toEqual({ x: 110 * T, y: 110 * T });
  });
  it('rides straight along the same road when it can', () => {
    expect(planRide({ x: 10 * T, y: 22 * T }, { x: 80 * T, y: 17 * T }, grid)).toEqual([
      { x: 10 * T, y: 20 * T },
      { x: 80 * T, y: 20 * T },
    ]);
  });
  it('walks the path by distance', () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }];
    expect(pathLength(pts)).toBe(150);
    expect(pointAt(pts, 120)).toMatchObject({ x: 100, y: 20 });
    expect(pointAt(pts, 999)).toMatchObject({ x: 100, y: 50 });
  });
});

describe('delivery jobs', () => {
  it('picks up food near you and drops it a fair way off, with time to match', () => {
    for (let seed = 1; seed < 30; seed++) {
      const job = pickDelivery(POIS, mulberry32(seed), { x: 53 * T, y: 76 * T })!;
      expect(job.pickup.kind).toBe('food');
      expect(['landmark', 'shop']).toContain(job.drop.kind);
      expect(job.drop.hidden).toBeFalsy();
      const d = Math.hypot(job.drop.x - job.pickup.x, job.drop.y - job.pickup.y) / T;
      expect(d).toBeGreaterThanOrEqual(25);
      expect(job.seconds).toBeGreaterThanOrEqual(45);
      expect(job.seconds).toBeLessThanOrEqual(150);
    }
  });
});
