import type { PropKind } from '../../data/map';
import { drawText, ellipse, hash, makeCanvas, outline, px, rect, shade, textWidth } from './pixel';

type Ctx = CanvasRenderingContext2D;

/** Props are anchored at bottom-centre of their canvas. Decals render flat on the ground. */
export const DECAL_PROPS = new Set<PropKind>(['pothole', 'manhole']);
/** Props whose texture depends on their text, so each text gets its own texture. */
export const TEXT_PROPS = new Set<PropKind>(['hoarding', 'roadSign', 'lakeSign']);
export const propKey = (p: { kind: PropKind; text?: string }) => (TEXT_PROPS.has(p.kind) ? `prop_${p.kind}_${p.text}` : `prop_${p.kind}`);

export function paintProp(kind: PropKind, text?: string): HTMLCanvasElement {
  switch (kind) {
    case 'tree':
      return tree('#3f8f3a', null);
    case 'treePink':
      return tree('#d6619b', '#f3a6c8');
    case 'treeRed':
      return tree('#3f8f3a', '#ff5f2e');
    case 'palm':
      return palm();
    case 'banyan':
      return banyan();
    case 'lamp':
      return draw(10, 32, (c) => {
        rect(c, 4, 6, 2, 25, '#5c636e');
        rect(c, 4, 6, 1, 25, '#7d8590');
        rect(c, 4, 4, 6, 2, '#5c636e');
        rect(c, 7, 6, 3, 2, '#fff3bf');
        rect(c, 3, 29, 4, 2, '#495057');
      });
    case 'bench':
      return draw(20, 12, (c) => {
        rect(c, 2, 2, 16, 3, '#8b5a2b');
        rect(c, 2, 6, 16, 3, '#a0663a');
        rect(c, 2, 6, 16, 1, '#c08552');
        rect(c, 3, 9, 1, 2, '#343a40');
        rect(c, 16, 9, 1, 2, '#343a40');
      });
    case 'chaiCart':
      return chaiCart();
    case 'table':
      return draw(16, 14, (c) => {
        ellipse(c, 8, 6, 6, 3, '#e03131');
        ellipse(c, 8, 5.5, 5, 2, '#ff6b6b');
        rect(c, 7, 8, 2, 3, '#c92a2a');
        rect(c, 1, 9, 3, 3, '#f8f9fa');
        rect(c, 12, 9, 3, 3, '#f8f9fa');
        px(c, 7, 4, '#ced4da');
        px(c, 10, 5, '#ced4da');
      });
    case 'barrier':
      return draw(18, 12, (c) => {
        for (let x = 1; x < 17; x++) rect(c, x, 2, 1, 5, Math.floor(x / 3) % 2 ? '#f8f9fa' : '#f76707');
        rect(c, 2, 7, 2, 4, '#495057');
        rect(c, 14, 7, 2, 4, '#495057');
      });
    case 'cone':
      return draw(8, 11, (c) => {
        rect(c, 3, 1, 2, 2, '#f76707');
        rect(c, 2, 3, 4, 2, '#f8f9fa');
        rect(c, 2, 5, 4, 3, '#f76707');
        rect(c, 1, 8, 6, 2, '#e8590c');
      });
    case 'busStop':
      return draw(36, 26, (c) => {
        rect(c, 2, 2, 32, 7, '#2b8a3e');
        rect(c, 2, 2, 32, 1, '#51cf66');
        rect(c, 3, 9, 1, 15, '#495057');
        rect(c, 32, 9, 1, 15, '#495057');
        rect(c, 4, 10, 28, 8, 'rgba(165,216,255,0.55)');
        rect(c, 6, 19, 24, 3, '#868e96');
        rect(c, 6, 22, 1, 2, '#495057');
        rect(c, 29, 22, 1, 2, '#495057');
        drawText(c, 'BUS', 13, 3, '#f8f9fa');
      });
    case 'bin':
      return draw(8, 10, (c) => {
        rect(c, 1, 2, 6, 7, '#2b8a3e');
        rect(c, 1, 2, 6, 1, '#51cf66');
        rect(c, 2, 4, 1, 4, '#237032');
      });
    case 'flowerCart':
      return cart(['#f8f9fa', '#ffa94d', '#ff6b6b', '#f8f9fa', '#ffd43b'], '#8b5a2b');
    case 'coconutCart':
      return cart(['#5c940d', '#74b816', '#66a80f'], '#6b4226', true);
    case 'vegStall':
      return draw(28, 18, (c) => {
        rect(c, 1, 1, 26, 6, '#1c7ed6');
        for (let x = 1; x < 27; x += 4) rect(c, x, 1, 2, 6, '#339af0');
        rect(c, 2, 7, 1, 9, '#5c3d2e');
        rect(c, 25, 7, 1, 9, '#5c3d2e');
        rect(c, 2, 11, 24, 5, '#a0663a');
        const veg = ['#e03131', '#40c057', '#862e9c', '#fd7e14', '#e03131'];
        for (let x = 4; x < 25; x += 2) rect(c, x, 9 + (x % 3 === 0 ? 1 : 0), 2, 2, veg[(x / 2) % veg.length]);
      });
    case 'stumps':
      return draw(10, 10, (c) => {
        for (const x of [2, 4, 6]) rect(c, x, 1, 1, 8, '#e9d8a6');
        rect(c, 2, 1, 5, 1, '#c2a878');
      });
    case 'pothole':
      return draw(14, 8, (c) => {
        ellipse(c, 7, 4, 6, 3, '#2a2a2e');
        ellipse(c, 6, 3.5, 4, 2, '#1a1a1d');
        px(c, 9, 5, '#5a5b60');
      }, false);
    case 'manhole':
      return draw(12, 12, (c) => {
        ellipse(c, 6, 6, 5, 5, '#6c6f78');
        ellipse(c, 6, 6, 4, 4, '#4a4d55');
        for (let i = 3; i < 10; i += 2) rect(c, 3, i, 7, 1, '#5d606a');
      }, false);
    case 'bike':
      return draw(18, 11, (c) => {
        ellipse(c, 4, 7, 3, 3, '#212529');
        ellipse(c, 14, 7, 3, 3, '#212529');
        rect(c, 4, 4, 10, 3, ['#c92a2a', '#1971c2', '#212529'][Math.floor(hash(1, 2) * 3)]);
        rect(c, 6, 3, 5, 1, '#343a40');
        rect(c, 13, 2, 1, 3, '#868e96');
      });
    case 'hoarding':
      return draw(48, 36, (c) => {
        rect(c, 10, 23, 2, 12, '#495057');
        rect(c, 36, 23, 2, 12, '#495057');
        rect(c, 1, 1, 46, 23, '#fab005');
        rect(c, 2, 2, 44, 21, '#212529');
        // Word-wrap onto up to three lines of the 3x5 sign font.
        const lines: string[] = [];
        for (const word of (text ?? 'NAMMA OORU').split(' ')) {
          const last = lines[lines.length - 1];
          if (last && textWidth(`${last} ${word}`) <= 40) lines[lines.length - 1] = `${last} ${word}`;
          else lines.push(word);
        }
        const shown = lines.slice(0, 3);
        const top = Math.floor(12 - (shown.length * 6 - 1) / 2) + 1;
        shown.forEach((l, i) => drawText(c, l, Math.floor(24 - textWidth(l) / 2), top + i * 6, i === 0 ? '#fab005' : '#f8f9fa'));
      });
    case 'roadSign': {
      // Green municipal street sign on a single post.
      const label = text ?? 'MAIN ROAD';
      const w = Math.max(24, textWidth(label) + 8);
      return draw(w, 22, (c) => {
        rect(c, Math.floor(w / 2) - 1, 10, 2, 12, '#868e96');
        rect(c, 0, 0, w, 11, '#f8f9fa');
        rect(c, 1, 1, w - 2, 9, '#1b7f3b');
        drawText(c, label, Math.floor((w - textWidth(label)) / 2), 3, '#ffffff');
      });
    }
    case 'lakeSign': {
      // Wooden lake board on two posts.
      const label = text ?? 'KERE';
      const w = textWidth(label) + 12;
      return draw(w, 22, (c) => {
        rect(c, 4, 10, 2, 12, '#5c3a1e');
        rect(c, w - 6, 10, 2, 12, '#5c3a1e');
        rect(c, 0, 0, w, 13, '#5c3a1e');
        rect(c, 1, 1, w - 2, 11, '#8d5a2b');
        rect(c, 1, 1, w - 2, 1, '#a9713d');
        drawText(c, label, Math.floor((w - textWidth(label)) / 2), 4, '#fff3bf');
      });
    }
    case 'bush':
      return draw(16, 12, (c) => {
        ellipse(c, 8, 6, 7, 5, '#2f7d32');
        ellipse(c, 6, 5, 4, 3, '#43a047');
        px(c, 10, 4, '#ff8787');
        px(c, 5, 7, '#ff8787');
      });
    case 'counter':
      return draw(24, 12, (c) => {
        rect(c, 1, 3, 22, 7, '#ced4da');
        rect(c, 1, 3, 22, 1, '#f8f9fa');
        rect(c, 1, 9, 22, 1, '#868e96');
        for (let x = 3; x < 21; x += 4) {
          rect(c, x, 1, 2, 3, '#adb5bd');
          px(c, x, 1, '#f1f3f5');
        }
        ellipse(c, 18, 5, 2.5, 1.2, '#f8f9fa');
      });
    case 'autoSign':
      return draw(22, 22, (c) => {
        rect(c, 10, 8, 2, 13, '#495057');
        rect(c, 1, 1, 20, 8, '#fcc419');
        drawText(c, 'AUTO', 4, 3, '#212529');
      });
    case 'sandPile':
      return draw(22, 12, (c) => {
        ellipse(c, 11, 8, 10, 4, '#c9a26b');
        ellipse(c, 10, 6, 7, 3, '#d9b77f');
        ellipse(c, 9, 5, 3, 1.5, '#e9cf9f');
      });
    case 'bricks':
      return draw(16, 10, (c) => {
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 3; col++) {
            rect(c, 1 + col * 5 - (row % 2) * 2 + 2, 2 + row * 3, 4, 2, '#b4543a');
            rect(c, 1 + col * 5 - (row % 2) * 2 + 2, 2 + row * 3, 4, 1, '#cf6f53');
          }
      });
    case 'boulder':
      return draw(24, 16, (c) => {
        ellipse(c, 12, 13, 11, 3, 'rgba(0,0,0,0.22)');
        ellipse(c, 12, 9, 10, 6.5, '#8f877c');
        ellipse(c, 10, 7, 7, 4.5, '#a8a094');
        ellipse(c, 8, 5, 3, 1.6, '#c4bdb1');
        rect(c, 14, 9, 5, 1, '#6f685f');
        px(c, 5, 11, '#6b8f4e');
        px(c, 6, 11, '#6b8f4e');
      });
    case 'railing':
      // Iron safety railing along the cliff edge.
      return draw(32, 10, (c) => {
        for (let x = 1; x < 32; x += 6) rect(c, x, 2, 2, 8, '#495057');
        rect(c, 0, 2, 32, 2, '#868e96');
        rect(c, 0, 6, 32, 1, '#868e96');
        rect(c, 0, 2, 32, 1, '#adb5bd');
      });
    case 'eucalyptus':
      // Tall, thin roadside eucalyptus: pale trunk, narrow crown.
      return draw(18, 46, (c) => {
        ellipse(c, 9, 43, 6, 2, 'rgba(0,0,0,0.22)');
        rect(c, 8, 16, 3, 28, '#d8cfc0');
        rect(c, 8, 16, 1, 28, '#efe7d8');
        rect(c, 10, 24, 1, 6, '#a39886');
        ellipse(c, 9, 12, 6, 11, '#4f7f4a');
        ellipse(c, 8, 9, 4, 7, '#6a9c5f');
        px(c, 6, 6, '#86b37a');
        px(c, 11, 14, '#3d6638');
      });
    case 'katte':
      return draw(40, 22, (c) => {
        rect(c, 2, 4, 36, 14, '#a8a29a');
        rect(c, 2, 4, 36, 3, '#c9c3b9');
        rect(c, 2, 16, 36, 2, '#7d776f');
        for (let x = 4; x < 38; x += 8) rect(c, x, 8, 1, 8, '#8f897f');
        rect(c, 16, 4, 8, 4, '#d6336c');
        px(c, 20, 3, '#fab005');
      });
  }
}

