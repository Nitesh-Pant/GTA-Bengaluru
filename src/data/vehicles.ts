import { t } from '../game/constants';
import type { DriveParams } from '../logic/movement';
import type { TrafficType } from './roads';

export interface RideableDef {
  id: string;
  name: string;
  type: TrafficType;
  variant: number;
  x: number;
  y: number;
  heading: number;
  params: DriveParams;
  halfLen: number;
  halfWidth: number;
  /** Shown when entering: who lent it to you. */
  note: string;
}

const CAR: DriveParams = { maxSpeed: 200, reverseSpeed: 70, accel: 150, brake: 340, drag: 90, turnRate: 2.8 };
const AUTO: DriveParams = { maxSpeed: 150, reverseSpeed: 50, accel: 130, brake: 300, drag: 100, turnRate: 3.4 };
const SCOOTER: DriveParams = { maxSpeed: 175, reverseSpeed: 30, accel: 170, brake: 320, drag: 110, turnRate: 3.8 };

/** Parked, non-drivable vehicles that make streets and the auto stand feel lived in (tiles). */
export const PARKED: Array<{ type: TrafficType; variant: number; x: number; y: number; heading: number }> = [
  { type: 'auto', variant: 1, x: 101.5, y: 83.5, heading: 0 },
  { type: 'auto', variant: 2, x: 108.4, y: 83.5, heading: 0 },
  { type: 'auto', variant: 0, x: 111.6, y: 81.4, heading: Math.PI },
  { type: 'car', variant: 0, x: 5, y: 39, heading: 0 },
  { type: 'car', variant: 5, x: 13.5, y: 39, heading: Math.PI },
  { type: 'car', variant: 7, x: 28, y: 39, heading: 0 },
  { type: 'car', variant: 2, x: 109, y: 30, heading: Math.PI / 2 },
  { type: 'scooter', variant: 1, x: 77.5, y: 79.2, heading: -Math.PI / 2 },
];

/** Only these vehicles can be driven. No stealing traffic. */
export const RIDEABLES: RideableDef[] = [
  { id: 'hatchback', name: "Cousin's Hatchback", type: 'car', variant: 6, x: t(19), y: t(30), heading: -Math.PI / 2, params: CAR, halfLen: 14, halfWidth: 7, note: 'Your cousin left the keys with you. "Full tank illa, adjust maadi."' },
  { id: 'rajuauto', name: "Raju's Auto", type: 'auto', variant: 3, x: t(104.5), y: t(81.5), heading: 0, params: AUTO, halfLen: 10, halfWidth: 7, note: 'Raju anna is on his lunch break. "Ondu round ashte, scratch maadbedi!"' },
  { id: 'scooter', name: 'Rental Scooter', type: 'scooter', variant: 3, x: t(62), y: t(13.4), heading: 0, params: SCOOTER, halfLen: 7, halfWidth: 4, note: 'A shared rental scooter. Battery: 64%. Helmet: optimistic.' },
];
