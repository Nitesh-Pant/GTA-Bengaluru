import type { Point } from './geometry';

export interface StationDef {
  id: string;
  name: string;
  /** Where the player interacts to enter. */
  entrance: Point;
  /** Where the player appears on arrival (must be walkable). */
  exit: Point;
  /** Position along the elevated track. */
  platform: Point;
  connections: string[];
}

export function destinationsFrom(stations: readonly StationDef[], fromId: string): StationDef[] {
  const from = stations.find((s) => s.id === fromId);
  if (!from) return [];
  return from.connections.map((id) => stations.find((s) => s.id === id)).filter((s): s is StationDef => !!s);
}

/** Returns a list of problems with the network definition (empty when valid). */
export function validateNetwork(stations: readonly StationDef[]): string[] {
  const errors: string[] = [];
  const ids = new Set(stations.map((s) => s.id));
  if (ids.size !== stations.length) errors.push('duplicate station ids');
  for (const s of stations) {
    for (const c of s.connections) {
      if (!ids.has(c)) errors.push(`${s.id} connects to unknown ${c}`);
      else if (!stations.find((o) => o.id === c)!.connections.includes(s.id)) errors.push(`${s.id}->${c} is one-way`);
      if (c === s.id) errors.push(`${s.id} connects to itself`);
    }
  }
  return errors;
}

/** Project a point onto a polyline, returning the distance along it. */
function distanceAlong(track: readonly Point[], p: Point): number {
  let best = Infinity;
  let bestAlong = 0;
  let acc = 0;
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (len * len || 1)));
    const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < best) {
      best = d;
      bestAlong = acc + t * len;
    }
    acc += len;
  }
  return bestAlong;
}

export function pointAt(track: readonly Point[], along: number): Point & { angle: number } {
  let acc = 0;
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (along <= acc + len || i === track.length - 2) {
      const t = len ? Math.max(0, Math.min(1, (along - acc) / len)) : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    acc += len;
  }
  const last = track[track.length - 1];
  return { ...last, angle: 0 };
}

export interface TravelPlan {
  from: StationDef;
  to: StationDef;
  startAlong: number;
  endAlong: number;
  durationMs: number;
}

export function planTrip(stations: readonly StationDef[], track: readonly Point[], fromId: string, toId: string, pxPerSec = 260): TravelPlan | null {
  const from = stations.find((s) => s.id === fromId);
  const to = stations.find((s) => s.id === toId);
  if (!from || !to || from === to || !from.connections.includes(toId)) return null;
  const startAlong = distanceAlong(track, from.platform);
  const endAlong = distanceAlong(track, to.platform);
  const durationMs = Math.max(2500, (Math.abs(endAlong - startAlong) / pxPerSec) * 1000);
  return { from, to, startAlong, endAlong, durationMs };
}