function draw(w: number, h: number, fn: (c: Ctx) => void, withOutline = true): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  fn(ctx);
  if (withOutline) outline(ctx, 0, 0, w, h);
  return c;
}

function tree(leaf: string, blossom: string | null): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(34, 40);
  ellipse(ctx, 18, 36, 11, 3, 'rgba(0,0,0,0.25)');
  rect(ctx, 15, 22, 4, 15, '#6b4226');
  rect(ctx, 15, 22, 1, 15, '#8b5a2b');
  const dark = shade(leaf, -0.28);
  const light = shade(leaf, 0.22);
  ellipse(ctx, 17, 15, 14, 12, dark);
  ellipse(ctx, 12, 12, 8, 7, leaf);
  ellipse(ctx, 22, 11, 8, 7, leaf);
  ellipse(ctx, 17, 17, 10, 7, leaf);
  ellipse(ctx, 12, 9, 4, 3, light);
  ellipse(ctx, 20, 8, 4, 3, light);
  for (let i = 0; i < 26; i++) {
    const x = 5 + Math.floor(hash(i, 1, leaf.length) * 24);
    const y = 4 + Math.floor(hash(i, 2, leaf.length) * 20);
    const d = Math.hypot(x - 17, (y - 15) * 1.15);
    if (d < 12) px(ctx, x, y, blossom && i % 2 === 0 ? blossom : i % 3 ? light : dark);
  }
  outline(ctx, 0, 0, 34, 40);
  return c;
}

