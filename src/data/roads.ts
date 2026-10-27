import { TILE, WORLD_H, WORLD_W } from '../game/constants';
import type { JunctionBox, Route } from '../logic/traffic';

/** Lane centre lines (px). India drives on the left, so eastbound uses the north half of a road. */
export const LANE = {
  H1E: 19 * TILE,
  H1W: 21 * TILE,
  H2E: 59 * TILE,
  H2W: 61 * TILE,
  V1N: 41 * TILE,
  V1S: 43 * TILE,
  V2N: 89 * TILE,
  V2S: 91 * TILE,
};

const box = (id: string, tx: number, ty: number, offset: number): JunctionBox => ({
  id,
  x0: tx * TILE,
  y0: ty * TILE,
  x1: (tx + 4) * TILE,
  y1: (ty + 4) * TILE,
  signal: true,
  offset,
  crossing: 2 * TILE,
});

export const JUNCTIONS: JunctionBox[] = [
  box('cmh_100ft', 40, 18, 0),
  box('marathahalli', 88, 18, 4000),
  box('cmh_orr', 40, 58, 7000),
  box('mh_orr', 88, 58, 2500),
];

const OFF = 64;
const W = WORLD_W;
const H = WORLD_H;
const r = (id: string, loop: boolean, pts: Array<[number, number]>): Route => ({ id, loop, points: pts.map(([x, y]) => ({ x, y })) });

export const ROUTES: Route[] = [
  r('loop_cw', true, [[LANE.V1N, LANE.H1E], [LANE.V2S, LANE.H1E], [LANE.V2S, LANE.H2W], [LANE.V1N, LANE.H2W]]),
  r('loop_ccw', true, [[LANE.V2N, LANE.H1W], [LANE.V1S, LANE.H1W], [LANE.V1S, LANE.H2E], [LANE.V2N, LANE.H2E]]),
  r('h1_east', false, [[-OFF, LANE.H1E], [W + OFF, LANE.H1E]]),
  r('h1_west', false, [[W + OFF, LANE.H1W], [-OFF, LANE.H1W]]),
  r('h2_east', false, [[-OFF, LANE.H2E], [W + OFF, LANE.H2E]]),
  r('h2_west', false, [[W + OFF, LANE.H2W], [-OFF, LANE.H2W]]),
  r('v1_south', false, [[LANE.V1S, -OFF], [LANE.V1S, H + OFF]]),
  r('v1_north', false, [[LANE.V1N, H + OFF], [LANE.V1N, -OFF]]),
  r('v2_south', false, [[LANE.V2S, -OFF], [LANE.V2S, H + OFF]]),
  r('v2_north', false, [[LANE.V2N, H + OFF], [LANE.V2N, -OFF]]),
  // Turners through Marathahalli junction
  r('h1e_to_v2n', false, [[-OFF, LANE.H1E], [LANE.V2N, LANE.H1E], [LANE.V2N, -OFF]]),
  r('v2s_to_h1w', false, [[LANE.V2S, -OFF], [LANE.V2S, LANE.H1W], [-OFF, LANE.H1W]]),
  r('h1w_to_v2s', false, [[W + OFF, LANE.H1W], [LANE.V2S, LANE.H1W], [LANE.V2S, H + OFF]]),
];

export type TrafficType = 'car' | 'auto' | 'bus' | 'scooter';

export interface TrafficSpawn {
  id: string;
  type: TrafficType;
  variant: number;
  route: string;
  /** 0..1 along the route at start. */
  at: number;
}

export const TRAFFIC: TrafficSpawn[] = [
  { id: 't01', type: 'auto', variant: 0, route: 'loop_cw', at: 0.02 },
  { id: 't02', type: 'car', variant: 1, route: 'loop_cw', at: 0.3 },
  { id: 't03', type: 'scooter', variant: 0, route: 'loop_cw', at: 0.55 },
  { id: 't04', type: 'car', variant: 2, route: 'loop_cw', at: 0.8 },
  { id: 't05', type: 'bus', variant: 0, route: 'loop_ccw', at: 0.1 },
  { id: 't06', type: 'auto', variant: 1, route: 'loop_ccw', at: 0.45 },
  { id: 't07', type: 'car', variant: 3, route: 'loop_ccw', at: 0.7 },
  { id: 't08', type: 'car', variant: 0, route: 'h1_east', at: 0.35 },
  { id: 't09', type: 'auto', variant: 2, route: 'h1_west', at: 0.6 },
  { id: 't10', type: 'scooter', variant: 1, route: 'h1_west', at: 0.15 },
  { id: 't11', type: 'car', variant: 4, route: 'v2_south', at: 0.25 },
  { id: 't12', type: 'auto', variant: 0, route: 'v2_north', at: 0.5 },
  { id: 't13', type: 'car', variant: 5, route: 'h2_east', at: 0.5 },
  { id: 't14', type: 'scooter', variant: 2, route: 'h2_west', at: 0.3 },
  { id: 't15', type: 'auto', variant: 1, route: 'v1_south', at: 0.6 },
  { id: 't16', type: 'car', variant: 2, route: 'v1_north', at: 0.2 },
  { id: 't17', type: 'auto', variant: 2, route: 'h1e_to_v2n', at: 0.5 },
  { id: 't18', type: 'car', variant: 1, route: 'v2s_to_h1w', at: 0.1 },
  { id: 't19', type: 'bus', variant: 1, route: 'h1w_to_v2s', at: 0.3 },
  { id: 't20', type: 'scooter', variant: 0, route: 'h1_east', at: 0.7 },
];

/** Traffic body sizes (px): half length and half width. */
export const VEHICLE_SIZE: Record<TrafficType, { halfLen: number; halfWidth: number; maxSpeed: number }> = {
  car: { halfLen: 14, halfWidth: 7, maxSpeed: 95 },
  auto: { halfLen: 10, halfWidth: 7, maxSpeed: 80 },
  bus: { halfLen: 26, halfWidth: 8, maxSpeed: 70 },
  scooter: { halfLen: 7, halfWidth: 4, maxSpeed: 100 },
};

/** Viaduct for the metro, running above the Outer Ring Road median. */
export const METRO_TRACK = [
  { x: 0, y: 60 * TILE },
  { x: WORLD_W, y: 60 * TILE },
];
