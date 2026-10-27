import { describe, expect, it } from 'vitest';
import { facingFrom, stepDrive, walkVelocity, type DriveParams } from '../src/logic/movement';

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
