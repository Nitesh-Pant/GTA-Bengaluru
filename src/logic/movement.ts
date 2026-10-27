import { angleDelta } from './geometry';

export interface DirInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export type Facing = 'down' | 'left' | 'right' | 'up';

/** Walking velocity; diagonals are normalised so they are never faster than straight lines. */
export function walkVelocity(input: DirInput, speed: number): { vx: number; vy: number } {
  const x = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const y = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (x === 0 && y === 0) return { vx: 0, vy: 0 };
  const len = Math.hypot(x, y);
  return { vx: (x / len) * speed, vy: (y / len) * speed };
}

export function facingFrom(vx: number, vy: number, prev: Facing): Facing {
  if (vx === 0 && vy === 0) return prev;
  if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  return vy > 0 ? 'down' : 'up';
}

export interface DriveParams {
  maxSpeed: number;
  reverseSpeed: number;
  accel: number;
  brake: number;
  drag: number;
  turnRate: number;
}

export interface DriveState {
  speed: number;
  heading: number;
}

/**
 * Arcade driving: up accelerates, down brakes then reverses, left/right steer (scaled by speed).
 * The handbrake brings the vehicle to a stop and holds it there (it never reverses).
 */
export function stepDrive(s: DriveState, input: DirInput, p: DriveParams, dt: number, handbrake = false): DriveState {
  let { speed, heading } = s;
  if (handbrake) {
    const d = p.brake * 1.3 * dt;
    speed = Math.abs(speed) <= d ? 0 : speed - Math.sign(speed) * d;
  } else if (input.up && !input.down) {
    speed += (speed < 0 ? p.brake : p.accel) * dt;
  } else if (input.down && !input.up) {
    speed -= (speed > 0 ? p.brake : p.accel * 0.6) * dt;
  } else {
    const d = p.drag * dt;
    speed = Math.abs(speed) <= d ? 0 : speed - Math.sign(speed) * d;
  }
  speed = Math.max(-p.reverseSpeed, Math.min(p.maxSpeed, speed));
  const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (steer !== 0 && speed !== 0) {
    const grip = Math.min(1, Math.abs(speed) / (p.maxSpeed * 0.35));
    heading += steer * p.turnRate * grip * Math.sign(speed) * dt;
  }
  heading = Math.atan2(Math.sin(heading), Math.cos(heading));
  return { speed, heading };
}

/** Rotate `from` towards `to` by at most maxStep radians. */
export function turnTowards(from: number, to: number, maxStep: number): number {
  const d = angleDelta(from, to);
  if (Math.abs(d) <= maxStep) return to;
  return from + Math.sign(d) * maxStep;
}
