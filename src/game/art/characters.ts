import type { Look } from '../../data/looks';
import type { Facing } from '../../logic/movement';
import { ellipse, makeCanvas, outline, px, rect, shade } from './pixel';

export const CHAR_W = 16;
export const CHAR_H = 24;
export const CHAR_DIRS: Facing[] = ['down', 'left', 'right', 'up'];
export const CHAR_FRAMES = 3;

const EYE = '#1c1726';

/** Spritesheet: rows = down/left/right/up, columns = stand, step A, step B. */
export function paintCharacterSheet(look: Look): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(CHAR_W * CHAR_FRAMES, CHAR_H * CHAR_DIRS.length);
  CHAR_DIRS.forEach((dir, row) => {
    for (let f = 0; f < CHAR_FRAMES; f++) {
      const ox = f * CHAR_W;
      const oy = row * CHAR_H;
      if (dir === 'left') {
        // Paint facing right, then mirror into place.
        const [tmp, tctx] = makeCanvas(CHAR_W, CHAR_H);
        drawFrame(tctx, 0, 0, look, 'right', f);
        outline(tctx, 0, 0, CHAR_W, CHAR_H);
        ctx.save();
        ctx.translate(ox + CHAR_W, oy);
        ctx.scale(-1, 1);
        ctx.drawImage(tmp, 0, 0);
        ctx.restore();
      } else {
        drawFrame(ctx, ox, oy, look, dir, f);
        outline(ctx, ox, oy, CHAR_W, CHAR_H);
      }
      // Soft ground shadow (semi-transparent so it is never outlined).
      ellipse(ctx, ox + 8, oy + 22.5, 4.5, 1.4, 'rgba(0,0,0,0.28)');
    }
  });
  return c;
}

