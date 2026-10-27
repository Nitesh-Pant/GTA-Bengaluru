import type { Point } from './geometry';

export type ObstacleKind = 'vehicle' | 'player' | 'playerVehicle' | 'ped' | 'static' | 'signal';

export interface Obstacle {
  id: string;
  kind: ObstacleKind;
  x: number;
  y: number;
  radius: number;
  /** Vehicles may slowly squeeze past (roadworks, a resting cow, a parked car). */
  squeeze?: boolean;
}

export interface ScanHit {
  obstacle: Obstacle;
  /** Free distance between our front bumper and the obstacle's edge. */
  gap: number;
  /** Which side the obstacle sits on relative to our heading (+1 right, -1 left). */
  side: number;
}

/** Look ahead along (dx, dy) for the nearest obstacle inside our lane corridor. */
export function scanAhead(
  x: number,
  y: number,
  dx: number,
  dy: number,
  halfLen: number,
  lookAhead: number,
  halfWidth: number,
  obstacles: readonly Obstacle[],
  selfId: string,
  ignore: ReadonlySet<ObstacleKind> = new Set(),
): ScanHit | null {
  let best: ScanHit | null = null;
  for (const o of obstacles) {
    if (o.id === selfId || ignore.has(o.kind)) continue;
    const rx = o.x - x;
    const ry = o.y - y;
    const along = rx * dx + ry * dy;
    if (along <= 0) continue;
    const lateral = rx * -dy + ry * dx;
    if (Math.abs(lateral) > halfWidth + o.radius) continue;
    const gap = along - halfLen - o.radius;
    if (gap > lookAhead) continue;
    if (!best || gap < best.gap) best = { obstacle: o, gap, side: lateral >= 0 ? 1 : -1 };
  }
  return best;
}

/** Speed we should be doing given free road ahead. Comes to a halt `stopGap` px short. */
export function targetSpeedForGap(maxSpeed: number, gap: number, stopGap = 3): number {
  if (gap <= stopGap) return 0;
  return Math.min(maxSpeed, (gap - stopGap) * 3);
}

export type Light = 'green' | 'yellow' | 'red';
export interface SignalTiming {
  green: number;
  yellow: number;
  allRed: number;
}
export const DEFAULT_TIMING: SignalTiming = { green: 9000, yellow: 2000, allRed: 1200 };

/** Two-phase signal: east-west then north-south, each with yellow and an all-red clearance. */
export function signalState(timeMs: number, timing: SignalTiming = DEFAULT_TIMING, offset = 0): { ew: Light; ns: Light } {
  const half = timing.green + timing.yellow + timing.allRed;
  const t = (((timeMs + offset) % (half * 2)) + half * 2) % (half * 2);
  const phase = (local: number): Light => (local < timing.green ? 'green' : local < timing.green + timing.yellow ? 'yellow' : 'red');
  if (t < half) return { ew: phase(t), ns: 'red' };
  return { ew: 'red', ns: phase(t - half) };
}

export interface JunctionBox {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  signal: boolean;
  offset: number;
  /** Width of the zebra crossing band outside the box. */
  crossing: number;
}

/**
 * Distance to the stop line a vehicle must respect, or Infinity if it may proceed.
 * Vehicles already past the line (inside the crossing or box) never stop for the signal.
 */
export function stopLineGap(
  x: number,
  y: number,
  dx: number,
  dy: number,
  halfLen: number,
  boxes: readonly JunctionBox[],
  timeMs: number,
  timing: SignalTiming = DEFAULT_TIMING,
): number {
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  let best = Infinity;
  for (const b of boxes) {
    if (!b.signal) continue;
    const s = signalState(timeMs, timing, b.offset);
    const light = horizontal ? s.ew : s.ns;
    if (light === 'green') continue;
    let line: number;
    let pos: number;
    let inSpan: boolean;
    if (horizontal) {
      inSpan = y >= b.y0 && y <= b.y1;
      pos = x;
      line = dx > 0 ? b.x0 - b.crossing : b.x1 + b.crossing;
    } else {
      inSpan = x >= b.x0 && x <= b.x1;
      pos = y;
      line = dy > 0 ? b.y0 - b.crossing : b.y1 + b.crossing;
    }
    if (!inSpan) continue;
    const dir = horizontal ? Math.sign(dx) : Math.sign(dy);
    const gap = (line - pos) * dir - halfLen;
    if (gap < -2 || gap > 140) continue;
    // On yellow, only stop if we comfortably can.
    if (light === 'yellow' && gap < 18) continue;
    best = Math.min(best, Math.max(0, gap));
  }
  return best;
}

export interface Route {
  id: string;
  points: Point[];
  loop: boolean;
}

export interface TrafficCar {
  id: string;
  route: Route;
  /** Index of the waypoint we're heading to. */
  wp: number;
  x: number;
  y: number;
  heading: number;
  speed: number;
  maxSpeed: number;
  halfLen: number;
  halfWidth: number;
  /** Sideways offset used to squeeze past obstacles. */
  lateral: number;
  /** Keep the squeeze offset until this time, so we don't drift back into the obstacle. */
  squeezeUntil: number;
  squeezeSide: number;
  blockedBy: Obstacle | null;
  blockTime: number;
  stuckTime: number;
  ghostUntil: number;
  done: boolean;
}

export interface TrafficEnv {
  now: number;
  obstacles: readonly Obstacle[];
  boxes: readonly JunctionBox[];
}

