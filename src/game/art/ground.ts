import { BUILDINGS, CROSSINGS, G } from '../../data/map';
import { JUNCTIONS } from '../../data/roads';
import { MAP_H, MAP_W, TILE } from '../constants';
import { hash, makeCanvas, rect, shade } from './pixel';

const BASE: Record<number, string> = {
  [G.Pave]: '#b9b2a3',
  [G.Sidewalk]: '#a8a39a',
  [G.Road]: '#45474f',
  [G.Lane]: '#5a5b60',
  [G.Grass]: '#6aa84f',
  [G.Dirt]: '#b88a5a',
  [G.Water]: '#3b7dd8',
  [G.Plaza]: '#cfc8b8',
  [G.FoodLane]: '#b8644a',
  [G.Garden]: '#4f9a3e',
};

/** Minimap colours per ground kind. */
export const MINIMAP_COLOURS: Record<number, string> = {
  [G.Pave]: '#8f8a80',
  [G.Sidewalk]: '#a39e94',
  [G.Road]: '#3a3c43',
  [G.Lane]: '#55565c',
  [G.Grass]: '#4f8a3a',
  [G.Dirt]: '#9a7148',
  [G.Water]: '#2f6fc8',
  [G.Plaza]: '#b0a998',
  [G.FoodLane]: '#a65a43',
  [G.Garden]: '#3f7f31',
};

