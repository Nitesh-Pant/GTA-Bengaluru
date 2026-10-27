import { MAP_H, MAP_W, TILE } from '../game/constants';
import type { Rect } from '../logic/geometry';
import { VEHICLE_SIZE } from './roads';
import { PARKED } from './vehicles';

/**
 * The handcrafted city. All coordinates here are in tiles (16px).
 * Layout is a simplified, fictionalised blend of Bengaluru neighbourhoods,
 * not a geographic reproduction.
 *
 *   cols 0-39 | V1 (CMH Rd) 40-43 | 44-87 | V2 (Marathahalli Rd) 88-91 | 92-127
 *   rows 0-15   Indiranagar shops | Tech park   | Marathahalli shops
 *   rows 18-21  ===================== 100 Feet Road (H1) =====================
 *   rows 24-55  Indiranagar homes | Kere Park   | Mall + market
 *   rows 58-61  ===================== Outer Ring Road (H2) + metro viaduct ====
 *   rows 64-95  Food & chai lane + gully maidan  | Metro hub plaza
 */

export const G = {
  Pave: 0,
  Sidewalk: 1,
  Road: 2,
  Lane: 3,
  Grass: 4,
  Dirt: 5,
  Water: 6,
  Plaza: 7,
  FoodLane: 8,
  Garden: 9,
} as const;
export type GroundKind = (typeof G)[keyof typeof G];

/** Where a new walk begins: 100 Feet Road, beside the tea cart. */
export const PLAYER_SPAWN = { x: 26, y: 17.2 };

export function buildGround(): Uint8Array {
  const g = new Uint8Array(MAP_W * MAP_H).fill(G.Pave);
  const fill = (x: number, y: number, w: number, h: number, k: GroundKind) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < MAP_W && j < MAP_H) g[j * MAP_W + i] = k;
  };
  const ellipse = (cx: number, cy: number, rx: number, ry: number, k: GroundKind, only?: GroundKind) => {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
      for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
        const dx = (i + 0.5 - cx) / rx;
        const dy = (j + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (only === undefined || g[j * MAP_W + i] === only)) g[j * MAP_W + i] = k;
      }
  };

  // Tech park plaza and lawns
  fill(44, 0, 44, 16, G.Plaza);
  fill(46, 12, 24, 3, G.Garden);
  // Kere Park
  fill(44, 24, 44, 32, G.Grass);
  fill(44, 31, 44, 2, G.Dirt);
  fill(52, 24, 2, 32, G.Dirt);
  ellipse(68.5, 44.5, 10.5, 7.5, G.Dirt, G.Grass);
  ellipse(68.5, 44.5, 8.5, 5.5, G.Water);
  fill(76, 50, 8, 4, G.Garden);
  // Indiranagar front gardens
  fill(1, 6, 7, 2, G.Garden);
  fill(1, 47, 7, 2, G.Garden);
  // Marathahalli market square
  fill(110, 40, 18, 7, G.Plaza);
  // Food lane and the gully maidan
  fill(0, 74, 38, 3, G.FoodLane);
  fill(46, 74, 40, 3, G.FoodLane);
  fill(2, 80, 22, 14, G.Dirt);
  fill(28, 86, 10, 9, G.Garden);
  fill(46, 77, 40, 6, G.Plaza);
  fill(74, 84, 4, 11, G.FoodLane);
  // Metro hub plaza
  fill(92, 64, 36, 32, G.Plaza);
  // Minor streets (drivable, no AI traffic)
  fill(18, 0, 2, 16, G.Lane);
  fill(18, 24, 2, 32, G.Lane);
  fill(0, 38, 38, 2, G.Lane);
  fill(108, 0, 2, 16, G.Lane);
  fill(108, 24, 2, 32, G.Lane);
  // Sidewalks along the main roads
  fill(0, 16, MAP_W, 2, G.Sidewalk);
  fill(0, 22, MAP_W, 2, G.Sidewalk);
  fill(0, 56, MAP_W, 2, G.Sidewalk);
  fill(0, 62, MAP_W, 2, G.Sidewalk);
  for (const x of [38, 44, 86, 92]) fill(x, 0, 2, MAP_H, G.Sidewalk);
  // Main roads
  fill(0, 18, MAP_W, 4, G.Road);
  fill(0, 58, MAP_W, 4, G.Road);
  fill(40, 0, 4, MAP_H, G.Road);
  fill(88, 0, 4, MAP_H, G.Road);
  return g;
}