function palm(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(30, 40);
  ellipse(ctx, 15, 37, 7, 2, 'rgba(0,0,0,0.25)');
  for (let y = 10; y < 37; y++) rect(ctx, 14 + Math.round(Math.sin(y / 6)), y, 3, 1, y % 3 ? '#8b6b4a' : '#6b4f35');
  const frond = (dx: number, dy: number) => {
    for (let i = 0; i < 12; i++) rect(ctx, 15 + Math.round(dx * i), 10 + Math.round(dy * i + i * i * 0.05), 2, 2, i % 2 ? '#2f9e44' : '#37b24d');
  };
  frond(1, -0.4);
  frond(-1, -0.4);
  frond(0.8, 0.3);
  frond(-0.8, 0.3);
  frond(0.2, -0.7);
  ellipse(ctx, 15, 11, 3, 2, '#5c940d');
  outline(ctx, 0, 0, 30, 40);
  return c;
}

function banyan(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(72, 64);
  ellipse(ctx, 38, 58, 30, 5, 'rgba(0,0,0,0.25)');
  rect(ctx, 30, 34, 12, 24, '#6b4a33');
  rect(ctx, 31, 34, 3, 24, '#8b6448');
  ellipse(ctx, 36, 24, 33, 22, '#2b6b2f');
  ellipse(ctx, 26, 18, 18, 12, '#3a8a3a');
  ellipse(ctx, 48, 18, 16, 12, '#3a8a3a');
  ellipse(ctx, 36, 28, 22, 12, '#347f35');
  for (let i = 0; i < 60; i++) {
    const x = 6 + Math.floor(hash(i, 1, 9) * 60);
    const y = 4 + Math.floor(hash(i, 2, 9) * 38);
    if (Math.hypot((x - 36) / 33, (y - 24) / 22) < 0.95) px(ctx, x, y, i % 2 ? '#58a65c' : '#245a27');
  }
  // Aerial roots
  for (const x of [12, 18, 54, 60, 24, 48]) rect(ctx, x, 36 + (x % 5), 1, 14 - (x % 4), '#7d5a40');
  outline(ctx, 0, 0, 72, 64);
  return c;
}

