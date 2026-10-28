import type { BuildingDef } from '../../data/map';
import { TILE } from '../constants';
import { drawText, ellipse, hash, makeCanvas, outline, OUTLINE, px, rect, shade, textWidth } from './pixel';

type Ctx = CanvasRenderingContext2D;

/** 3/4-view building: flat terrace (or tiled roof) on top, facade with shopfront below. */
export function paintBuilding(b: BuildingDef): HTMLCanvasElement {
  if (b.style === 'stadium') return paintStadium(b);
  if (b.style === 'vidhana') return paintVidhana(b);
  if (b.style === 'pandal') return paintPandal(b);
  if (b.style === 'glasshouse') return paintGlassHouse(b);
  const W = b.w * TILE;
  const H = b.h * TILE;
  const [c, ctx] = makeCanvas(W, H);
  const floors = b.floors ?? 1;
  const seed = [...b.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const facadeByStyle: Record<BuildingDef['style'], number> = {
    house: floors * 14 + 8,
    shop: floors * 14 + 10,
    cafe: floors * 14 + 10,
    pub: floors * 14 + 10,
    darshini: floors * 14 + 14,
    apartment: floors * 13 + 10,
    office: floors * 13 + 12,
    mall: 52,
    metro: 46,
    temple: 40,
    mural: H - 6,
    kiosk: 26,
    heritage: floors * 16 + 14,
    stadium: 30,
    construction: floors * 14 + 8,
    // Painted by their own functions below; these heights are unused.
    vidhana: 0,
    pandal: 0,
    glasshouse: 0,
  };
  const facadeH = Math.min(facadeByStyle[b.style], H - 12);
  const roofH = H - facadeH;

  paintRoof(ctx, b, W, roofH, seed);
  paintFacade(ctx, b, 0, roofH, W, facadeH, seed);

  // Outline and roof edge highlight
  rect(ctx, 0, roofH, W, 1, shade(b.roof, 0.35));
  rect(ctx, 0, 0, W, 1, OUTLINE);
  rect(ctx, 0, H - 1, W, 1, OUTLINE);
  rect(ctx, 0, 0, 1, H, OUTLINE);
  rect(ctx, W - 1, 0, 1, H, OUTLINE);
  return c;
}

function noise(ctx: Ctx, x: number, y: number, w: number, h: number, base: string, seed: number, density = 0.06) {
  const n = Math.floor(w * h * density);
  for (let i = 0; i < n; i++) {
    const nx = x + Math.floor(hash(i, 1, seed) * w);
    const ny = y + Math.floor(hash(i, 2, seed) * h);
    px(ctx, nx, ny, shade(base, hash(i, 3, seed) > 0.5 ? 0.08 : -0.1));
  }
}

function waterTank(ctx: Ctx, cx: number, cy: number) {
  ellipse(ctx, cx + 1, cy + 2, 5, 4, 'rgba(0,0,0,0.3)');
  ellipse(ctx, cx, cy, 5, 4.5, '#24262b');
  ellipse(ctx, cx - 1, cy - 1, 2.5, 2, '#3b3f47');
  rect(ctx, cx - 1, cy - 1, 2, 1, '#5a5f6a');
}

function paintRoof(ctx: Ctx, b: BuildingDef, W: number, h: number, seed: number) {
  const roof = b.roof;
  if (b.style === 'house') {
    // Mangalore tiles: rows of terracotta with a ridge.
    rect(ctx, 0, 0, W, h, roof);
    for (let y = 2; y < h; y += 3) {
      rect(ctx, 0, y, W, 1, shade(roof, -0.2));
      for (let x = (y % 2) * 3; x < W; x += 6) px(ctx, x, y - 1, shade(roof, 0.15));
    }
    rect(ctx, 0, Math.floor(h / 2), W, 1, shade(roof, -0.35));
    rect(ctx, 0, Math.floor(h / 2) - 1, W, 1, shade(roof, 0.2));
    if (W > 80 && hash(seed, 1) > 0.4) waterTank(ctx, W - 12, 7);
    return;
  }
  if (b.style === 'kiosk') {
    rect(ctx, 0, 0, W, h, roof);
    for (let x = 0; x < W; x += 4) rect(ctx, x, 0, 2, h, shade(roof, 0.18));
    rect(ctx, 0, h - 2, W, 2, shade(roof, -0.3));
    return;
  }
  if (b.style === 'mural') {
    for (let x = 0; x < W; x += 8) {
      rect(ctx, x, 0, 7, 2, '#9b8f84');
      rect(ctx, x + 4, 3, 7, 2, '#8d8176');
    }
    rect(ctx, 0, h - 1, W, 1, '#6c6259');
    return;
  }
  if (b.style === 'construction') {
    // Unfinished top slab: formwork planks with rebar sticking up.
    rect(ctx, 0, 0, W, h, '#8a7a62');
    for (let y = 1; y < h; y += 3) rect(ctx, 0, y, W, 1, '#6f6150');
    for (let x = 3; x < W - 2; x += 6) for (let y = 2; y < h - 1; y += 5) rect(ctx, x, y, 1, 2, '#3d3d3d');
    return;
  }
  if (b.style === 'heritage') {
    // Sloped colonial roof with corner turrets.
    rect(ctx, 0, 0, W, h, roof);
    for (let y = 2; y < h; y += 3) rect(ctx, 0, y, W, 1, shade(roof, -0.18));
    rect(ctx, 0, Math.floor(h / 2), W, 1, shade(roof, 0.25));
    for (const tx of [3, W - 13]) {
      rect(ctx, tx, 1, 10, h - 2, shade(b.wall, -0.1));
      rect(ctx, tx + 2, 0, 6, 3, shade(roof, -0.3));
      rect(ctx, tx + 4, -1, 2, 2, '#fab005');
    }
    return;
  }
  if (b.style === 'temple') {
    rect(ctx, 0, 0, W, h, '#f4ecd8');
    noise(ctx, 0, 0, W, h, '#f4ecd8', seed);
    // Gopuram: stepped, colourful tiers rising toward the viewer.
    const tiers = ['#e8590c', '#f59f00', '#d6336c', '#37b24d', '#1c7ed6'];
    const cx = Math.floor(W / 2);
    for (let i = 0; i < tiers.length; i++) {
      const tw = 44 - i * 8;
      const ty = h - 8 - i * 9;
      rect(ctx, cx - tw / 2, ty, tw, 9, tiers[i]);
      rect(ctx, cx - tw / 2, ty, tw, 1, shade(tiers[i], 0.3));
      for (let x = cx - tw / 2 + 2; x < cx + tw / 2 - 2; x += 4) px(ctx, x, ty + 4, '#fff3bf');
    }
    rect(ctx, cx - 2, h - 8 - tiers.length * 9 - 4, 4, 5, '#fab005');
    px(ctx, cx, h - 8 - tiers.length * 9 - 6, '#fab005');
    return;
  }
  // Flat terrace
  rect(ctx, 0, 0, W, h, roof);
  noise(ctx, 0, 0, W, h, roof, seed, 0.08);
  const par = shade(roof, 0.22);
  rect(ctx, 0, 0, W, 2, par);
  rect(ctx, 0, 0, 2, h, par);
  rect(ctx, W - 2, 0, 2, h, par);
  rect(ctx, 2, 2, W - 4, 1, shade(roof, -0.2));
  if (b.style === 'metro') {
    for (let x = 4; x < W - 4; x += 6) rect(ctx, x, 3, 3, h - 4, shade(roof, 0.12));
    rect(ctx, Math.floor(W / 2) - 6, Math.floor(h / 2) - 4, 12, 8, '#f8f9fa');
    drawText(ctx, 'M', Math.floor(W / 2) - 1, Math.floor(h / 2) - 2, '#7048e8');
    return;
  }
  if (b.style === 'mall' || b.style === 'office') {
    // Skylight / solar panels
    const pw = Math.min(W - 24, b.style === 'mall' ? 80 : 60);
    const ph = Math.min(h - 12, 24);
    const sx = 8;
    const sy = Math.max(5, Math.floor((h - ph) / 2));
    rect(ctx, sx, sy, pw, ph, '#2a4f7a');
    for (let x = sx; x < sx + pw; x += 6) rect(ctx, x, sy, 1, ph, '#5b8bc4');
    for (let y = sy; y < sy + ph; y += 5) rect(ctx, sx, y, pw, 1, '#5b8bc4');
    for (let i = 0; i < 3; i++) {
      const ax = W - 20 - i * 14;
      if (ax < sx + pw + 4) break;
      rect(ctx, ax, sy + 2, 10, 7, '#ced4da');
      rect(ctx, ax + 2, sy + 4, 6, 3, '#868e96');
    }
    return;
  }
  // Residential/commercial terrace clutter: Sintex tanks, clothes lines, a dish.
  const tanks = b.style === 'apartment' ? 2 : 1;
  for (let i = 0; i < tanks; i++) waterTank(ctx, W - 10 - i * 14, 8 + (i % 2) * 2);
  if (h > 24 && (b.style === 'apartment' || hash(seed, 7) > 0.5)) {
    const ly = Math.floor(h / 2) + 2;
    rect(ctx, 6, ly, Math.min(W - 40, 40), 1, '#5c5f66');
    const clothes = ['#e03131', '#f8f9fa', '#1971c2', '#fab005', '#7048e8'];
    for (let x = 8; x < Math.min(W - 40, 40); x += 5) rect(ctx, 6 + x - 2, ly + 1, 3, 3, clothes[Math.floor(hash(x, seed) * 5)]);
  }
  if (hash(seed, 3) > 0.5) {
    ellipse(ctx, 10, 9, 3, 3, '#e9ecef');
    px(ctx, 10, 9, '#868e96');
  }
}

function signScale(text: string, width: number, big: boolean) {
  return big && textWidth(text, 2) <= width - 12 ? 2 : 1;
}

function sign(ctx: Ctx, text: string, x: number, y: number, w: number, bg: string, fg: string, big = false) {
  const s = signScale(text, w, big);
  const tw = textWidth(text, s);
  const bw = Math.min(w, tw + 8);
  const bh = 5 * s + 4;
  const bx = x + Math.floor((w - bw) / 2);
  rect(ctx, bx, y, bw, bh, bg);
  rect(ctx, bx, y + bh - 1, bw, 1, shade(bg, -0.3));
  drawText(ctx, text, bx + Math.floor((bw - tw) / 2), y + 2, fg, s);
  return bh;
}

function window(ctx: Ctx, x: number, y: number, w: number, h: number, lit: boolean, frame = '#f1f3f5') {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, frame);
  rect(ctx, x, y, w, h, lit ? '#ffe8a3' : '#4a6a8a');
  rect(ctx, x, y, w, 1, lit ? '#fff3bf' : '#7aa0c4');
  if (w >= 6) rect(ctx, x + Math.floor(w / 2), y, 1, h, frame);
  rect(ctx, x - 1, y + h + 1, w + 2, 1, shade(frame, -0.3));
}