function drawFrame(ctx: CanvasRenderingContext2D, ox: number, oy: number, L: Look, dir: Facing, frame: number) {
  const k = L.small ? 4 : 0; // kids: shorter body, same head
  const R = (x: number, y: number, w: number, h: number, col: string) => rect(ctx, ox + x, oy + y, w, h, col);
  const P = (x: number, y: number, col: string) => px(ctx, ox + x, oy + y, col);
  const skinD = shade(L.skin, -0.18);
  const topD = shade(L.top, -0.22);
  const topL = shade(L.top, 0.18);
  const botD = shade(L.bottom, -0.22);
  const ex = new Set(L.extras ?? []);
  const step = frame === 0 ? 0 : frame === 1 ? 1 : -1;
  const headY = 2 + k;
  const bodyY = 9 + k;
  const legY = 16 + Math.floor(k / 2);
  const legH = 5 - Math.ceil(k / 2);
  const footY = legY + legH;
  const wrapped = L.bottomStyle === 'saree' || L.bottomStyle === 'lungi' || L.bottomStyle === 'veshti';

  if (dir === 'down' || dir === 'up') {
    const back = dir === 'up';
    // Legs / lower garment
    if (wrapped) {
      const len = L.bottomStyle === 'saree' ? footY - bodyY - 6 : footY - bodyY - 7;
      const top = L.bottomStyle === 'saree' ? bodyY + 6 : bodyY + 6;
      R(4, top, 8, len + 1, L.bottom);
      R(4, top, 1, len + 1, botD);
      if (L.accent && L.bottomStyle !== 'lungi') R(4, top + len, 8, 1, L.accent);
      if (L.bottomStyle === 'lungi') for (let y = top; y <= top + len; y += 2) for (let x = 4 + (y % 4 === 0 ? 0 : 1); x < 12; x += 2) P(x, y, L.accent ?? botD);
      R(5 + (step === 1 ? 0 : 0), footY, 2, 1, L.skin);
      R(9, footY, 2, 1, L.skin);
      P(5, footY, L.shoes);
      P(10, footY, L.shoes);
    } else {
      const lLift = step === 1 ? 1 : 0;
      const rLift = step === -1 ? 1 : 0;
      const legCol = L.bottomStyle === 'shorts' ? L.skin : L.bottom;
      R(5, legY, 3, legH - lLift, legCol);
      R(8, legY, 3, legH - rLift, legCol);
      R(7, legY + 1, 1, legH - 1 - Math.max(lLift, rLift), shade(legCol, -0.25));
      if (L.bottomStyle === 'shorts') {
        R(5, legY, 6, 2, L.bottom);
        R(5, legY, 1, 2, botD);
      }
      R(5, footY - lLift, 3, 1, L.shoes);
      R(8, footY - rLift, 3, 1, L.shoes);
    }
    // Torso
    const torsoH = L.topStyle === 'kurta' ? 9 : 7;
    if (L.topStyle === 'vest') {
      R(4, bodyY, 8, 7, L.skin);
      R(5, bodyY, 6, 7, L.top);
      R(5, bodyY + 6, 6, 1, shade(L.top, -0.12));
    } else {
      R(4, bodyY, 8, torsoH, L.top);
      R(4, bodyY, 1, torsoH, topD);
      R(11, bodyY, 1, torsoH, topD);
      R(5, bodyY, 6, 1, topL);
    }
    if (ex.has('checks')) for (let y = bodyY + 1; y < bodyY + torsoH; y += 2) for (let x = 5; x < 11; x += 2) P(x, y, topD);
    if (L.topStyle === 'tshirt' && !back) R(6, bodyY, 4, 1, L.skin);
    if (L.topStyle === 'shirt' && !back) {
      P(7, bodyY, topL);
      P(8, bodyY, topL);
      R(7, bodyY + 2, 1, 4, topD);
    }
    if (L.topStyle === 'jacket') R(7, bodyY + 1, 2, torsoH - 1, L.accent ?? topD);
    if (L.topStyle === 'uniform') {
      R(4, bodyY + 6, 8, 1, L.accent ?? '#3b2f1c');
      if (!back) {
        P(5, bodyY + 2, topD);
        P(10, bodyY + 2, topD);
      }
    }
    if (L.topStyle === 'saree' && L.accent) {
      // Pallu draped over the shoulder.
      for (let i = 0; i < 7; i++) P(back ? 5 + Math.floor(i / 2) : 10 - Math.floor(i / 2), bodyY + i, L.accent);
    }
    if (L.topStyle === 'kurta' && L.accent) R(4, bodyY + torsoH - 1, 8, 1, L.accent);
    // Arms
    const sleeve = L.topStyle === 'vest' ? L.skin : L.top;
    const sleeveLen = L.topStyle === 'tshirt' || L.topStyle === 'vest' ? 2 : L.topStyle === 'shirt' ? 3 : 5;
    const armY = (side: number) => (step === 0 ? 0 : side === step ? 1 : -1);
    for (const [ax, side] of [
      [3, 1],
      [12, -1],
    ] as const) {
      const ay = bodyY + Math.max(0, armY(side));
      R(ax, ay, 1, 5, L.skin);
      R(ax, ay, 1, Math.min(5, sleeveLen), shade(sleeve, -0.1));
      P(ax, ay + 5, skinD);
    }
    // Accessories on the body
    if (back) {
      if (ex.has('backpack')) {
        R(5, bodyY + 1, 6, 6, L.accent ?? '#3d4a5c');
        R(5, bodyY + 1, 6, 1, shade(L.accent ?? '#3d4a5c', 0.2));
        R(6, bodyY + 4, 4, 1, shade(L.accent ?? '#3d4a5c', -0.3));
      }
    } else {
      if (ex.has('backpack')) {
        R(5, bodyY, 1, 4, shade(L.accent ?? '#3d4a5c', -0.1));
        R(10, bodyY, 1, 4, shade(L.accent ?? '#3d4a5c', -0.1));
      }
      if (ex.has('lanyard')) {
        P(6, bodyY + 1, '#d62828');
        P(9, bodyY + 1, '#d62828');
        R(7, bodyY + 2, 2, 1, '#d62828');
        R(7, bodyY + 3, 2, 2, '#f8f9fa');
      }
      if (ex.has('apron')) R(5, bodyY + 2, 6, torsoH - 1 + 2, '#f1f3f5');
      if (ex.has('towel')) {
        R(10, bodyY - 1, 2, 4, '#f8f9fa');
        P(10, bodyY + 1, '#e03131');
      }
    }
    if (ex.has('laptop') && !back) {
      // Open laptop held at the waist: we see the back of the lid, with a glowing logo.
      R(4, bodyY + 3, 8, 5, '#adb5bd');
      R(4, bodyY + 3, 8, 1, '#dee2e6');
      P(7, bodyY + 5, '#e7f5ff');
      P(8, bodyY + 5, '#e7f5ff');
      R(3, bodyY + 7, 10, 1, '#868e96');
    }
    if (ex.has('bag')) {
      for (let i = 0; i < 5; i++) P(back ? 10 - i : 5 + i, bodyY + i, L.accent ?? '#5c3d2e');
      R(back ? 4 : 10, bodyY + 5, 2, 2, L.accent ?? '#5c3d2e');
    }
    // Head
    R(4, headY, 8, 7, L.skin);
    R(4, headY + 6, 8, 1, skinD);
    paintHairFrontBack(ctx, ox, oy, L, headY, back);
    if (!back) {
      P(6, headY + 3, EYE);
      P(9, headY + 3, EYE);
      if (ex.has('glasses')) {
        R(5, headY + 3, 6, 1, '#222');
        P(6, headY + 3, '#9ad1ff');
        P(9, headY + 3, '#9ad1ff');
      }
      if (ex.has('mustache')) R(6, headY + 5, 4, 1, '#2a1d14');
      else P(7, headY + 5, shade(L.skin, -0.35));
      if (ex.has('bindi')) P(7, headY + 2, '#d00000');
    }
  } else {
    // Profile, facing right.
    const lead = step === 1;
    const trail = step === -1;
    if (wrapped) {
      R(5, bodyY + 6, 6, footY - bodyY - 6, L.bottom);
      R(5, bodyY + 6, 1, footY - bodyY - 6, botD);
      if (L.accent && L.bottomStyle !== 'lungi') R(5, footY - 1, 6, 1, L.accent);
      R(lead ? 9 : 7, footY, 3, 1, L.shoes);
    } else {
      const legCol = L.bottomStyle === 'shorts' ? L.skin : L.bottom;
      if (step === 0) {
        R(6, legY, 4, legH, legCol);
        R(6, footY, 5, 1, L.shoes);
      } else {
        // Stride: one leg forward, one back.
        R(lead ? 8 : 5, legY, 3, legH, legCol);
        R(lead ? 5 : 8, legY, 3, legH - 1, shade(legCol, -0.2));
        R(lead ? 8 : 5, footY, 4, 1, L.shoes);
        R(lead ? 4 : 8, footY - 1, 3, 1, shade(L.shoes, -0.2));
      }
      if (L.bottomStyle === 'shorts') R(6, legY, 4, 2, L.bottom);
    }
    const torsoH = L.topStyle === 'kurta' ? 9 : 7;
    R(5, bodyY, 6, torsoH, L.topStyle === 'vest' ? L.top : L.top);
    R(5, bodyY, 1, torsoH, topD);
    R(6, bodyY, 4, 1, topL);
    if (L.topStyle === 'saree' && L.accent) R(5, bodyY, 1, torsoH, L.accent);
    if (L.topStyle === 'uniform') R(5, bodyY + 6, 6, 1, L.accent ?? '#3b2f1c');
    if (ex.has('backpack')) {
      R(3, bodyY, 3, 6, L.accent ?? '#3d4a5c');
      R(3, bodyY, 3, 1, shade(L.accent ?? '#3d4a5c', 0.2));
    }
    if (ex.has('apron')) R(9, bodyY + 2, 2, torsoH, '#f1f3f5');
    // Swinging arm
    const sleeve = L.topStyle === 'vest' ? L.skin : L.top;
    const ax = lead ? 9 : trail ? 6 : 7;
    R(ax, bodyY + 1, 2, 4, shade(sleeve, -0.12));
    R(ax, bodyY + 5, 2, 1, L.skin);
    if (lead) P(ax + 2, bodyY + 4, L.skin);
    if (ex.has('towel')) R(6, bodyY - 1, 3, 2, '#f8f9fa');
    if (ex.has('laptop')) {
      R(10, bodyY + 3, 2, 5, '#adb5bd');
      R(9, bodyY + 7, 4, 1, '#868e96');
      P(10, bodyY + 4, '#74c0fc');
    }
    // Head
    R(5, headY, 6, 7, L.skin);
    P(11, headY + 3, L.skin);
    R(5, headY + 6, 6, 1, skinD);
    paintHairSide(ctx, ox, oy, L, headY);
    P(9, headY + 3, EYE);
    if (ex.has('glasses')) R(8, headY + 3, 3, 1, '#222');
    if (ex.has('mustache')) R(9, headY + 5, 2, 1, '#2a1d14');
    if (ex.has('bindi')) P(10, headY + 2, '#d00000');
  }
}