export type BuildingStyle =
  | 'shop'
  | 'cafe'
  | 'apartment'
  | 'house'
  | 'office'
  | 'mall'
  | 'metro'
  | 'temple'
  | 'darshini'
  | 'pub'
  | 'mural'
  | 'kiosk';

export interface BuildingDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  style: BuildingStyle;
  sign?: string;
  wall: string;
  roof: string;
  trim?: string;
  awning?: string;
  floors?: number;
}

export const BUILDINGS: BuildingDef[] = [
  // ── Indiranagar, north of 100 Feet Road
  { id: 'house_in1', x: 1, y: 0, w: 7, h: 6, style: 'house', wall: '#e9d8b4', roof: '#b4563e', floors: 1 },
  { id: 'bunbytes', x: 1, y: 8, w: 8, h: 8, style: 'cafe', sign: 'BUN & BYTES', wall: '#f2efe6', roof: '#8f9aa3', awning: '#2aa198', floors: 2 },
  { id: 'lakshmi_res', x: 10, y: 3, w: 7, h: 13, style: 'apartment', sign: 'LAKSHMI RES.', wall: '#efc6a0', roof: '#9aa0a6', floors: 4 },
  { id: 'house_in2', x: 21, y: 0, w: 7, h: 6, style: 'house', wall: '#cde3d0', roof: '#a9573f', floors: 1 },
  { id: 'kaapi', x: 21, y: 8, w: 7, h: 8, style: 'cafe', sign: 'FILTER KAAPI', wall: '#f6e3c3', roof: '#8d8f93', awning: '#7b4a2a', floors: 2 },
  { id: 'brewpub', x: 30, y: 5, w: 8, h: 11, style: 'pub', sign: 'HOPS & HOPPERS', wall: '#6b4b34', roof: '#575c61', awning: '#c58b2a', floors: 2 },
  // ── Indiranagar, south of 100 Feet Road
  { id: 'sneaker', x: 1, y: 26, w: 8, h: 9, style: 'shop', sign: 'SNEAKER ST', wall: '#f4f4f4', roof: '#8e979e', awning: '#e5533d', floors: 2 },
  { id: 'cowork', x: 10, y: 25, w: 7, h: 11, style: 'office', sign: 'COWORK HUB', wall: '#bcd3e0', roof: '#7d868c', floors: 3 },
  { id: 'gym', x: 21, y: 26, w: 8, h: 9, style: 'shop', sign: 'IRON GYM', wall: '#d9d9d9', roof: '#80878d', awning: '#222831', floors: 2 },
  { id: 'apts_in', x: 30, y: 24, w: 8, h: 12, style: 'apartment', sign: 'SKYVIEW APTS', wall: '#f5d48c', roof: '#9aa0a6', floors: 4 },
  { id: 'house_in3', x: 1, y: 41, w: 7, h: 6, style: 'house', wall: '#f1c9c9', roof: '#a14a3a', floors: 1 },
  { id: 'house_in4', x: 1, y: 49, w: 7, h: 6, style: 'house', wall: '#dfe7f0', roof: '#94523e', floors: 1 },
  { id: 'pickles', x: 9, y: 42, w: 7, h: 7, style: 'shop', sign: 'AMMA PICKLES', wall: '#fff1c1', roof: '#8f8f8f', awning: '#d64933', floors: 1 },
  { id: 'mural_wall', x: 21, y: 40, w: 9, h: 4, style: 'mural', wall: '#8a8f99', roof: '#6c7179' },
  { id: 'house_in5', x: 31, y: 40, w: 6, h: 4, style: 'house', wall: '#e3d2f0', roof: '#9a4f3b', floors: 1 },
  { id: 'apts_in2', x: 21, y: 48, w: 5, h: 8, style: 'apartment', wall: '#cfe0c3', roof: '#9aa0a6', floors: 3 },
  { id: 'metro_in', x: 27, y: 49, w: 10, h: 7, style: 'metro', sign: 'INDIRANAGAR METRO', wall: '#d7d4dd', roof: '#7a5aa6', floors: 2 },
  { id: 'house_in6', x: 9, y: 50, w: 7, h: 6, style: 'house', wall: '#f0e0b0', roof: '#a0553a', floors: 1 },
  // ── Tech park
  { id: 'techpark', x: 47, y: 1, w: 22, h: 11, style: 'office', sign: 'BYTEWHITE TECH PARK', wall: '#9cc3d9', roof: '#6f7b84', floors: 4 },
  { id: 'techpark_b', x: 72, y: 1, w: 13, h: 7, style: 'office', sign: 'BLOCK B', wall: '#a8d0c4', roof: '#6f7b84', floors: 3 },
  // ── Marathahalli
  { id: 'house_mh1', x: 95, y: 0, w: 7, h: 6, style: 'house', wall: '#d8e8f0', roof: '#a35a3f', floors: 1 },
  { id: 'mobile', x: 94, y: 8, w: 7, h: 8, style: 'shop', sign: 'MOBILE BAZAAR', wall: '#ffe066', roof: '#8c8c8c', awning: '#1d70b8', floors: 2 },
  { id: 'meals', x: 101, y: 8, w: 6, h: 8, style: 'shop', sign: 'ANDHRA MEALS', wall: '#ffd8a8', roof: '#8c8c8c', awning: '#2b8a3e', floors: 2 },
  { id: 'pg', x: 111, y: 2, w: 8, h: 14, style: 'apartment', sign: 'GENTS PG', wall: '#c9d6df', roof: '#8c9399', floors: 4 },
  { id: 'sweets', x: 120, y: 8, w: 8, h: 8, style: 'shop', sign: 'SWEETS & BAKES', wall: '#ffd1dc', roof: '#8c8c8c', awning: '#c2185b', floors: 2 },
  { id: 'mall', x: 94, y: 25, w: 13, h: 12, style: 'mall', sign: 'SWALPA MALL', wall: '#b9c8d6', roof: '#6c757d', floors: 3 },
  { id: 'apts_mh', x: 111, y: 24, w: 8, h: 12, style: 'apartment', sign: 'PRESTIGE-ISH', wall: '#e8d5b7', roof: '#9aa0a6', floors: 4 },
  { id: 'apts_mh2', x: 120, y: 25, w: 8, h: 10, style: 'apartment', wall: '#d0e1f9', roof: '#9aa0a6', floors: 3 },
  { id: 'hardware', x: 94, y: 44, w: 6, h: 8, style: 'shop', sign: 'HARDWARE', wall: '#e0e0e0', roof: '#8c8c8c', awning: '#f08c00', floors: 2 },
  { id: 'tailor', x: 102, y: 44, w: 6, h: 8, style: 'shop', sign: 'TAILOR', wall: '#e6fcf5', roof: '#8c8c8c', awning: '#7048e8', floors: 2 },
  { id: 'house_mh2', x: 111, y: 48, w: 7, h: 7, style: 'house', wall: '#fbe3c3', roof: '#a35a3f', floors: 1 },
  { id: 'house_mh3', x: 120, y: 48, w: 7, h: 7, style: 'house', wall: '#d3f9d8', roof: '#9c4d38', floors: 1 },
  // ── Food & chai lane
  { id: 'military', x: 1, y: 65, w: 9, h: 9, style: 'shop', sign: 'MILITARY HOTEL', wall: '#ffe8cc', roof: '#8c8c8c', awning: '#c92a2a', floors: 2 },
  { id: 'ragi', x: 11, y: 66, w: 7, h: 8, style: 'shop', sign: 'RAGI MUDDE', wall: '#f3d9b1', roof: '#8c8c8c', awning: '#5c940d', floors: 1 },
  { id: 'paan', x: 19, y: 69, w: 4, h: 5, style: 'kiosk', sign: 'PAAN', wall: '#69db7c', roof: '#c92a2a' },
  { id: 'house_fl1', x: 24, y: 65, w: 6, h: 9, style: 'house', wall: '#e5dbff', roof: '#a0553a', floors: 2 },
  { id: 'house_fl2', x: 31, y: 65, w: 6, h: 9, style: 'house', wall: '#fff3bf', roof: '#9c4d38', floors: 2 },
  { id: 'darshini', x: 47, y: 64, w: 12, h: 10, style: 'darshini', sign: 'SRI UDUPI DARSHINI', wall: '#fff4e0', roof: '#8a8d91', awning: '#e8590c', floors: 2 },
  { id: 'bakery', x: 61, y: 66, w: 8, h: 8, style: 'shop', sign: 'IYENGAR BAKERY', wall: '#ffe3e3', roof: '#8c8c8c', awning: '#d6336c', floors: 1 },
  { id: 'juice', x: 71, y: 67, w: 6, h: 7, style: 'kiosk', sign: 'JUICE JN.', wall: '#ffec99', roof: '#37b24d' },
  { id: 'mysorepak', x: 79, y: 66, w: 7, h: 8, style: 'shop', sign: 'MYSORE PAK', wall: '#fff0f6', roof: '#8c8c8c', awning: '#f59f00', floors: 1 },
  { id: 'house_fl3', x: 26, y: 79, w: 6, h: 6, style: 'house', wall: '#d0ebff', roof: '#a35a3f', floors: 1 },
  { id: 'house_fl4', x: 47, y: 85, w: 7, h: 8, style: 'house', wall: '#ffe066', roof: '#9c4d38', floors: 2 },
  { id: 'temple', x: 63, y: 84, w: 9, h: 10, style: 'temple', sign: 'GANESHA GUDI', wall: '#fff3bf', roof: '#e8590c' },
  { id: 'bennedose', x: 78, y: 87, w: 7, h: 7, style: 'shop', sign: 'BENNE DOSE', wall: '#fff9db', roof: '#7a7a7a', awning: '#fab005', floors: 1 },
  // ── Metro hub
  { id: 'metro_hub', x: 97, y: 64, w: 20, h: 8, style: 'metro', sign: 'CENTRAL METRO HUB', wall: '#dcd6e8', roof: '#7a5aa6', floors: 2 },
  { id: 'foodcourt', x: 118, y: 84, w: 9, h: 8, style: 'shop', sign: 'HUB FOOD COURT', wall: '#e9ecef', roof: '#868e96', awning: '#1098ad', floors: 1 },
];