function paintFacade(ctx: Ctx, b: BuildingDef, x: number, y: number, W: number, H: number, seed: number) {
  const wall = b.wall;
  rect(ctx, x, y, W, H, wall);
  noise(ctx, x, y, W, H, wall, seed + 5, 0.03);
  rect(ctx, x + W - 3, y, 3, H, shade(wall, -0.12));
  rect(ctx, x, y + H - 2, W, 2, shade(wall, -0.3));
  const floors = b.floors ?? 1;

  switch (b.style) {
    case 'mural':
      return paintMural(ctx, x, y, W, H, seed);
    case 'construction': {
      // Concrete frame with open floors, bamboo scaffolding and a green safety net.
      rect(ctx, 0, y, W, H, '#2b2d33');
      for (let f = 0; f <= floors; f++) rect(ctx, 0, y + Math.min(H - 3, f * 14), W, 3, '#a5a5a0');
      for (let cx = 0; cx < W; cx += 18) rect(ctx, cx, y, 4, H, '#9a9a96');
      rect(ctx, 0, y, Math.floor(W * 0.4), H, 'rgba(47,158,68,0.75)');
      for (let gx = 0; gx < W * 0.4; gx += 3) rect(ctx, gx, y, 1, H, 'rgba(25,90,40,0.5)');
      for (let sx = 2; sx < W; sx += 9) rect(ctx, sx, y, 1, H, '#c9a26b');
      for (let sy = y + 6; sy < y + H; sy += 7) rect(ctx, 0, sy, W, 1, '#c9a26b');
      if (b.sign) sign(ctx, b.sign, x, y + H - 12, W, '#fab005', '#1c1726');
      return;
    }
    case 'heritage': {
      // Red facade, white-trimmed arched windows, a central porch with steps.
      for (let f = 0; f < floors; f++)
        for (let wx = 6; wx < W - 10; wx += 14) {
          const wy = y + 4 + f * 16;
          rect(ctx, wx - 1, wy - 1, 8, 11, '#f8f9fa');
          rect(ctx, wx, wy + 1, 6, 8, '#3d2b2b');
          rect(ctx, wx + 1, wy, 4, 1, '#3d2b2b');
          rect(ctx, wx + 3, wy + 1, 1, 8, '#f8f9fa');
        }
      const pw = 30;
      const px0 = Math.floor((W - pw) / 2);
      rect(ctx, px0, y + H - 22, pw, 20, '#f1e3c6');
      for (let cx = px0 + 2; cx < px0 + pw; cx += 7) rect(ctx, cx, y + H - 20, 3, 16, '#ffffff');
      rect(ctx, px0 + 11, y + H - 14, 8, 12, '#3d2b2b');
      rect(ctx, px0 - 3, y + H - 3, pw + 6, 2, '#ced4da');
      if (b.sign) sign(ctx, b.sign, x, y + H - 32, W, '#f8f9fa', '#7a2e22');
      return;
    }
    case 'temple': {
      for (let sx = 2; sx < W - 2; sx += 6) rect(ctx, sx, y + 2, 3, H - 6, '#c92a2a');
      rect(ctx, 0, y, W, 2, '#f08c00');
      const dw = 14;
      const dx = Math.floor(W / 2 - dw / 2);
      rect(ctx, dx - 2, y + 8, dw + 4, H - 10, '#f4ecd8');
      rect(ctx, dx, y + 12, dw, H - 14, '#4a2511');
      rect(ctx, dx + 1, y + 13, dw - 2, 2, '#fab005');
      px(ctx, dx + dw / 2, y + 17, '#fab005');
      rect(ctx, dx - 6, y + H - 6, 4, 4, '#fab005');
      if (b.sign) sign(ctx, b.sign, x, y + 2, W, '#f59f00', '#7f1d1d');
      return;
    }
    case 'metro': {
      rect(ctx, 0, y, W, 12, '#7048e8');
      rect(ctx, 0, y + 11, W, 1, '#5f3dc4');
      if (b.sign) {
        const s = signScale(b.sign, W, true);
        drawText(ctx, b.sign, Math.floor((W - textWidth(b.sign, s)) / 2), y + 3, '#f8f9fa', s === 2 && textWidth(b.sign, 2) < W - 20 ? 1 : 1);
      }
      for (let sx = 4; sx < W - 4; sx += 20) rect(ctx, sx, y + 12, 4, H - 14, shade(wall, -0.08));
      const ew = Math.min(48, W - 24);
      const ex = Math.floor((W - ew) / 2);
      rect(ctx, ex, y + 18, ew, H - 20, '#2b2d42');
      for (let sy = y + 22; sy < y + H - 2; sy += 3) rect(ctx, ex + 2, sy, ew - 4, 1, '#495057');
      rect(ctx, ex, y + 16, ew, 2, '#f8f9fa');
      drawText(ctx, 'METRO', ex + Math.floor((ew - textWidth('METRO')) / 2), y + 20, '#ffd43b');
      return;
    }
    case 'mall':
    case 'office': {
      const top = b.style === 'mall' ? 14 : 2;
      for (let gy = y + top; gy < y + H - 14; gy += 9)
        for (let gx = 4; gx < W - 6; gx += 8) {
          rect(ctx, gx, gy, 7, 7, '#3d6d99');
          rect(ctx, gx, gy, 7, 1, '#8fbce6');
          if (hash(gx, gy, seed) > 0.7) rect(ctx, gx + 1, gy + 2, 2, 4, '#a9d3f5');
        }
      if (b.sign) sign(ctx, b.sign, x, y + (b.style === 'mall' ? 2 : H - 26), W, b.style === 'mall' ? '#e8590c' : (b.awning ?? '#1c1726'), b.trim ?? '#f8f9fa', true);
      const dw = 22;
      const dx = Math.floor((W - dw) / 2);
      rect(ctx, dx, y + H - 13, dw, 11, '#1b2a3a');
      rect(ctx, dx + dw / 2, y + H - 13, 1, 11, '#8fbce6');
      rect(ctx, dx - 2, y + H - 15, dw + 4, 2, '#dee2e6');
      return;
    }
  }

  // Upper floors: windows (and balconies on apartments)
  const gfH = b.style === 'darshini' ? 26 : b.style === 'kiosk' ? H - 2 : b.style === 'house' ? H - 2 : 22;
  const upperTop = y + 2;
  const upperBottom = y + H - gfH;
  for (let f = 0; f < floors - 1; f++) {
    const fy = upperTop + f * 13 + 2;
    if (fy + 8 > upperBottom) break;
    for (let wx = 5; wx < W - 9; wx += 14) {
      window(ctx, wx, fy, 7, 6, hash(wx, fy, seed) > 0.75);
      if (b.style === 'apartment') {
        rect(ctx, wx - 2, fy + 8, 11, 1, '#495057');
        for (let r = wx - 2; r < wx + 9; r += 2) px(ctx, r, fy + 7, '#495057');
        if (hash(wx, fy, seed + 1) > 0.6) px(ctx, wx + 8, fy + 6, '#40c057');
      }
    }
  }

  const gy = y + H - gfH;
  switch (b.style) {
    case 'house': {
      const top = y + Math.max(2, H - 22);
      rect(ctx, 0, top - 2, W, 2, shade(wall, -0.2)); // sunshade ledge
      const dx = Math.floor(W / 2) - 4;
      rect(ctx, dx, top + 3, 9, H - (top - y) - 5, '#7a4a2a');
      rect(ctx, dx + 1, top + 4, 7, 1, '#a0663a');
      px(ctx, dx + 7, top + 10, '#fab005');
      for (const wx of [6, W - 16])
        if (wx > 2 && wx + 9 < dx || wx > dx + 10) {
          rect(ctx, wx, top + 4, 9, 8, '#4a6a8a');
          for (let gx = wx; gx < wx + 9; gx += 2) rect(ctx, gx, top + 4, 1, 8, '#2b2d42');
          rect(ctx, wx - 1, top + 12, 11, 1, shade(wall, -0.25));
        }
      // Rangoli at the doorstep
      rect(ctx, dx - 1, y + H - 3, 11, 1, '#f8f9fa');
      px(ctx, dx + 4, y + H - 3, '#e64980');
      if (b.sign) sign(ctx, b.sign, x, top - 10, W, '#f8f9fa', '#343a40');
      return;
    }
    case 'kiosk': {
      rect(ctx, 3, y + 8, W - 6, H - 12, '#2b2d42');
      const goods = b.sign === 'PAAN' ? ['#40c057', '#2f9e44', '#f8f9fa'] : ['#fd7e14', '#fab005', '#e03131', '#40c057'];
      for (let gx = 5; gx < W - 5; gx += 3) rect(ctx, gx, y + 12 + ((gx / 3) % 2), 2, 3, goods[(gx / 3) % goods.length]);
      rect(ctx, 2, y + H - 8, W - 4, 4, shade(wall, -0.15));
      if (b.sign) sign(ctx, b.sign, x, y + 1, W, '#f8f9fa', '#c92a2a');
      return;
    }
    case 'apartment': {
      const dx = Math.floor(W / 2) - 7;
      rect(ctx, dx, gy + 6, 14, gfH - 8, '#343a40');
      for (let gx = dx + 1; gx < dx + 14; gx += 2) rect(ctx, gx, gy + 6, 1, gfH - 8, '#868e96');
      for (const wx of [5, W - 14]) window(ctx, wx, gy + 8, 7, 6, false);
      if (b.sign) sign(ctx, b.sign, x, gy, W, '#f8f9fa', '#343a40');
      return;
    }
  }

  // Shops, cafes, pubs, darshinis: signboard, awning, open front.
  const awning = b.awning ?? '#e8590c';
  const signBg = b.style === 'pub' ? '#2b1d14' : b.style === 'darshini' ? '#e8590c' : awning;
  const signFg = b.style === 'pub' ? '#fab005' : '#f8f9fa';
  let cursor = gy;
  if (b.sign) cursor += sign(ctx, b.sign, x, gy, W, signBg, signFg, b.style === 'darshini') + 1;
  if (b.style === 'cafe' || b.style === 'shop') {
    // Striped awning with scalloped edge
    for (let ax = 1; ax < W - 1; ax++) {
      const col = Math.floor(ax / 4) % 2 ? awning : '#f8f9fa';
      rect(ctx, ax, cursor, 1, 4, col);
      if (ax % 4 !== 3) px(ctx, ax, cursor + 4, shade(col, -0.15));
    }
    cursor += 6;
  }
  const bottom = y + H - 2;
  const openH = bottom - cursor;
  if (openH <= 2) return;
  if (b.style === 'pub') {
    for (let lx = 2; lx < W - 2; lx += 3) px(ctx, lx, cursor + (lx % 2), lx % 6 === 2 ? '#ffd43b' : '#ff922b');
    for (const wx of [4, W - 22]) {
      rect(ctx, wx, cursor + 3, 18, openH - 4, '#ffb347');
      rect(ctx, wx, cursor + 3, 18, 1, '#ffe8a3');
      rect(ctx, wx + 9, cursor + 3, 1, openH - 4, '#5c3d2e');
    }
    rect(ctx, Math.floor(W / 2) - 5, cursor + 2, 10, openH - 2, '#3b2414');
    return;
  }
  if (b.style === 'darshini') {
    rect(ctx, 2, cursor, W - 4, openH, '#3b2d24');
    // Steel counter and menu board inside
    rect(ctx, 6, bottom - 6, W - 12, 4, '#ced4da');
    rect(ctx, 6, bottom - 6, W - 12, 1, '#f8f9fa');
    for (let tx = 10; tx < W - 12; tx += 6) rect(ctx, tx, bottom - 9, 2, 3, '#adb5bd');
    rect(ctx, W - 40, cursor + 2, 30, 9, '#2b8a3e');
    for (let ly = cursor + 4; ly < cursor + 10; ly += 2) rect(ctx, W - 37, ly, 18 + (ly % 4) * 2, 1, '#f8f9fa');
    rect(ctx, 10, cursor + 2, 16, 6, '#f8f9fa');
    drawText(ctx, 'VEG', 12, cursor + 3, '#2b8a3e');
    return;
  }
  // Generic shopfront: glass display + open door
  rect(ctx, 3, cursor, W - 6, openH, b.style === 'cafe' ? '#ffd8a8' : '#4a6a8a');
  rect(ctx, 3, cursor, W - 6, 1, '#f8f9fa');
  for (let gx = 3; gx < W - 6; gx += 12) rect(ctx, gx, cursor, 1, openH, shade(wall, -0.3));
  if (b.style === 'cafe') {
    for (let gx = 6; gx < W - 8; gx += 8) {
      rect(ctx, gx, bottom - 5, 4, 2, '#7a4a2a');
      px(ctx, gx + 1, bottom - 7, '#495057');
    }
  } else {
    for (let gx = 6; gx < W - 8; gx += 3) rect(ctx, gx, cursor + 3 + (gx % 2), 2, 2, ['#e03131', '#fab005', '#1971c2', '#40c057', '#f8f9fa'][gx % 5]);
  }
  const dw = 9;
  const dx = Math.floor(W / 2) - 4;
  rect(ctx, dx, cursor + 1, dw, openH - 1, '#2b2d42');
  rect(ctx, dx + 1, cursor + 2, dw - 2, 1, '#495057');
}

