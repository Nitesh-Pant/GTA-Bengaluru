export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

export const pointInRect = (px: number, py: number, r: Rect) =>
  px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;

export const rectsOverlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Shortest signed angle from a to b, in radians. */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True if a box centred on (x, y) with the given half-extents hits any solid rect. */
/** The value in `values` closest to `v`. */
export const nearest = (values: readonly number[], v: number) => values.reduce((best, a) => (Math.abs(a - v) < Math.abs(best - v) ? a : best));

/** The item closest to `p`, with its distance; null for an empty list. */
export function closest<T extends Point>(items: readonly T[], p: Point): { item: T; distance: number } | null {
  let best: { item: T; distance: number } | null = null;
  for (const item of items) {
    const d = dist(item.x, item.y, p.x, p.y);
    if (!best || d < best.distance) best = { item, distance: d };
  }
  return best;
}

export function boxHitsSolids(x: number, y: number, halfW: number, halfH: number, solids: readonly Rect[]): boolean {
  const box = { x: x - halfW, y: y - halfH, w: halfW * 2, h: halfH * 2 };
  return solids.some((s) => rectsOverlap(box, s));
}