export const STUCK_GHOST_AFTER = 5;
const GHOST_FOR = 2500;
const SQUEEZE_OFFSET = 17;
const SQUEEZE_HOLD = 1500;

/** Position including the squeeze offset; this is where the car actually is in the world. */
export function carPosition(c: TrafficCar): Point {
  const nx = -Math.sin(c.heading);
  const ny = Math.cos(c.heading);
  return { x: c.x + nx * c.lateral, y: c.y + ny * c.lateral };
}

export function routeDirection(c: TrafficCar): Point {
  const p = c.route.points[Math.min(c.wp, c.route.points.length - 1)];
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Advance one traffic car by dt seconds. Mutates and returns the car. */
export function stepCar(c: TrafficCar, env: TrafficEnv, dt: number): TrafficCar {
  if (c.done) return c;
  const dir = routeDirection(c);
  const pos = carPosition(c);
  const ghost = env.now < c.ghostUntil;
  const ignore = new Set<ObstacleKind>(ghost ? ['vehicle', 'static'] : []);
  const lookAhead = 16 + c.speed * 0.5;
  const hit = scanAhead(pos.x, pos.y, dir.x, dir.y, c.halfLen, lookAhead, c.halfWidth, env.obstacles, c.id, ignore);
  const lineGap = stopLineGap(c.x, c.y, dir.x, dir.y, c.halfLen, env.boxes, env.now);

  let gap = Infinity;
  let blocker: Obstacle | null = null;
  if (hit) {
    // Swalpa adjust: an obstacle we may squeeze past makes us edge sideways (holding until clear).
    if (hit.obstacle.squeeze && hit.gap < 40) {
      c.squeezeSide = -hit.side;
      c.squeezeUntil = env.now + SQUEEZE_HOLD;
    }
    gap = hit.gap;
    blocker = hit.obstacle;
  }
  const squeezing = env.now < c.squeezeUntil;
  const want = squeezing ? c.squeezeSide * SQUEEZE_OFFSET : 0;
  c.lateral += (want - c.lateral) * Math.min(1, dt * (squeezing ? 4 : 1.5));
  if (!squeezing && Math.abs(c.lateral) < 0.3) c.lateral = 0;
  const cap = squeezing ? c.maxSpeed * 0.4 : c.maxSpeed;
  if (lineGap < gap) {
    gap = lineGap;
    blocker = { id: 'signal', kind: 'signal', x: c.x, y: c.y, radius: 0 };
  }

  const target = Math.min(cap, targetSpeedForGap(c.maxSpeed, gap));
  const accel = target > c.speed ? 110 : 420;
  c.speed += Math.sign(target - c.speed) * Math.min(Math.abs(target - c.speed), accel * dt);

  // Move along the route.
  let remaining = c.speed * dt;
  while (remaining > 0 && !c.done) {
    const p = c.route.points[c.wp];
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (d <= remaining) {
      c.x = p.x;
      c.y = p.y;
      remaining -= d;
      c.wp++;
      if (c.wp >= c.route.points.length) {
        if (c.route.loop) c.wp = 0;
        else c.done = true;
      }
    } else {
      c.x += ((p.x - c.x) / d) * remaining;
      c.y += ((p.y - c.y) / d) * remaining;
      remaining = 0;
    }
  }
  if (c.done) return c;
  const nd = routeDirection(c);
  if (c.speed > 1) {
    const desired = Math.atan2(nd.y, nd.x);
    let delta = desired - c.heading;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    c.heading += Math.sign(delta) * Math.min(Math.abs(delta), 7 * dt);
  }

  const stopped = c.speed < 4;
  c.blockedBy = stopped ? blocker : null;
  if (stopped && blocker) {
    c.blockTime += dt;
    if (blocker.kind === 'vehicle' || blocker.kind === 'static') c.stuckTime += dt;
    else c.stuckTime = 0;
  } else {
    c.blockTime = 0;
    c.stuckTime = 0;
  }
  if (c.stuckTime > STUCK_GHOST_AFTER) {
    // Minor pathing knots must never become permanent jams.
    c.ghostUntil = env.now + GHOST_FOR;
    c.stuckTime = 0;
  }
  return c;
}

/** Two cars waiting on each other (e.g. crossing paths inside a junction): let the lower id go. */
export function resolveDeadlocks(cars: TrafficCar[], now: number) {
  const byId = new Map(cars.map((c) => [c.id, c]));
  for (const c of cars) {
    const b = c.blockedBy;
    if (!b || b.kind !== 'vehicle') continue;
    const other = byId.get(b.id);
    if (other?.blockedBy?.kind === 'vehicle' && other.blockedBy.id === c.id && c.id < other.id && c.blockTime > 0.8) {
      c.ghostUntil = Math.max(c.ghostUntil, now + 1500);
    }
  }
}

/** How many cars are queued (transitively) behind the car with `headId`. */
export function queueLength(cars: readonly TrafficCar[], headId: string): number {
  const behind = new Map<string, string[]>();
  for (const c of cars) {
    if (c.blockedBy?.kind === 'vehicle') {
      const list = behind.get(c.blockedBy.id) ?? [];
      list.push(c.id);
      behind.set(c.blockedBy.id, list);
    }
  }
  let n = 0;
  const seen = new Set<string>([headId]);
  const stack = [headId];
  while (stack.length) {
    for (const id of behind.get(stack.pop()!) ?? []) {
      if (seen.has(id)) continue;
      seen.add(id);
      n++;
      stack.push(id);
    }
  }
  return n;
}