function paintMural(ctx: Ctx, x: number, y: number, W: number, H: number, seed: number) {
  rect(ctx, x, y, W, H, '#6c7a89');
  const colours = ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0'];
  for (let i = 0; i < 28; i++) {
    const cx = hash(i, 1, seed) * W;
    const cy = y + hash(i, 2, seed) * H;
    ellipse(ctx, cx, cy, 3 + hash(i, 3, seed) * 9, 2 + hash(i, 4, seed) * 6, colours[i % colours.length]);
  }
  // A jasmine auto-rickshaw: the mural's centrepiece.
  const ax = Math.floor(W / 2) - 20;
  const ay = y + 14;
  rect(ctx, ax, ay, 30, 20, '#f8f9fa');
  rect(ctx, ax + 30, ay + 6, 10, 14, '#ffd43b');
  for (let i = 0; i < 16; i++) px(ctx, ax + Math.floor(hash(i, 9, seed) * 30), ay + Math.floor(hash(i, 8, seed) * 20), '#dee2e6');
  ellipse(ctx, ax + 6, ay + 22, 4, 4, '#212529');
  ellipse(ctx, ax + 34, ay + 22, 4, 4, '#212529');
  drawText(ctx, 'NAMMA', ax - 26, y + 4, '#f8f9fa', 2);
  drawText(ctx, 'OORU', ax + 46, y + H - 16, '#ffbe0b', 2);
}