export type PropKind =
  | 'tree'
  | 'treePink'
  | 'treeRed'
  | 'palm'
  | 'banyan'
  | 'lamp'
  | 'bench'
  | 'chaiCart'
  | 'table'
  | 'barrier'
  | 'cone'
  | 'busStop'
  | 'bin'
  | 'flowerCart'
  | 'coconutCart'
  | 'vegStall'
  | 'stumps'
  | 'pothole'
  | 'manhole'
  | 'bike'
  | 'hoarding'
  | 'bush'
  | 'counter'
  | 'autoSign'
  | 'katte';

export interface PropDef {
  kind: PropKind;
  x: number;
  y: number;
  /** Optional text for signs/hoardings. */
  text?: string;
}

/** Footprints (px) for solid props, anchored at the prop's base centre. */
export const PROP_SOLID: Partial<Record<PropKind, { w: number; h: number }>> = {
  tree: { w: 6, h: 5 },
  treePink: { w: 6, h: 5 },
  treeRed: { w: 6, h: 5 },
  palm: { w: 5, h: 4 },
  banyan: { w: 18, h: 10 },
  lamp: { w: 3, h: 3 },
  bench: { w: 16, h: 6 },
  chaiCart: { w: 24, h: 10 },
  table: { w: 12, h: 6 },
  barrier: { w: 16, h: 5 },
  cone: { w: 5, h: 4 },
  busStop: { w: 32, h: 8 },
  bin: { w: 6, h: 5 },
  flowerCart: { w: 22, h: 9 },
  coconutCart: { w: 22, h: 9 },
  vegStall: { w: 24, h: 10 },
  bike: { w: 14, h: 5 },
  hoarding: { w: 30, h: 4 },
  bush: { w: 12, h: 7 },
  counter: { w: 20, h: 6 },
  autoSign: { w: 3, h: 3 },
  katte: { w: 36, h: 18 },
};