function chaiCart(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(28, 26);
  // Tarp canopy
  rect(ctx, 1, 1, 26, 6, '#1971c2');
  for (let x = 1; x < 27; x += 4) rect(ctx, x, 1, 2, 6, '#fab005');
  rect(ctx, 2, 7, 1, 12, '#5c3d2e');
  rect(ctx, 25, 7, 1, 12, '#5c3d2e');
  // Counter
  rect(ctx, 2, 14, 24, 9, '#a0663a');
  rect(ctx, 2, 14, 24, 1, '#c08552');
  drawText(ctx, 'CHAI', 7, 17, '#fff3bf');
  // Kettle and glasses
  ellipse(ctx, 7, 11, 3, 3, '#ced4da');
  rect(ctx, 6, 7, 2, 2, '#868e96');
  px(ctx, 10, 10, '#ced4da');
  for (let x = 13; x < 24; x += 3) {
    rect(ctx, x, 11, 2, 3, '#e9ecef');
    px(ctx, x, 12, '#c08552');
  }
  ellipse(ctx, 6, 24, 2, 1.5, '#212529');
  ellipse(ctx, 22, 24, 2, 1.5, '#212529');
  outline(ctx, 0, 0, 28, 26);
  return c;
}

function cart(goods: string[], wood: string, round = false): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(26, 16);
  rect(ctx, 2, 7, 22, 5, wood);
  rect(ctx, 2, 7, 22, 1, shade(wood, 0.25));
  for (let x = 3; x < 23; x += round ? 3 : 2)
    for (let y = 2; y < 7; y += round ? 3 : 2)
      if (round) ellipse(ctx, x + 1, y + 1.5, 1.6, 1.6, goods[(x + y) % goods.length]);
      else px(ctx, x + (y % 4 === 0 ? 1 : 0), y + 1, goods[(x * 3 + y) % goods.length]);
  ellipse(ctx, 5, 13, 2, 2, '#212529');
  ellipse(ctx, 21, 13, 2, 2, '#212529');
  outline(ctx, 0, 0, 26, 16);
  return c;
}

