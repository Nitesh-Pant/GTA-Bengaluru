import { describe, expect, it } from 'vitest';
import { facingFrom, scaledForScreen, stepDrive, stickAim, stickDrive, walkVelocity, type DriveParams } from '../src/logic/movement';

const none = { up: false, down: false, left: false, right: false };
const P: DriveParams = { maxSpeed: 200, reverseSpeed: 70, accel: 150, brake: 340, drag: 90, turnRate: 2.8 };

describe('walking', () => {
  it('has the same speed in every direction, including diagonals', () => {
    const dirs = [
      { ...none, up: true },
      { ...none, right: true },
      { ...none, up: true, right: true },
      { ...none, down: true, left: true },
    ];
    for (const d of dirs) {
      const v = walkVelocity(d, 78);
      expect(Math.hypot(v.vx, v.vy)).toBeCloseTo(78, 5);
    }
  });
  it('stands still with no input or opposing keys', () => {
    expect(walkVelocity(none, 78)).toEqual({ vx: 0, vy: 0 });
    expect(walkVelocity({ ...none, left: true, right: true }, 78)).toEqual({ vx: 0, vy: 0 });
  });
  it('faces the dominant direction and keeps facing when idle', () => {
    expect(facingFrom(10, 2, 'up')).toBe('right');
    expect(facingFrom(0, -5, 'left')).toBe('up');
    expect(facingFrom(0, 0, 'left')).toBe('left');
  });
});

describe('driving', () => {
  it('accelerates up to max speed', () => {
    let s = { speed: 0, heading: 0 };
    for (let i = 0; i < 300; i++) s = stepDrive(s, { ...none, up: true }, P, 1 / 60);
    expect(s.speed).toBe(P.maxSpeed);
  });
  it('brakes, then reverses at most reverseSpeed', () => {
    let s = { speed: 100, heading: 0 };
    for (let i = 0; i < 400; i++) s = stepDrive(s, { ...none, down: true }, P, 1 / 60);
    expect(s.speed).toBe(-P.reverseSpeed);
  });
  it('handbrake stops without reversing', () => {
    let s = { speed: 180, heading: 0 };
    for (let i = 0; i < 120; i++) s = stepDrive(s, none, P, 1 / 60, true);
    expect(s.speed).toBe(0);
  });
  it('cannot turn on the spot', () => {
    const s = stepDrive({ speed: 0, heading: 1 }, { ...none, left: true }, P, 1 / 60);
    expect(s.heading).toBe(1);
  });
});

describe('touch driving (point-to-steer)', () => {
  const drive = (s: { speed: number; heading: number }, stick: { x: number; y: number }, seconds: number) => {
    for (let i = 0; i < seconds * 60; i++) s = stepDrive(s, stickDrive(stick, s, P), P, 1 / 60);
    return s;
  };
  it('ignores a resting thumb', () => {
    expect(stickDrive({ x: 0.1, y: 0.05 }, { speed: 0, heading: 0 }, P)).toEqual(none);
  });
  it('drives straight where the stick points', () => {
    expect(stickDrive({ x: 1, y: 0 }, { speed: 0, heading: 0 }, P)).toEqual({ ...none, up: true });
  });
  it('turns towards the stick, whichever way the vehicle faces', () => {
    // Facing right (east), stick points up the screen (north): ends up heading north and moving.
    const s = drive({ speed: 0, heading: 0 }, { x: 0, y: -1 }, 3);
    expect(Math.abs(s.heading + Math.PI / 2)).toBeLessThan(0.1);
    expect(s.speed).toBeGreaterThan(100);
    // Facing down the screen, stick points left: ends up heading left, not right.
    const t = drive({ speed: 0, heading: Math.PI / 2 }, { x: -1, y: 0 }, 3);
    expect(Math.abs(Math.abs(t.heading) - Math.PI)).toBeLessThan(0.1);
  });
  it('a light push cruises slowly', () => {
    const s = drive({ speed: 0, heading: 0 }, { x: 0.4, y: 0 }, 5);
    expect(s.speed).toBeGreaterThan(P.maxSpeed * 0.3);
    expect(s.speed).toBeLessThan(P.maxSpeed * 0.45);
  });
  it('reverses when pointing behind from a stop', () => {
    const s = drive({ speed: 0, heading: 0 }, { x: -1, y: 0 }, 1);
    expect(s.speed).toBeLessThan(0);
  });
  it('a thumb nearly along a road means along the road, so the vehicle does not weave', () => {
    expect(stickAim({ x: 1, y: 0.25 })).toBe(0); // about 14° off: straight right
    expect(stickAim({ x: 0.2, y: -1 })).toBeCloseTo(-Math.PI / 2); // nearly up the screen: straight up
    expect(stickAim({ x: 1, y: 1 })).toBeCloseTo(Math.PI / 4); // a real diagonal stays diagonal
    expect(stickAim({ x: 0.05, y: 0.1 })).toBeNull();
    expect(stickDrive({ x: 1, y: 0.25 }, { speed: 120, heading: 0 }, P)).toEqual({ ...none, up: true });
  });
  it('slows into a sharp turn so it turns tightly instead of swinging wide', () => {
    // Going fast to the right, stick points up the screen: brake while turning.
    const into = stickDrive({ x: 0, y: -1 }, { speed: 180, heading: 0 }, P);
    expect(into.down).toBe(true);
    expect(into.left).toBe(true);
    // From a stop it covers far less ground before facing the new way than at full throttle.
    let s = { speed: 0, heading: 0 };
    let ahead = 0;
    while (Math.abs(s.heading + Math.PI / 2) > 0.1) {
      s = stepDrive(s, stickDrive({ x: 0, y: -1 }, s, P), P, 1 / 60);
      ahead += Math.cos(s.heading) * s.speed * (1 / 60);
    }
    expect(ahead).toBeLessThan(40);
  });
  it('brakes into a U-turn at speed instead of reversing', () => {
    const first = stickDrive({ x: -1, y: 0.1 }, { speed: 180, heading: 0 }, P);
    expect(first.down).toBe(true);
    expect(first.left || first.right).toBe(true);
  });
});

describe('driving on small screens', () => {
  it('leaves big screens alone', () => {
    expect(scaledForScreen(P, 1)).toBe(P);
  });
  it('is calmer on a phone: lower top speed, softer acceleration', () => {
    const phone = scaledForScreen(P, 0.57); // a typical phone in portrait
    expect(phone.maxSpeed).toBeCloseTo(114, 0);
    expect(phone.accel).toBeLessThan(P.accel);
    expect(phone.turnRate).toBe(P.turnRate);
  });
  it('never crawls: slow vehicles keep a usable top speed', () => {
    const yulu = { ...P, maxSpeed: 120 };
    expect(scaledForScreen(yulu, 0.5).maxSpeed).toBe(85);
    expect(scaledForScreen({ ...P, maxSpeed: 70 }, 0.5).maxSpeed).toBe(70);
  });
});