const row = (kind: PropKind, y: number, xs: number[]): PropDef[] => xs.map((x) => ({ kind, x, y }));

export const PROPS: PropDef[] = [
  // Street trees and lamps along 100 Feet Road
  ...row('tree', 16.5, [9.5, 20.4]),
  ...row('treePink', 23.6, [5, 14, 25, 33]),
  ...row('lamp', 17.8, [8, 16, 28, 36]),
  ...row('lamp', 23.7, [10, 30]),
  ...row('treeRed', 16.5, [50, 62, 74, 82]),
  ...row('tree', 23.6, [50, 60, 70, 80]),
  ...row('tree', 16.5, [97, 115, 124]),
  ...row('treePink', 23.6, [113, 124]),
  ...row('lamp', 17.8, [100, 120]),
  // Outer Ring Road
  ...row('tree', 56.5, [3, 12, 22, 48, 58, 80, 114, 124]),
  ...row('treeRed', 63.6, [3, 22, 34, 50, 70, 82]),
  ...row('lamp', 57.8, [8, 18, 64, 74, 120]),
  // Vertical roads
  { kind: 'tree', x: 38.6, y: 30 },
  { kind: 'tree', x: 38.6, y: 46 },
  { kind: 'tree', x: 38.6, y: 70 },
  { kind: 'tree', x: 38.6, y: 88 },
  { kind: 'treePink', x: 45.4, y: 6 },
  { kind: 'tree', x: 45.4, y: 88 },
  { kind: 'tree', x: 86.6, y: 8 },
  { kind: 'treeRed', x: 86.6, y: 30 },
  { kind: 'tree', x: 86.6, y: 44 },
  { kind: 'tree', x: 92.4, y: 90 },
  { kind: 'lamp', x: 39.8, y: 52 },
  { kind: 'lamp', x: 44.2, y: 40 },
  { kind: 'lamp', x: 87.8, y: 50 },
  { kind: 'lamp', x: 92.2, y: 38 },
  // Indiranagar details
  { kind: 'chaiCart', x: 29, y: 15.2 },
  { kind: 'bike', x: 2.5, y: 17.2 },
  { kind: 'bike', x: 4, y: 17.2 },
  { kind: 'bin', x: 9.5, y: 15.6 },
  { kind: 'bush', x: 3, y: 7.8 },
  { kind: 'bush', x: 6, y: 7.8 },
  { kind: 'palm', x: 28.6, y: 7 },
  { kind: 'tree', x: 8.5, y: 2.5 },
  { kind: 'tree', x: 15, y: 1.5 },
  { kind: 'treePink', x: 29, y: 2 },
  { kind: 'tree', x: 35, y: 2.6 },
  { kind: 'tree', x: 20.6, y: 37 },
  { kind: 'bench', x: 24, y: 37.4 },
  { kind: 'tree', x: 9, y: 36.6 },
  { kind: 'treeRed', x: 3, y: 36.6 },
  { kind: 'bush', x: 3, y: 48.6 },
  { kind: 'bush', x: 6, y: 48.6 },
  { kind: 'tree', x: 17, y: 47 },
  { kind: 'treePink', x: 8.5, y: 55 },
  { kind: 'bin', x: 27, y: 46.6 },
  { kind: 'bike', x: 33, y: 46.4 },
  { kind: 'hoarding', x: 34, y: 37.8, text: 'SWALPA ADJUST MAADI' },
  // Tech park
  ...row('bench', 14.4, [49, 55, 61, 67]),
  { kind: 'chaiCart', x: 78, y: 12 },
  { kind: 'table', x: 74, y: 13.6 },
  { kind: 'table', x: 82, y: 13.6 },
  { kind: 'table', x: 78, y: 15.2 },
  { kind: 'palm', x: 70.6, y: 4 },
  { kind: 'palm', x: 70.6, y: 10 },
  { kind: 'bike', x: 58, y: 13.4 },
  { kind: 'bike', x: 60, y: 13.4 },
  // Kere Park
  ...row('tree', 26, [47, 57, 63, 74, 84]),
  ...row('treePink', 29.4, [49, 60, 70, 80]),
  ...row('tree', 36, [47, 49, 56, 82, 85]),
  ...row('treeRed', 54.6, [47, 56, 62, 70]),
  ...row('tree', 49, [48, 57, 85]),
  ...row('bench', 34.6, [60, 66, 72]),
  ...row('bench', 53.4, [65, 72]),
  { kind: 'bench', x: 80, y: 52.6 },
  { kind: 'bush', x: 77, y: 49.6 },
  { kind: 'bush', x: 83, y: 49.6 },
  { kind: 'tree', x: 85, y: 51.5 },
  { kind: 'tree', x: 76.6, y: 54.6 },
  { kind: 'lamp', x: 51.5, y: 40 },
  { kind: 'lamp', x: 55, y: 31.4 },
  { kind: 'lamp', x: 78, y: 31.4 },
  // Marathahalli
  { kind: 'vegStall', x: 113, y: 42.6 },
  { kind: 'vegStall', x: 118, y: 42.6 },
  { kind: 'vegStall', x: 123, y: 42.6 },
  { kind: 'flowerCart', x: 115, y: 45.8 },
  { kind: 'coconutCart', x: 121, y: 45.8 },
  { kind: 'bike', x: 96, y: 17.2 },
  { kind: 'bike', x: 97.5, y: 17.2 },
  { kind: 'bike', x: 104, y: 17.2 },
  { kind: 'bin', x: 107.5, y: 15.6 },
  { kind: 'hoarding', x: 100, y: 39.4, text: 'FLAT 70% OFF' },
  { kind: 'tree', x: 104, y: 4 },
  { kind: 'treeRed', x: 106.5, y: 2 },
  { kind: 'tree', x: 125, y: 3 },
  { kind: 'tree', x: 104.5, y: 54 },
  { kind: 'treePink', x: 106, y: 39 },
  // Permanent roadworks beside Marathahalli junction (alters the walking route)
  { kind: 'barrier', x: 95, y: 22.5 },
  { kind: 'barrier', x: 96, y: 22.5 },
  { kind: 'barrier', x: 97, y: 22.5 },
  { kind: 'barrier', x: 98, y: 22.5 },
  { kind: 'barrier', x: 99, y: 22.5 },
  ...row('barrier', 23.95, [95, 96, 97, 98, 99]),
  { kind: 'cone', x: 94.5, y: 21.4 },
  { kind: 'cone', x: 96.5, y: 21.4 },
  { kind: 'cone', x: 98.5, y: 21.4 },
  { kind: 'cone', x: 100.2, y: 21.4 },
  { kind: 'pothole', x: 70, y: 20.3 },
  { kind: 'pothole', x: 102, y: 19 },
  { kind: 'pothole', x: 89.5, y: 44 },
  { kind: 'pothole', x: 24, y: 60.6 },
  { kind: 'pothole', x: 41, y: 80 },
  { kind: 'manhole', x: 60, y: 19.5 },
  { kind: 'manhole', x: 89.5, y: 70 },
  { kind: 'manhole', x: 12, y: 59.5 },
  // Food lane
  { kind: 'counter', x: 53, y: 74.7 },
  { kind: 'chaiCart', x: 63, y: 78.4 },
  ...row('table', 80.4, [52, 56, 68, 72]),
  ...row('table', 82.4, [54, 70]),
  { kind: 'bin', x: 58.5, y: 77.4 },
  { kind: 'coconutCart', x: 33, y: 78.2 },
  { kind: 'flowerCart', x: 13, y: 78.2 },
  { kind: 'bike', x: 21, y: 77.6 },
  { kind: 'bike', x: 76, y: 77.6 },
  { kind: 'treeRed', x: 25, y: 77.6 },
  { kind: 'tree', x: 46.5, y: 78 },
  { kind: 'tree', x: 85, y: 80 },
  { kind: 'tree', x: 59, y: 88 },
  { kind: 'treePink', x: 73, y: 82.5 },
  { kind: 'tree', x: 85.5, y: 84 },
  { kind: 'tree', x: 49, y: 94 },
  { kind: 'tree', x: 1, y: 79 },
  { kind: 'tree', x: 1, y: 92 },
  { kind: 'treePink', x: 25, y: 94 },
  { kind: 'stumps', x: 12, y: 82 },
  { kind: 'stumps', x: 12, y: 91 },
  { kind: 'banyan', x: 33, y: 91 },
  { kind: 'katte', x: 33, y: 92.6 },
  { kind: 'bush', x: 36, y: 86.6 },
  { kind: 'bush', x: 29, y: 86.6 },
  { kind: 'lamp', x: 37.6, y: 73.9 },
  { kind: 'lamp', x: 46.4, y: 73.9 },
  // Metro hub
  { kind: 'busStop', x: 121, y: 74.4 },
  { kind: 'autoSign', x: 98, y: 79.5 },
  { kind: 'flowerCart', x: 96, y: 74.4 },
  { kind: 'coconutCart', x: 113, y: 76 },
  ...row('bench', 88.6, [99, 104, 109]),
  ...row('tree', 92.6, [97, 102, 107, 112]),
  ...row('treePink', 72.6, [118, 126]),
  { kind: 'palm', x: 94, y: 85 },
  { kind: 'palm', x: 116, y: 86 },
  { kind: 'bin', x: 116, y: 74.6 },
  { kind: 'lamp', x: 100, y: 77 },
  { kind: 'lamp', x: 112, y: 82 },
  { kind: 'hoarding', x: 123, y: 80.2, text: 'NAMMA CITY' },
];

