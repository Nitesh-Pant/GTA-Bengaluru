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

/** Within this angle (radians) the vehicle counts as pointing where the stick points; stops wobbling. */
export const STEER_DEADBAND = 0.06;
/** A stick within this angle (radians, about 20°) of a road direction means that road direction. */
const ROAD_SNAP = 0.35;

/**
 * Where the stick asks to go (radians, screen angle), or null for a resting thumb. Roads run straight
 * across and up the screen, so a thumb that's nearly along one counts as exactly along it: no weaving.
 */
export function stickAim(stick: { x: number; y: number }): number | null {
  if (Math.hypot(stick.x, stick.y) < 0.2) return null;
  const angle = Math.atan2(stick.y, stick.x);
  const road = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
  return Math.abs(angleDelta(angle, road)) <= ROAD_SNAP ? Math.atan2(Math.sin(road), Math.cos(road)) : angle;
}

/**
 * Touch driving, point-to-steer: drag the stick the way you want to go (on screen) and the vehicle turns
 * that way and drives there. How far the stick is pushed sets the cruising speed, and sharp turns slow
 * it down so it turns tightly instead of swinging wide into the buildings. Pointing back from a
 * near-stop reverses, swinging the tail towards the stick, so dead ends are easy to back out of.
 */
export function stickDrive(stick: { x: number; y: number }, s: DriveState, p: DriveParams): DirInput {
  const out: DirInput = { up: false, down: false, left: false, right: false };
  const target = stickAim(stick);
  if (target === null) return out;
  const push = Math.min(1, Math.hypot(stick.x, stick.y));
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
  // Cruise at the pushed speed, less the more there is still to turn (down to 40% at a right angle),
  // braking into a turn taken too fast.
  const turning = Math.min(1, Math.max(0, (Math.abs(diff) - 0.4) / (Math.PI / 2 - 0.4)));
  const cruise = p.maxSpeed * push * (1 - 0.6 * turning);
  if ((Math.abs(diff) > Math.PI / 2 && s.speed > 60) || s.speed > cruise + 30) out.down = true;
  else if (s.speed < cruise) out.up = true;
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
