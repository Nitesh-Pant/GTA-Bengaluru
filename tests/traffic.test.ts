import { describe, expect, it } from 'vitest';
import { JUNCTIONS } from '../src/data/roads';
import {
  carPosition,
  queueLength,
  resolveDeadlocks,
  scanAhead,
  signalState,
  stepCar,
  stopLineGap,
  type Obstacle,
  type TrafficCar,
} from '../src/logic/traffic';

const car = (over: Partial<TrafficCar> = {}): TrafficCar => ({
  id: 'c',
  route: { id: 'r', loop: false, points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }] },
  wp: 1,
  x: 0,
  y: 0,
  heading: 0,
  speed: 80,
  maxSpeed: 90,
  halfLen: 14,
  halfWidth: 7,
  lateral: 0,
  squeezeUntil: 0,
  squeezeSide: 0,
  blockedBy: null,
  blockTime: 0,
  stuckTime: 0,
  ghostUntil: 0,
  done: false,
  ...over,
});
const run = (c: TrafficCar, obstacles: Obstacle[], seconds: number, boxes = [] as typeof JUNCTIONS, t0 = 0) => {
  let now = t0;
  for (let i = 0; i < seconds * 60; i++) {
    now += 1000 / 60;
    stepCar(c, { now, obstacles, boxes }, 1 / 60);
  }
  return c;
};

describe('scanning', () => {
  it('sees a car ahead in the same lane only', () => {
    const ahead: Obstacle = { id: 'a', kind: 'vehicle', x: 60, y: 0, radius: 12 };
    const oncoming: Obstacle = { id: 'b', kind: 'vehicle', x: 60, y: 32, radius: 12 };
    const behind: Obstacle = { id: 'd', kind: 'vehicle', x: -60, y: 0, radius: 12 };
    const hit = scanAhead(0, 0, 1, 0, 14, 100, 7, [ahead, oncoming, behind], 'c');
    expect(hit?.obstacle.id).toBe('a');
    expect(hit?.gap).toBe(60 - 14 - 12);
    expect(scanAhead(0, 0, 1, 0, 14, 100, 7, [oncoming, behind], 'c')).toBeNull();
  });
});

describe('car behaviour', () => {
  it('follows its route and finishes without errors', () => {
    const c = run(car(), [], 20);
    expect(c.done).toBe(true);
    expect(c.x).toBe(1000);
  });
  it('stops behind a pedestrian and moves on once they leave', () => {
    const ped: Obstacle = { id: 'p', kind: 'ped', x: 120, y: 0, radius: 5 };
    const c = run(car(), [ped], 4);
    expect(c.speed).toBeLessThan(1);
    expect(c.x).toBeLessThan(120 - 14 - 5);
    expect(c.blockedBy?.kind).toBe('ped');
    run(c, [], 2);
    expect(c.x).toBeGreaterThan(140);
  });
  it('squeezes past roadworks instead of jamming forever', () => {
    const cone: Obstacle = { id: 'cone', kind: 'static', x: 200, y: 4, radius: 7, squeeze: true };
    const c = run(car(), [cone], 12);
    expect(c.x).toBeGreaterThan(300);
  });
  it('a stuck car eventually ghosts past a broken-down vehicle', () => {
    const wreck: Obstacle = { id: 'w', kind: 'vehicle', x: 150, y: 0, radius: 14 };
    const c = run(car(), [wreck], 12);
    expect(c.x).toBeGreaterThan(200);
  });
  it('never ghosts through the player: it waits', () => {
    const player: Obstacle = { id: 'player', kind: 'player', x: 150, y: 0, radius: 5 };
    const c = run(car(), [player], 15);
    expect(c.x).toBeLessThan(150);
    expect(c.blockTime).toBeGreaterThan(10);
  });
  it('the squeeze offset moves the visible car sideways', () => {
    const c = car({ lateral: 10 });
    expect(carPosition(c).y).toBeCloseTo(10);
  });
});

describe('signals', () => {
  it('alternates east-west and north-south with no overlap of greens', () => {
    for (let t = 0; t < 60000; t += 250) {
      const s = signalState(t);
      expect(s.ew === 'green' && s.ns === 'green').toBe(false);
    }
  });
  it('a car waits at a red light and goes on green', () => {
    const j = JUNCTIONS[0];
    // Approach from the west along the eastbound lane while east-west is red.
    const y = j.y0 + 16;
    const startX = j.x0 - 200;
    const redEW = 12500; // north-south phase
    expect(signalState(redEW, undefined, j.offset).ew).toBe('red');
    const c = car({ route: { id: 'r', loop: false, points: [{ x: startX, y }, { x: j.x1 + 400, y }] }, x: startX, y });
    run(c, [], 5, [j], redEW);
    expect(c.speed).toBeLessThan(1);
    expect(c.x + c.halfLen).toBeLessThanOrEqual(j.x0 - j.crossing + 1);
    expect(stopLineGap(c.x, c.y, 1, 0, c.halfLen, [j], redEW + 5000)).toBeLessThan(5);
    run(c, [], 15, [j], redEW + 5000);
    expect(c.x).toBeGreaterThan(j.x1);
  });
});

describe('jams', () => {
  it('breaks a two-car standoff', () => {
    const a = car({ id: 'a', blockedBy: { id: 'b', kind: 'vehicle', x: 0, y: 0, radius: 1 }, blockTime: 1 });
    const b = car({ id: 'b', blockedBy: { id: 'a', kind: 'vehicle', x: 0, y: 0, radius: 1 }, blockTime: 1 });
    resolveDeadlocks([a, b], 1000);
    expect(a.ghostUntil).toBeGreaterThan(1000);
    expect(b.ghostUntil).toBe(0);
  });
  it('counts a queue behind a blocked car', () => {
    const head = car({ id: 'h' });
    const q1 = car({ id: 'q1', blockedBy: { id: 'h', kind: 'vehicle', x: 0, y: 0, radius: 1 } });
    const q2 = car({ id: 'q2', blockedBy: { id: 'q1', kind: 'vehicle', x: 0, y: 0, radius: 1 } });
    expect(queueLength([head, q1, q2], 'h')).toBe(2);
  });
});
