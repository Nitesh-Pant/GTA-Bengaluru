export type PlayerMode =
  | { kind: 'walk' }
  | { kind: 'drive'; vehicleId: string }
  | { kind: 'metro'; from: string; to: string }
  | { kind: 'ride' };

export interface RideableInfo {
  id: string;
  occupied: boolean;
  x: number;
  y: number;
  heading: number;
  speed: number;
  halfLen: number;
  halfWidth: number;
}

export const ENTER_RADIUS = 26;
export const MAX_EXIT_SPEED = 25;

export function canEnter(mode: PlayerMode, v: RideableInfo, px: number, py: number): boolean {
  return mode.kind === 'walk' && !v.occupied && Math.hypot(v.x - px, v.y - py) <= ENTER_RADIUS + v.halfLen;
}

export function enterVehicle(mode: PlayerMode, v: RideableInfo, px: number, py: number): PlayerMode | null {
  if (!canEnter(mode, v, px, py)) return null;
  return { kind: 'drive', vehicleId: v.id };
}

export type ExitResult = { ok: true; mode: PlayerMode; x: number; y: number } | { ok: false; reason: 'moving' | 'blocked' | 'not-driving' };

/**
 * Leave the vehicle. The player reappears at the first free spot beside it
 * (left door, right door, behind, in front), never inside a wall.
 */
export function exitVehicle(mode: PlayerMode, v: RideableInfo, isFree: (x: number, y: number) => boolean): ExitResult {
  if (mode.kind !== 'drive' || mode.vehicleId !== v.id) return { ok: false, reason: 'not-driving' };
  if (Math.abs(v.speed) > MAX_EXIT_SPEED) return { ok: false, reason: 'moving' };
  const fx = Math.cos(v.heading);
  const fy = Math.sin(v.heading);
  const side = v.halfWidth + 9;
  const end = v.halfLen + 9;
  const candidates = [
    { x: v.x + fy * side, y: v.y - fx * side },
    { x: v.x - fy * side, y: v.y + fx * side },
    { x: v.x - fx * end, y: v.y - fy * end },
    { x: v.x + fx * end, y: v.y + fy * end },
    { x: v.x + fy * (side + 10), y: v.y - fx * (side + 10) },
    { x: v.x - fy * (side + 10), y: v.y + fx * (side + 10) },
  ];
  const spot = candidates.find((c) => isFree(c.x, c.y));
  if (!spot) return { ok: false, reason: 'blocked' };
  return { ok: true, mode: { kind: 'walk' }, x: spot.x, y: spot.y };
}
