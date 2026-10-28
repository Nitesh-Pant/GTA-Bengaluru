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
const YULU: DriveParams = { maxSpeed: 120, reverseSpeed: 25, accel: 140, brake: 300, drag: 120, turnRate: 3.6 };
/** Texture variant for Yulu e-bikes (see BootScene). */
export const YULU_VARIANT = 9;
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

const auto = (id: string, name: string, x: number, y: number, heading: number, note: string): RideableDef => ({
  id,
  name,
  type: 'auto',
  variant: 3,
  x: t(x),
  y: t(y),
  heading,
  params: AUTO,
  halfLen: 10,
  halfWidth: 7,
  note,
});

const scooter = (id: string, x: number, y: number, heading: number): RideableDef => ({
  id,
  name: 'Rental Scooter',
  type: 'scooter',
  variant: 3,
  x: t(x),
  y: t(y),
  heading,
  params: SCOOTER,
  halfLen: 7,
  halfWidth: 4,
  note: 'A shared rental scooter. Battery: 64%. Helmet: optimistic.',
});

const UP = -Math.PI / 2;

/** Only these vehicles can be driven. No stealing traffic. Every area has at least one within a short walk. */
export const RIDEABLES: RideableDef[] = [
  { id: 'hatchback', name: "Cousin's Hatchback", type: 'car', variant: 6, x: t(19), y: t(30), heading: -Math.PI / 2, params: CAR, halfLen: 14, halfWidth: 7, note: 'Your cousin left the keys with you. "Full tank illa, adjust maadi."' },
  auto('rajuauto', "Raju's Auto", 104.5, 81.5, 0, 'Raju anna is on his lunch break. "Ondu round ashte, scratch maadbedi!"'),
  auto('auto_indira', "Manju's Auto", 38.5, 22.9, 0, 'Manju anna is having chai. "Meter haaki, cheating maadbedi. Keys ille ide."'),
  auto('auto_mg', "Shivanna's Auto", 38.9, 112, UP, 'Shivanna is watching cricket on his phone. "Take it, take it. Last over nodbeku."'),
  auto('auto_kora', "Venki's Auto", 86.9, 120, UP, 'Venki is stuck in a phone call with his landlord. He waves you in.'),
  auto('auto_btm', "Basavaraj's Auto", 92.9, 120, UP, 'Basavaraj is napping in the shade. You leave a note: "Borrowed. Will return. Promise."'),
  ...[
    { id: 'yulu_metro', x: 31, y: 63, heading: 0 },
    { id: 'yulu_tech', x: 69, y: 16.9, heading: 0 },
    { id: 'yulu_mg', x: 37, y: 103.5, heading: 0 },
    { id: 'yulu_kora', x: 57, y: 124.3, heading: 0 },
    { id: 'yulu_btm', x: 106, y: 112.9, heading: 0 },
    { id: 'yulu_hub', x: 118, y: 80, heading: 0 },
    { id: 'yulu_indira', x: 38.9, y: 29, heading: UP },
    { id: 'yulu_bagmane', x: 86.9, y: 7, heading: UP },
    { id: 'yulu_marath', x: 92.9, y: 32, heading: UP },
    { id: 'yulu_ulsoor', x: 77, y: 56.9, heading: 0 },
    { id: 'yulu_thippa', x: 44.9, y: 78, heading: UP },
    { id: 'yulu_stadium', x: 38.9, y: 129, heading: UP },
    { id: 'yulu_cubbon', x: 11, y: 116, heading: 0 },
    { id: 'yulu_silkboard', x: 124.5, y: 112.9, heading: 0 },
    { id: 'yulu_vidhana', x: 22, y: 162.9, heading: 0 },
    { id: 'yulu_basava', x: 66, y: 162.9, heading: 0 },
    { id: 'yulu_lalbagh', x: 108, y: 162.9, heading: 0 },
  ].map(
    (y): RideableDef => ({
      id: y.id,
      name: 'Yulu e-bike',
      type: 'scooter',
      variant: YULU_VARIANT,
      x: t(y.x),
      y: t(y.y),
      heading: y.heading,
      params: YULU,
      halfLen: 7,
      halfWidth: 4,
      note: 'QR scanned, Yulu unlocked. Battery 78%. Top speed: very polite. Park it anywhere, everyone does.',
    }),
  ),
  scooter('scooter', 62, 13.4, 0),
  scooter('scooter_krpuram', 108, 62.9, 0),
  scooter('scooter_nandigate', 145.5, 56.9, 0),
  scooter('scooter_dhaba', 166, 74, 0),
  scooter('scooter_summit', 156, 35.4, 0),
];
