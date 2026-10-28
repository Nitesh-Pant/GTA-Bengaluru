import type { Rect } from '../logic/geometry';

/** Street dogs: each keeps to a home patch (tiles) until someone shares a biscuit. */
export const DOGS: Array<{ name: string; variant: number; zone: Rect }> = [
  { name: 'Kalu', variant: 1, zone: { x: 46, y: 77, w: 14, h: 1 } },
  { name: 'Tommy', variant: 0, zone: { x: 18.2, y: 26, w: 1.4, h: 8 } },
  { name: 'Rani', variant: 2, zone: { x: 96, y: 78, w: 14, h: 2.5 } },
  { name: 'Brownie', variant: 0, zone: { x: 6, y: 136.2, w: 10, h: 1.6 } },
  { name: 'Jimmy', variant: 1, zone: { x: 94, y: 112.3, w: 30, h: 1.2 } },
  { name: 'Raja', variant: 2, zone: { x: 111, y: 43.3, w: 14, h: 1.4 } },
];

/** Where crows gather in threes (tiles). They scatter when you walk up. */
export const CROW_SPOTS: Array<{ x: number; y: number }> = [
  { x: 60, y: 79.6 },
  { x: 8, y: 85 },
  { x: 70, y: 54 },
  { x: 116, y: 44 },
  { x: 31, y: 141 },
  { x: 104, y: 129 },
  { x: 12, y: 129 },
];

/** Bonnet macaques on Nandi Hills (tiles). They will have your snack. */
export const MONKEYS: Array<{ name: string; zone: Rect }> = [
  { name: 'Chintu', zone: { x: 156, y: 36.4, w: 8, h: 1.2 } },
  { name: 'Pinky', zone: { x: 165, y: 35, w: 7, h: 1.5 } },
  { name: 'Bujji', zone: { x: 170, y: 31, w: 6, h: 1.4 } },
  { name: 'Raja', zone: { x: 144.5, y: 53.4, w: 3, h: 1.4 } },
];

/** Cows that wander slowly (Gowri, at the junction, never moves). */
export const COWS: Array<{ name: string; zone: Rect }> = [
  { name: 'Lakshmi', zone: { x: 4, y: 83, w: 14, h: 6 } },
  { name: 'Ganga', zone: { x: 97, y: 128, w: 4, h: 10 } },
];