function paintTile(ctx: CanvasRenderingContext2D, kind: number, tx: number, ty: number, at: (x: number, y: number) => number) {
  const x0 = tx * TILE;
  const y0 = ty * TILE;
  const base = BASE[kind] ?? '#ff00ff';
  rect(ctx, x0, y0, TILE, TILE, base);
  const n = (x: number, y: number, s = 0) => hash(x0 + x, y0 + y, kind * 7 + s);
  switch (kind) {
    case G.Road:
    case G.Lane: {
      for (let i = 0; i < 18; i++) {
        const x = Math.floor(n(i, 1) * 16);
        const y = Math.floor(n(i, 2) * 16);
        rect(ctx, x0 + x, y0 + y, 1, 1, shade(base, n(i, 3) > 0.5 ? 0.08 : -0.12));
      }
      if (hash(tx, ty, 99) > 0.93) rect(ctx, x0 + 3, y0 + 4, 9, 6, shade(base, -0.1)); // repair patch
      if (kind === G.Lane && hash(tx, ty, 5) > 0.7) rect(ctx, x0 + Math.floor(n(0, 9) * 12), y0 + Math.floor(n(1, 9) * 12), 3, 2, '#6b6a66');
      break;
    }
    case G.Sidewalk: {
      // Interlocking pavers in two tones.
      for (let y = 0; y < 16; y += 4) {
        const off = (y / 4) % 2 ? 4 : 0;
        for (let x = -off; x < 16; x += 8) {
          const c = hash(tx * 4 + x, ty * 4 + y, 3) > 0.5 ? shade(base, 0.05) : shade(base, -0.04);
          const sx = Math.max(0, x);
          rect(ctx, x0 + sx, y0 + y, Math.min(16, x + 7) - sx, 3, c);
        }
      }
      break;
    }
    case G.Pave: {
      for (let i = 0; i < 10; i++) rect(ctx, x0 + Math.floor(n(i, 1) * 16), y0 + Math.floor(n(i, 2) * 16), 1, 1, shade(base, n(i, 3) > 0.5 ? 0.07 : -0.08));
      if (hash(tx, ty, 11) > 0.92) rect(ctx, x0 + 2, y0 + 8, 7, 1, shade(base, -0.15));
      break;
    }
    case G.Plaza: {
      rect(ctx, x0, y0 + 15, 16, 1, shade(base, -0.1));
      rect(ctx, x0 + 15, y0, 1, 16, shade(base, -0.1));
      rect(ctx, x0 + 7, y0, 1, 16, shade(base, -0.05));
      rect(ctx, x0, y0 + 7, 16, 1, shade(base, -0.05));
      if (hash(tx, ty, 2) > 0.8) rect(ctx, x0 + 1, y0 + 1, 6, 6, shade(base, 0.05));
      break;
    }
    case G.FoodLane: {
      for (let y = 0; y < 16; y += 4)
        for (let x = 0; x < 16; x += 4) {
          const c = hash(tx * 4 + x, ty * 4 + y, 8) > 0.5 ? shade(base, 0.08) : shade(base, -0.06);
          rect(ctx, x0 + x, y0 + y, 3, 3, c);
        }
      break;
    }
    case G.Grass:
    case G.Garden: {
      for (let i = 0; i < 22; i++) {
        const x = Math.floor(n(i, 1) * 16);
        const y = Math.floor(n(i, 2) * 16);
        rect(ctx, x0 + x, y0 + y, 1, 2, shade(base, n(i, 3) > 0.5 ? 0.14 : -0.14));
      }
      if (hash(tx, ty, 4) > (kind === G.Garden ? 0.6 : 0.88)) {
        const colours = ['#ffd43b', '#ff8787', '#f8f9fa', '#da77f2'];
        rect(ctx, x0 + Math.floor(n(0, 7) * 13), y0 + Math.floor(n(0, 8) * 13), 2, 2, colours[Math.floor(n(0, 6) * 4)]);
      }
      break;
    }
    case G.Dirt: {
      for (let i = 0; i < 14; i++) rect(ctx, x0 + Math.floor(n(i, 1) * 16), y0 + Math.floor(n(i, 2) * 16), 1, 1, shade(base, n(i, 3) > 0.5 ? 0.12 : -0.15));
      break;
    }
    case G.Water: {
      for (let i = 0; i < 4; i++) rect(ctx, x0 + Math.floor(n(i, 1) * 12), y0 + Math.floor(n(i, 2) * 15), 4, 1, shade(base, 0.25));
      // Shoreline highlight
      if (at(tx, ty - 1) !== G.Water) rect(ctx, x0, y0, 16, 2, '#7fb2f0');
      if (at(tx, ty + 1) !== G.Water) rect(ctx, x0, y0 + 14, 16, 2, shade(base, -0.25));
      break;
    }
  }
  // Kerbs where a footpath meets a road.
  if (kind === G.Sidewalk) {
    const isRoad = (k: number) => k === G.Road;
    const kerb = (x: number, y: number, w: number, h: number) => {
      rect(ctx, x, y, w, h, '#d9d4c7');
    };
    if (isRoad(at(tx, ty + 1))) kerb(x0, y0 + 14, 16, 2);
    if (isRoad(at(tx, ty - 1))) kerb(x0, y0, 16, 2);
    if (isRoad(at(tx + 1, ty))) kerb(x0 + 14, y0, 2, 16);
    if (isRoad(at(tx - 1, ty))) kerb(x0, y0, 2, 16);
  }
}

export function paintGround(ground: Uint8Array): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(MAP_W * TILE, MAP_H * TILE);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? -1 : ground[y * MAP_W + x]);
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) paintTile(ctx, ground[ty * MAP_W + tx], tx, ty, at);

  paintRoadMarkings(ctx);

  // Building shadows (light from the top-left).
  ctx.fillStyle = 'rgba(20, 16, 30, 0.22)';
  for (const b of BUILDINGS) {
    ctx.fillRect((b.x + b.w) * TILE, b.y * TILE + 6, 5, b.h * TILE);
    ctx.fillRect(b.x * TILE + 5, (b.y + b.h) * TILE, b.w * TILE, 3);
  }
  return c;
}