function paintHairFrontBack(ctx: CanvasRenderingContext2D, ox: number, oy: number, L: Look, hy: number, back: boolean) {
  const R = (x: number, y: number, w: number, h: number, col: string) => rect(ctx, ox + x, oy + y, w, h, col);
  const P = (x: number, y: number, col: string) => px(ctx, ox + x, oy + y, col);
  const hair = L.hair;
  const hl = shade(hair, 0.25);
  const acc = L.accent ?? '#555';
  switch (L.hairStyle) {
    case 'bald':
      R(4, hy + 1, 1, 3, hair);
      R(11, hy + 1, 1, 3, hair);
      if (back) R(4, hy + 3, 8, 3, hair);
      P(6, hy, shade(L.skin, 0.3));
      return;
    case 'cap':
      R(4, hy - 1, 8, 3, acc);
      R(5, hy - 1, 6, 1, shade(acc, 0.25));
      if (!back) R(3, hy + 2, 10, 1, shade(acc, -0.3));
      else R(4, hy + 2, 8, 3, hair);
      return;
    case 'helmet':
      R(3, hy - 1, 10, 6, acc);
      R(4, hy - 1, 7, 1, shade(acc, 0.3));
      if (!back) R(4, hy + 2, 8, 2, '#2b2d42');
      return;
    case 'whitecap':
      R(4, hy - 2, 8, 4, '#f8f9fa');
      R(4, hy + 1, 8, 1, '#dee2e6');
      if (back) R(4, hy + 2, 8, 3, hair);
      return;
    case 'beanie':
      R(4, hy - 1, 8, 3, acc);
      R(4, hy + 1, 8, 1, shade(acc, -0.25));
      if (back) R(4, hy + 2, 8, 3, hair);
      return;
  }
  R(4, hy, 8, 2, hair);
  R(4, hy + 2, 1, 2, hair);
  R(11, hy + 2, 1, 2, hair);
  P(6, hy, hl);
  P(7, hy, hl);
  if (back) R(4, hy, 8, 6, hair);
  if (L.hairStyle === 'messy') {
    P(5, hy - 1, hair);
    P(8, hy - 1, hair);
    P(10, hy - 1, hair);
  }
  if (L.hairStyle === 'long') {
    R(3, hy + 2, 1, 7, hair);
    R(12, hy + 2, 1, 7, hair);
    if (back) R(4, hy + 6, 8, 5, hair);
  }
  if (L.hairStyle === 'ponytail' && back) R(7, hy + 6, 2, 5, hair);
  if (L.hairStyle === 'bun') {
    R(6, hy - 2, 4, 2, hair);
    if (back) R(6, hy + 4, 4, 3, shade(hair, 0.1));
  }
  if (L.extras?.includes('jasmine')) {
    P(back ? 6 : 10, hy - 1, '#ffffff');
    P(back ? 9 : 11, hy, '#ffffff');
    if (back) R(6, hy + 7, 4, 1, '#ffffff');
  }
  if (L.extras?.includes('headband')) R(4, hy + 1, 8, 1, L.top);
}