/** Traffic signal pole with the given lit lamp. */
export function paintSignal(lit: 'red' | 'yellow' | 'green'): HTMLCanvasElement {
  return draw(10, 30, (c) => {
    rect(c, 4, 12, 2, 17, '#495057');
    rect(c, 2, 1, 6, 13, '#212529');
    const on = { red: '#ff3b30', yellow: '#ffcc00', green: '#34c759' };
    const off = { red: '#4a1c1a', yellow: '#4a3f10', green: '#163d1f' };
    rect(c, 3, 2, 4, 3, lit === 'red' ? on.red : off.red);
    rect(c, 3, 6, 4, 3, lit === 'yellow' ? on.yellow : off.yellow);
    rect(c, 3, 10, 4, 3, lit === 'green' ? on.green : off.green);
  });
}

/** Elevated metro viaduct segment (horizontal, 16px long, 22px tall). */
export function paintViaduct(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(16, 22);
  rect(ctx, 0, 0, 16, 22, '#b8b4ae');
  rect(ctx, 0, 0, 16, 2, '#d9d5cf');
  rect(ctx, 0, 20, 16, 2, '#7d7973');
  rect(ctx, 0, 6, 16, 1, '#5c5a57');
  rect(ctx, 0, 15, 16, 1, '#5c5a57');
  for (let x = 0; x < 16; x += 4) rect(ctx, x, 7, 2, 8, '#8f8a83');
  return c;
}

export const FLAG_FRAMES = 4;

/** Size of one frame of the Kannada flag texture (pole on the left, base at the bottom). */
export const flagFrame = (clothW: number, poleH: number) => ({ w: clothW + 4, h: poleH + 2 });

/**
 * The red-and-yellow Kannada flag on a pole, FLAG_FRAMES frames side by side: the cloth ripples, more
 * towards its free end, with light and shade following the folds.
 */
export function paintKannadaFlag(clothW: number, clothH: number, poleH: number): HTMLCanvasElement {
  const { w: fw, h: fh } = flagFrame(clothW, poleH);
  const [c, ctx] = makeCanvas(fw * FLAG_FRAMES, fh);
  const half = Math.floor(clothH / 2);
  for (let f = 0; f < FLAG_FRAMES; f++) {
    const ox = f * fw;
    rect(ctx, ox + 1, 1, 2, poleH + 1, '#868e96');
    rect(ctx, ox + 1, 1, 1, poleH + 1, '#ced4da');
    rect(ctx, ox + 1, 0, 2, 1, '#fab005');
    for (let x = 0; x < clothW; x++) {
      const k = x / clothW;
      const phase = k * Math.PI * 1.8 - f * (Math.PI / 2);
      const dy = Math.round(Math.sin(phase) * clothH * 0.2 * k);
      const light = Math.cos(phase) * 0.14;
      rect(ctx, ox + 3 + x, 2 + dy, 1, half, shade('#fcc419', light));
      rect(ctx, ox + 3 + x, 2 + dy + half, 1, clothH - half, shade('#e03131', light));
    }
  }
  return c;
}
