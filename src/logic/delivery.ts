import { TILE } from '../game/constants';
import type { PoiDef } from './discovery';
import type { Point } from './geometry';
import type { Rng } from './rng';

export interface DeliveryJob {
  pickup: PoiDef;
  drop: PoiDef;
  /** Real seconds allowed, from accepting the job. */
  seconds: number;
}


/** Places worth travelling to that are between `minTiles` and `maxTiles` from `from`. */
export function poisInRing(pois: readonly PoiDef[], from: Point, minTiles: number, maxTiles: number, keep: (p: PoiDef) => boolean) {
  return pois.filter((p) => {
    const d = Math.hypot(p.x - from.x, p.y - from.y) / TILE;
    return !p.hidden && keep(p) && d >= minTiles && d <= maxTiles;
  });
}

/**
 * A delivery run: collect from one of the food places near you, take it to an office, PG, shop or
 * landmark a fair distance away. Time allowed grows with the distance.
 */
export function pickDelivery(pois: readonly PoiDef[], rng: Rng, near: Point): DeliveryJob | null {
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) / TILE;
  const food = pois.filter((p) => p.kind === 'food' && !p.hidden).sort((a, b) => dist(a, near) - dist(b, near));
  if (!food.length) return null;
  const pickup = food[Math.floor(rng() * Math.min(5, food.length))];
  const drops = poisInRing(pois, pickup, 25, 75, (p) => p.kind === 'landmark' || p.kind === 'shop');
  if (!drops.length) return null;
  const drop = drops[Math.floor(rng() * drops.length)];
  const seconds = Math.round(Math.max(45, Math.min(150, 30 + (dist(near, pickup) + dist(pickup, drop)) * 0.8)));
  return { pickup, drop, seconds };
}