function paintHairSide(ctx: CanvasRenderingContext2D, ox: number, oy: number, L: Look, hy: number) {
  const R = (x: number, y: number, w: number, h: number, col: string) => rect(ctx, ox + x, oy + y, w, h, col);
  const P = (x: number, y: number, col: string) => px(ctx, ox + x, oy + y, col);
  const hair = L.hair;
  const acc = L.accent ?? '#555';
  switch (L.hairStyle) {
    case 'bald':
      R(5, hy + 2, 2, 3, hair);
      return;
    case 'cap':
      R(5, hy - 1, 6, 3, acc);
      R(10, hy + 1, 3, 1, shade(acc, -0.3));
      R(5, hy + 2, 2, 2, hair);
      return;
    case 'helmet':
      R(4, hy - 1, 8, 6, acc);
      R(9, hy + 2, 3, 2, '#2b2d42');
      return;
    case 'whitecap':
      R(5, hy - 2, 6, 4, '#f8f9fa');
      R(5, hy + 2, 2, 2, hair);
      return;
    case 'beanie':
      R(5, hy - 1, 6, 3, acc);
      R(5, hy + 2, 2, 2, hair);
      return;
  }
  R(5, hy, 6, 2, hair);
  R(5, hy + 2, 3, 3, hair);
  if (L.hairStyle === 'messy') {
    P(6, hy - 1, hair);
    P(9, hy - 1, hair);
  }
  if (L.hairStyle === 'long') R(4, hy + 2, 3, 8, hair);
  if (L.hairStyle === 'ponytail') R(3, hy + 2, 2, 5, hair);
  if (L.hairStyle === 'bun') R(3, hy, 3, 3, hair);
  if (L.extras?.includes('jasmine')) {
    P(3, hy + 3, '#ffffff');
    P(4, hy + 3, '#ffffff');
  }
  if (L.extras?.includes('headband')) R(5, hy + 1, 6, 1, L.top);
}