function paintRoadMarkings(ctx: CanvasRenderingContext2D) {
  const W = MAP_W * TILE;
  const H = MAP_H * TILE;
  const inJunction = (x: number, y: number) =>
    JUNCTIONS.some((j) => x >= j.x0 - j.crossing && x < j.x1 + j.crossing && y >= j.y0 - j.crossing && y < j.y1 + j.crossing);
  const inCrossing = (x: number, y: number) =>
    CROSSINGS.some((c) => x >= c.x * TILE && x < (c.x + c.w) * TILE && y >= c.y * TILE && y < (c.y + c.h) * TILE);

  // Centre dashes on the two-way main roads.
  for (const cy of [20 * TILE, 60 * TILE])
    for (let x = 0; x < W; x += 16) if (!inJunction(x + 4, cy) && !inCrossing(x + 4, cy)) rect(ctx, x + 2, cy - 1, 8, 2, '#f1f3f5');
  for (const cx of [42 * TILE, 90 * TILE])
    for (let y = 0; y < H; y += 16) if (!inJunction(cx, y + 4) && !inCrossing(cx, y + 4)) rect(ctx, cx - 1, y + 2, 2, 8, '#f1f3f5');

  // Edge lines (yellow) along the kerbs.
  for (const [y0, y1] of [
    [18, 22],
    [58, 62],
  ])
    for (let x = 0; x < W; x += 4)
      if (!inJunction(x, y0 * TILE + 2) && !inCrossing(x, y0 * TILE + 2)) {
        rect(ctx, x, y0 * TILE + 1, 3, 1, '#e3b505');
        rect(ctx, x, y1 * TILE - 2, 3, 1, '#e3b505');
      }

  // Zebra crossings.
  for (const c of CROSSINGS) {
    const x0 = c.x * TILE;
    const y0 = c.y * TILE;
    const w = c.w * TILE;
    const h = c.h * TILE;
    if (c.dir === 'h') {
      // Pedestrians walk east-west across a north-south road: bars run north-south.
      for (let x = x0 + 2; x < x0 + w - 2; x += 6) rect(ctx, x, y0 + 3, 3, h - 6, '#f1f3f5');
    } else {
      for (let y = y0 + 2; y < y0 + h - 2; y += 6) rect(ctx, x0 + 3, y, w - 6, 3, '#f1f3f5');
    }
  }

  // Stop lines on approach lanes (left-hand traffic).
  for (const j of JUNCTIONS) {
    const s = j.crossing;
    const midX = (j.x0 + j.x1) / 2;
    const midY = (j.y0 + j.y1) / 2;
    rect(ctx, j.x0 - s - 3, j.y0, 2, midY - j.y0, '#f8f9fa'); // eastbound (north half)
    rect(ctx, j.x1 + s + 1, midY, 2, j.y1 - midY, '#f8f9fa'); // westbound (south half)
    rect(ctx, midX, j.y0 - s - 3, j.x1 - midX, 2, '#f8f9fa'); // southbound (east half)
    rect(ctx, j.x0, j.y1 + s + 1, midX - j.x0, 2, '#f8f9fa'); // northbound (west half)
    // Black-and-yellow painted kerb corners, a Bengaluru classic.
    for (const [cx, cy] of [
      [j.x0 - s, j.y0 - s],
      [j.x1 + s - 2, j.y0 - s],
      [j.x0 - s, j.y1 + s - 2],
      [j.x1 + s - 2, j.y1 + s - 2],
    ])
      for (let i = 0; i < 4; i++) rect(ctx, cx, cy + (i - 2) * 4, 2, 4, i % 2 ? '#212529' : '#fcc419');
  }
}

export function paintMinimapBase(ground: Uint8Array): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(MAP_W, MAP_H);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) rect(ctx, x, y, 1, 1, MINIMAP_COLOURS[ground[y * MAP_W + x]] ?? '#000');
  for (const b of BUILDINGS) {
    rect(ctx, b.x, b.y, b.w, b.h, shade(b.roof, -0.15));
    rect(ctx, b.x, b.y, b.w, 1, shade(b.roof, 0.1));
  }
  return c;
}
