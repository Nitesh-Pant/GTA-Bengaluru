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

/** Within this angle (radians) the vehicle counts as pointing where the stick points; stops wobbling. */
const STEER_DEADBAND = 0.06;

/**
 * Touch driving, point-to-steer: drag the stick the way you want to go (on screen) and the vehicle turns
 * that way and drives there. How far the stick is pushed sets the cruising speed. Pointing back from a
 * near-stop reverses, swinging the tail towards the stick, so dead ends are easy to back out of.
 */
export function stickDrive(stick: { x: number; y: number }, s: DriveState, p: DriveParams): DirInput {
  const out: DirInput = { up: false, down: false, left: false, right: false };
  const push = Math.min(1, Math.hypot(stick.x, stick.y));
  if (push < 0.2) return out;
  const target = Math.atan2(stick.y, stick.x);
  const diff = angleDelta(s.heading, target);
  if (Math.abs(diff) > (Math.PI * 3) / 4 && s.speed < 25) {
    // Reversing flips steering, so steer the opposite way to bring the tail round.
    const tail = angleDelta(s.heading + Math.PI, target);
    out.down = true;
    if (Math.abs(tail) > STEER_DEADBAND) {
      if (tail > 0) out.left = true;
      else out.right = true;
    }
    return out;
  }
  if (Math.abs(diff) > STEER_DEADBAND) {
    // Steering also flips while still rolling backwards.
    if (diff > 0 === s.speed >= 0) out.right = true;
    else out.left = true;
  }
  // Sharp turn at speed: brake into it. Otherwise cruise at the pushed speed.
  if (Math.abs(diff) > Math.PI / 2 && s.speed > 60) out.down = true;
  else if (s.speed < p.maxSpeed * push) out.up = true;
  return out;
}

/**
 * Driving tuned for the screen: `scale` is 1 on big screens and smaller on phones, where less road
 * fits ahead. Top speed scales down (never below a calm 85, or the vehicle's own top speed if lower)
 * and acceleration softens a little, so phone driving feels controlled.
 */
export function scaledForScreen(p: DriveParams, scale: number): DriveParams {
  if (scale >= 1) return p;
  return { ...p, maxSpeed: Math.max(Math.min(p.maxSpeed, 85), p.maxSpeed * scale), accel: p.accel * (0.6 + 0.4 * scale) };
}