/** Top-down cricket ground: red-and-gold stands around a striped outfield, floodlights, a gate facade. */
function paintStadium(b: BuildingDef): HTMLCanvasElement {
  const W = b.w * TILE;
  const H = b.h * TILE;
  const [c, ctx] = makeCanvas(W, H);
  const cx = W / 2;
  const cy = (H - 30) / 2 + 2;
  const rx = W / 2 - 2;
  const ry = (H - 30) / 2;
  ellipse(ctx, cx, cy, rx, ry, '#868e96');
  const seats = ['#d6202a', '#ffd43b', '#d6202a', '#1c1726', '#d6202a'];
  seats.forEach((col, i) => ellipse(ctx, cx, cy, rx - 4 - i * 5, ry - 4 - i * 4, col));
  const fx = rx - 32;
  const fy = ry - 26;
  for (let i = 0; i < 6; i++) ellipse(ctx, cx, cy, fx - i * (fx / 7), fy - i * (fy / 7), i % 2 ? '#40c057' : '#2f9e44');
  rect(ctx, cx - 4, cy - 16, 8, 32, '#e9d8a6');
  rect(ctx, cx - 4, cy - 14, 8, 1, '#f8f9fa');
  rect(ctx, cx - 4, cy + 13, 8, 1, '#f8f9fa');
  for (const [lx, ly] of [
    [10, 8],
    [W - 14, 8],
    [10, H - 44],
    [W - 14, H - 44],
  ]) {
    rect(ctx, lx + 1, ly + 4, 2, 10, '#495057');
    rect(ctx, lx - 2, ly, 8, 5, '#343a40');
    rect(ctx, lx - 1, ly + 1, 6, 3, '#fff3bf');
  }
  // Gate facade along the bottom.
  const gy = H - 30;
  rect(ctx, 0, gy, W, 30, b.wall);
  rect(ctx, 0, gy, W, 2, shade(b.wall, 0.2));
  for (let gx = 8; gx < W - 16; gx += 26) {
    rect(ctx, gx, gy + 12, 14, 16, '#343a40');
    rect(ctx, gx, gy + 12, 14, 2, '#d6202a');
  }
  if (b.sign) sign(ctx, b.sign, 0, gy + 3, W, '#d6202a', '#ffd43b');
  rect(ctx, 0, 0, W, 1, OUTLINE);
  rect(ctx, 0, H - 1, W, 1, OUTLINE);
  return c;
}

