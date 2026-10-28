import { drawText, ellipse, makeCanvas, outline, rect, shade, textWidth } from './pixel';

export const DOG_W = 18;
export const DOG_H = 13;
const DOG_COATS = [
  { body: '#a0673a', patch: '#e9d8b4' },
  { body: '#2b2523', patch: '#f1ede4' },
  { body: '#d9b77f', patch: '#f8f1e3' },
];

/** Street dog facing right, two trot frames side by side. */
export function paintDog(variant: number): HTMLCanvasElement {
  const coat = DOG_COATS[variant % DOG_COATS.length];
  const [c, ctx] = makeCanvas(DOG_W * 2, DOG_H);
  for (let f = 0; f < 2; f++) {
    const ox = f * DOG_W;
    const R = (x: number, y: number, w: number, h: number, col: string) => rect(ctx, ox + x, y, w, h, col);
    ellipse(ctx, ox + 9, 11.5, 6, 1.3, 'rgba(0,0,0,0.25)');
    // Legs (alternate per frame)
    const legs = f === 0 ? [4, 6, 11, 13] : [5, 7, 10, 12];
    for (const lx of legs) R(lx, 8, 1, 3, shade(coat.body, -0.2));
    // Body, chest patch, tail
    R(3, 5, 11, 4, coat.body);
    R(10, 6, 3, 3, coat.patch);
    R(1, f === 0 ? 3 : 4, 2, 2, coat.body);
    R(2, 5, 1, 1, coat.body);
    // Head with ear and snout
    R(12, 2, 5, 4, coat.body);
    R(16, 4, 2, 2, coat.patch);
    R(13, 1, 2, 2, shade(coat.body, -0.25));
    R(15, 3, 1, 1, '#1c1726');
    R(17, 4, 1, 1, '#1c1726');
    outline(ctx, ox, 0, DOG_W, DOG_H);
  }
  return c;
}

export const CROW_W = 10;
export const CROW_H = 9;

/** Crow facing right: frame 0 standing, frame 1 wings up. */
export function paintCrow(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(CROW_W * 2, CROW_H);
  for (let f = 0; f < 2; f++) {
    const ox = f * CROW_W;
    const R = (x: number, y: number, w: number, h: number, col: string) => rect(ctx, ox + x, y, w, h, col);
    R(2, 4, 5, 3, '#24252b');
    R(6, 2, 3, 3, '#24252b');
    R(6, 3, 1, 1, '#6c7380');
    R(9, 3, 1, 1, '#495057');
    R(7, 3, 1, 1, '#f1f3f5');
    R(0, 5, 2, 1, '#24252b');
    if (f === 0) R(3, 7, 1, 2, '#495057');
    else {
      R(2, 1, 4, 2, '#3a3d46');
      R(1, 0, 2, 1, '#3a3d46');
    }
    outline(ctx, ox, 0, CROW_W, CROW_H);
  }
  return c;
}

/** BBMP garbage van, facing right (rotated like traffic vehicles). */
export function paintGarbageVan(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(40, 20);
  const R = (x: number, y: number, w: number, h: number, col: string) => rect(ctx, x, y, w, h, col);
  ellipse(ctx, 20, 17, 18, 3, 'rgba(0,0,0,0.25)');
  R(2, 3, 26, 13, '#2f9e44');
  R(2, 3, 26, 2, '#51cf66');
  R(2, 10, 26, 1, '#f8f9fa');
  drawText(ctx, 'BBMP', 15 - textWidth('BBMP') / 2, 5, '#f8f9fa');
  R(28, 5, 9, 11, '#f8f9fa');
  R(33, 6, 3, 9, '#74c0fc');
  R(28, 5, 9, 1, '#dee2e6');
  for (const wx of [6, 20, 31]) {
    R(wx, 15, 4, 3, '#212529');
    R(wx, 2, 4, 2, '#212529');
  }
  R(2, 6, 2, 8, shade('#2f9e44', -0.25));
  outline(ctx, 0, 0, 40, 20);
  return c;
}

export const MONKEY_W = 14;
export const MONKEY_H = 14;

/** Bonnet macaque facing right: frame 0 sitting, frame 1 mid-hop. Long tail curled up behind. */
export function paintMonkey(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(MONKEY_W * 2, MONKEY_H);
  const fur = '#8a7560';
  const dark = shade(fur, -0.25);
  for (let f = 0; f < 2; f++) {
    const ox = f * MONKEY_W;
    const up = f === 1 ? 1 : 0;
    const R = (x: number, y: number, w: number, h: number, col: string) => rect(ctx, ox + x, y - up, w, h, col);
    ellipse(ctx, ox + 7, 12.5, 5, 1.2, 'rgba(0,0,0,0.25)');
    R(1, 4, 1, 5, dark); // tail
    R(1, 3, 2, 1, dark);
    R(3, 6, 6, 5, fur); // body
    R(4, 10, 2, 2, dark); // legs
    R(7, 10, 2, 2, dark);
    R(8, 2, 5, 5, fur); // head
    R(9, 1, 3, 1, dark); // bonnet tuft
    R(10, 4, 3, 3, '#e6a99a'); // face
    R(11, 4, 1, 1, '#1c1726');
    R(9, 7, 2, 3, fur); // arm
    outline(ctx, ox, 0, MONKEY_W, MONKEY_H);
  }
  return c;
}