/** Districts used for the area label, events and dialogue context. First match wins. */
export interface District {
  id: string;
  name: string;
  tagline: string;
  rects: Rect[];
}

export const DISTRICTS: District[] = [
  { id: 'indiranagar', name: 'Indiranagar', tagline: 'Cafes, sneakers and 100 Feet Road', rects: [{ x: 0, y: 0, w: 44, h: 58 }] },
  { id: 'techpark', name: 'ByteWhite Tech Park', tagline: 'Standups, sprints and smoke breaks', rects: [{ x: 44, y: 0, w: 44, h: 16 }] },
  {
    id: 'marathahalli',
    name: 'Marathahalli Junction',
    tagline: 'Where traffic goes to think about life',
    rects: [
      { x: 88, y: 0, w: 40, h: 58 },
      { x: 44, y: 16, w: 44, h: 8 },
    ],
  },
  { id: 'park', name: 'Kere Park', tagline: 'Lakeside walks and morning uncles', rects: [{ x: 44, y: 24, w: 44, h: 34 }] },
  { id: 'foodlane', name: 'Food & Chai Lane', tagline: 'Benne, bisi bisi and bun maska', rects: [{ x: 0, y: 58, w: 88, h: 38 }] },
  { id: 'metrohub', name: 'Central Metro Hub', tagline: 'Purple line, autos and flower sellers', rects: [{ x: 88, y: 58, w: 40, h: 38 }] },
];