/** Vidhana Soudha: granite colonnade, a big central dome with four smaller ones, broad steps. */
function paintVidhana(b: BuildingDef): HTMLCanvasElement {
  const W = b.w * TILE;
  const H = b.h * TILE;
  const [c, ctx] = makeCanvas(W, H);
  const stone = b.wall;
  const roofH = Math.floor(H * 0.38);
  // Roof terrace with domes
  rect(ctx, 0, 0, W, roofH, b.roof);
  noise(ctx, 0, 0, W, roofH, b.roof, 7, 0.05);
  const dome = (cx: number, cy: number, r: number) => {
    ellipse(ctx, cx, cy + 2, r, r * 0.7, 'rgba(0,0,0,0.2)');
    ellipse(ctx, cx, cy, r, r * 0.75, '#f1ece0');
    ellipse(ctx, cx - r * 0.3, cy - r * 0.25, r * 0.35, r * 0.25, '#ffffff');
    rect(ctx, cx - 1, cy - r * 0.75 - 4, 2, 5, '#c9a227');
  };
  dome(W / 2, roofH * 0.55, 30);
  for (const dx of [40, W - 40]) dome(dx, roofH * 0.55, 12);
  // Facade: stone, a band carrying the inscription, columns and windows, the central portico
  const fy = roofH;
  const fh = H - roofH;
  rect(ctx, 0, fy, W, fh, stone);
  noise(ctx, 0, fy, W, fh, stone, 11, 0.03);
  rect(ctx, 0, fy, W, 10, shade(stone, -0.08));
  const motto = "GOVERNMENT WORK IS GOD'S WORK";
  drawText(ctx, motto, Math.floor((W - textWidth(motto)) / 2), fy + 3, '#5c4a2e');
  for (let wx = 8; wx < W - 8; wx += 14) {
    rect(ctx, wx, fy + 14, 5, fh - 34, shade(stone, 0.06));
    rect(ctx, wx + 5, fy + 14, 1, fh - 34, shade(stone, -0.18));
    rect(ctx, wx + 8, fy + 18, 4, 7, '#3d3a33');
    rect(ctx, wx + 8, fy + 32, 4, 7, '#3d3a33');
  }
  // Portico and steps
  const pw = 120;
  const px0 = Math.floor((W - pw) / 2);
  rect(ctx, px0, fy + 10, pw, fh - 30, shade(stone, 0.04));
  for (let cx = px0 + 6; cx < px0 + pw - 4; cx += 12) rect(ctx, cx, fy + 14, 5, fh - 38, '#fbf8f1');
  if (b.sign) sign(ctx, b.sign, px0, fy + fh - 34, pw, '#5c4a2e', '#fff3bf');
  for (let i = 0; i < 4; i++) rect(ctx, px0 - 10 - i * 6, fy + fh - 20 + i * 4, pw + 20 + i * 12, 4, shade('#d8d2c4', -i * 0.04));
  rect(ctx, 0, H - 1, W, 1, OUTLINE);
  rect(ctx, 0, 0, W, 1, OUTLINE);
  rect(ctx, 0, 0, 1, H, OUTLINE);
  rect(ctx, W - 1, 0, 1, H, OUTLINE);
  return c;
}

