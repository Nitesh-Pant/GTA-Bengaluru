import { nearest, type Point } from './geometry';

/** Main-road centre lines in px: horizontal roads by y, vertical roads by x. */
export interface RoadGrid {
  hs: number[];
  vs: number[];
  minX: number;
  maxX: number;
}

/**
 * A bike-taxi route that sticks to the main roads: join the nearest road, switch roads at a
 * junction if needed, and ride along the destination's road to just beside it.
 */
export function planRide(from: Point, to: Point, grid: RoadGrid): Point[] {
  const clampX = (x: number) => Math.max(grid.minX, Math.min(grid.maxX, x));
  const hy0 = nearest(grid.hs, from.y);
  const vx0 = nearest(grid.vs, from.x);
  const hy1 = nearest(grid.hs, to.y);
  const pts: Point[] = [];
  if (Math.abs(hy0 - from.y) <= Math.abs(vx0 - from.x)) {
    pts.push({ x: clampX(from.x), y: hy0 });
    if (hy0 !== hy1) {
      const vx = nearest(grid.vs, (from.x + to.x) / 2);
      pts.push({ x: vx, y: hy0 }, { x: vx, y: hy1 });
    }
  } else {
    pts.push({ x: vx0, y: from.y }, { x: vx0, y: hy1 });
  }
  pts.push({ x: clampX(to.x), y: hy1 });
  return pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
}

export const pathLength = (pts: readonly Point[]) => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

/**
 * The guide route to a marker: along the main roads like a ride, but a straight line when it's close
 * enough to just walk there. Starts at `from` and ends exactly on the marker.
 */
export function guideRoute(from: Point, to: Point, grid: RoadGrid, straightWithin: number): Point[] {
  if (Math.hypot(to.x - from.x, to.y - from.y) <= straightWithin) return [from, to];
  const pts = [from, ...planRide(from, to, grid), to];
  return pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
}

/** Evenly spaced points along a path, the first `offset` px in (for dotted lines that drift forwards). */
export function pointsAlong(pts: readonly Point[], spacing: number, offset = 0): Point[] {
  const out: Point[] = [];
  let next = offset;
  let walked = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    while (next <= walked + len) {
      const k = len ? (next - walked) / len : 0;
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
      next += spacing;
    }
    walked += len;
  }
  return out;
}