export function districtAt(px: number, py: number): District {
  const tx = px / TILE;
  const ty = py / TILE;
  for (const d of DISTRICTS)
    for (const r of d.rects) if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return d;
  return DISTRICTS[0];
}

/** Zebra crossings, in tiles. `dir` is the direction pedestrians walk across. */
export interface Crossing {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: 'h' | 'v';
}

export const CROSSINGS: Crossing[] = (() => {
  const out: Crossing[] = [];
  const vRoads = [40, 88];
  const hRoads = [18, 58];
  for (const vx of vRoads)
    for (const hy of hRoads) {
      out.push({ x: vx, y: hy - 2, w: 4, h: 2, dir: 'h' });
      out.push({ x: vx, y: hy + 4, w: 4, h: 2, dir: 'h' });
      out.push({ x: vx - 2, y: hy, w: 2, h: 4, dir: 'v' });
      out.push({ x: vx + 4, y: hy, w: 2, h: 4, dir: 'v' });
    }
  // Mid-block crossings where the food lane meets the main roads
  out.push({ x: 40, y: 74, w: 4, h: 3, dir: 'h' });
  out.push({ x: 88, y: 74, w: 4, h: 3, dir: 'h' });
  return out;
})();

/** Every solid rectangle in world pixels: buildings, solid props and water. */
export function buildSolids(ground: Uint8Array = buildGround()): Rect[] {
  const solids: Rect[] = BUILDINGS.map((b) => ({ x: b.x * TILE, y: b.y * TILE, w: b.w * TILE, h: b.h * TILE }));
  for (const p of PROPS) {
    const f = PROP_SOLID[p.kind];
    if (f) solids.push({ x: p.x * TILE - f.w / 2, y: p.y * TILE - f.h, w: f.w, h: f.h });
  }
  for (const v of PARKED) {
    const { halfLen, halfWidth } = VEHICLE_SIZE[v.type];
    const horizontal = Math.abs(Math.cos(v.heading)) > 0.7;
    const hw = horizontal ? halfLen : halfWidth;
    const hh = horizontal ? halfWidth : halfLen;
    solids.push({ x: v.x * TILE - hw, y: v.y * TILE - hh, w: hw * 2, h: hh * 2 });
  }
  // Water, merged per row to keep the list short.
  for (let j = 0; j < MAP_H; j++) {
    let start = -1;
    for (let i = 0; i <= MAP_W; i++) {
      const w = i < MAP_W && ground[j * MAP_W + i] === G.Water;
      if (w && start < 0) start = i;
      if (!w && start >= 0) {
        solids.push({ x: start * TILE, y: j * TILE, w: (i - start) * TILE, h: TILE });
        start = -1;
      }
    }
  }
  return solids;
}

export const groundAt = (ground: Uint8Array, px: number, py: number) => {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return -1;
  return ground[ty * MAP_W + tx];
};