/** Ganesha pandal: a striped festival canopy, marigold garlands, coloured lights and the idol. */
function paintPandal(b: BuildingDef): HTMLCanvasElement {
  const W = b.w * TILE;
  const H = b.h * TILE;
  const [c, ctx] = makeCanvas(W, H);
  const roofH = 44;
  for (let x = 0; x < W; x += 12) rect(ctx, x, 0, 6, roofH, b.roof);
  for (let x = 6; x < W; x += 12) rect(ctx, x, 0, 6, roofH, b.wall);
  // Scalloped canopy edge and marigold garlands
  for (let x = 0; x < W; x += 8) ellipse(ctx, x + 4, roofH, 4, 3, b.roof);
  for (let x = 2; x < W; x += 5) px(ctx, x, roofH + 4 + (x % 10 < 5 ? 1 : 0), '#f08c00');
  // Open front: a deep backdrop, the idol, lights on the frame
  const fy = roofH + 6;
  rect(ctx, 0, fy, W, H - fy, '#5f1e46');
  for (let x = 4; x < W; x += 10) rect(ctx, x, fy + 2, 2, 2, ['#ffd43b', '#ff6b6b', '#69db7c', '#74c0fc'][(x / 10) % 4 | 0]);
  const cx = W / 2;
  const base = H - 8;
  rect(ctx, cx - 30, base - 8, 60, 8, '#c92a2a');
  ellipse(ctx, cx, base - 26, 18, 18, '#f59f00');
  ellipse(ctx, cx, base - 48, 13, 12, '#f59f00');
  rect(ctx, cx - 3, base - 44, 6, 18, '#e67700');
  ellipse(ctx, cx - 14, base - 50, 7, 9, '#f59f00');
  ellipse(ctx, cx + 14, base - 50, 7, 9, '#f59f00');
  rect(ctx, cx - 8, base - 64, 16, 7, '#fab005');
  px(ctx, cx - 5, base - 50, '#1c1726');
  px(ctx, cx + 4, base - 50, '#1c1726');
  ellipse(ctx, cx, base - 22, 8, 5, '#fff3bf');
  if (b.sign) sign(ctx, b.sign, 0, 4, W, '#c92a2a', '#fff3bf');
  rect(ctx, 0, 0, W, 1, OUTLINE);
  rect(ctx, 0, H - 1, W, 1, OUTLINE);
  return c;
}

