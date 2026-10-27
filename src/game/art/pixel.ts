/** Low-level pixel painting helpers shared by all procedural art. */

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

export const px = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => rect(ctx, x, y, 1, 1, c);

/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  } else {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  }
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Deterministic 0..1 noise for a coordinate. */
export function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, c: string) {
  ctx.fillStyle = c;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) ctx.fillRect(x, y, 1, 1);
    }
}

export const OUTLINE = '#1c1726';

/** Draw a 1px outline around every opaque pixel inside the region. Gives all sprites one consistent look. */
export function outline(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, color = OUTLINE) {
  const img = ctx.getImageData(x0, y0, w, h);
  const d = img.data;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 140;
  const marks: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) marks.push(x, y);
    }
  ctx.fillStyle = color;
  for (let i = 0; i < marks.length; i += 2) ctx.fillRect(x0 + marks[i], y0 + marks[i + 1], 1, 1);
}

// ── 3x5 pixel font for shop signs
const GLYPH_ROWS: Record<string, string> = {
  A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.',
  E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#',
  I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
  M: '#.#|###|###|#.#|#.#', N: '##.|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..',
  Q: '.#.|#.#|#.#|##.|.##', R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.',
  U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#',
  Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###', '0': '###|#.#|#.#|#.#|###', '1': '.#.|##.|.#.|.#.|###',
  '2': '##.|..#|.#.|#..|###', '3': '##.|..#|.#.|..#|##.', '4': '#.#|#.#|###|..#|..#', '5': '###|#..|##.|..#|##.',
  '6': '.##|#..|###|#.#|###', '7': '###|..#|.#.|.#.|.#.', '8': '###|#.#|###|#.#|###', '9': '###|#.#|###|..#|##.',
  '&': '.#.|#.#|.#.|#.#|.##', '.': '...|...|...|...|.#.', '-': '...|...|###|...|...', "'": '.#.|.#.|...|...|...',
  '!': '.#.|.#.|.#.|...|.#.', '%': '#.#|..#|.#.|#..|#.#', '/': '..#|..#|.#.|#..|#..', ' ': '...|...|...|...|...',
};
const glyph = (ch: string) => (GLYPH_ROWS[ch] ?? GLYPH_ROWS[' ']).replace(/\|/g, '');

export const textWidth = (text: string, scale = 1) => (text.length * 4 - 1) * scale;

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale = 1) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = glyph(ch);
    for (let i = 0; i < 15; i++) if (g[i] === '#') ctx.fillRect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale);
    cx += 4 * scale;
  }
}