/** Lalbagh Glass House: white iron frame, arched glass roof, pale blue panes. */
function paintGlassHouse(b: BuildingDef): HTMLCanvasElement {
  const W = b.w * TILE;
  const H = b.h * TILE;
  const [c, ctx] = makeCanvas(W, H);
  const roofH = Math.floor(H * 0.5);
  rect(ctx, 0, 0, W, roofH, b.roof);
  for (let x = 0; x < W; x += 8) rect(ctx, x, 0, 1, roofH, '#f8f9fa');
  for (let y = 4; y < roofH; y += 8) rect(ctx, 0, y, W, 1, 'rgba(255,255,255,0.7)');
  ellipse(ctx, W / 2, roofH / 2, W * 0.18, roofH * 0.35, '#e7f5ff');
  rect(ctx, 0, roofH, W, H - roofH, b.wall);
  for (let x = 0; x < W; x += 10) rect(ctx, x, roofH, 1, H - roofH, '#f8f9fa');
  for (let y = roofH + 8; y < H; y += 10) rect(ctx, 0, y, W, 1, '#f8f9fa');
  const dw = 24;
  rect(ctx, (W - dw) / 2, H - 22, dw, 22, '#a5d8ff');
  rect(ctx, (W - dw) / 2, H - 24, dw, 2, '#f8f9fa');
  if (b.sign) sign(ctx, b.sign, 0, roofH + 4, W, '#2b8a3e', '#ffffff');
  outline(ctx, 0, 0, W, H);
  return c;
}
