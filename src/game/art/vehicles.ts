import type { TrafficType } from '../../data/roads';
import { ellipse, makeCanvas, outline, px, rect, shade } from './pixel';

/** All vehicles are painted facing east (angle 0) and rotated in-engine. */

const CAR_COLOURS = ['#f1f3f5', '#adb5bd', '#c92a2a', '#1971c2', '#343a40', '#a61e4d', '#e67700', '#2f9e44'];
const BUS_COLOURS = [
  ['#c92a2a', '#f8f1e4'],
  ['#1c7ed6', '#e7f5ff'],
];
const SCOOTER_COLOURS = ['#e03131', '#1971c2', '#f08c00', '#2b8a3e'];

export const VEHICLE_CANVAS: Record<TrafficType, { w: number; h: number }> = {
  car: { w: 34, h: 20 },
  auto: { w: 26, h: 20 },
  bus: { w: 58, h: 22 },
  scooter: { w: 20, h: 12 },
};

export function paintVehicle(type: TrafficType, variant: number): HTMLCanvasElement {
  const { w, h } = VEHICLE_CANVAS[type];
  const [c, ctx] = makeCanvas(w, h);
  if (type === 'car') paintCar(ctx, variant);
  else if (type === 'auto') paintAuto(ctx, variant);
  else if (type === 'bus') paintBus(ctx, variant);
  else paintScooter(ctx, variant);
  return c;
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 1, y + 2, w, h);
}

function paintCar(ctx: CanvasRenderingContext2D, variant: number) {
  const body = CAR_COLOURS[variant % CAR_COLOURS.length];
  const dark = shade(body, -0.25);
  const light = shade(body, 0.25);
  const glass = '#27374d';
  const glassL = '#5c7a99';
  const x = 3;
  const y = 3;
  const L = 28;
  const W = 14;
  shadow(ctx, x, y, L, W);
  rect(ctx, x + 1, y, L - 2, W, body);
  rect(ctx, x, y + 1, L, W - 2, body);
  rect(ctx, x, y + W - 3, L, 2, dark);
  rect(ctx, x + 1, y + 1, L - 3, 1, light);
  // Bonnet line, windscreen, roof, rear window
  rect(ctx, x + 17, y + 2, 4, W - 4, glass);
  rect(ctx, x + 17, y + 2, 1, W - 4, glassL);
  rect(ctx, x + 9, y + 2, 8, W - 4, light);
  rect(ctx, x + 9, y + 2, 8, 1, shade(body, 0.4));
  rect(ctx, x + 6, y + 2, 3, W - 4, glass);
  rect(ctx, x + 22, y + 3, 4, 1, dark);
  rect(ctx, x + 22, y + W - 4, 4, 1, dark);
  // Lights
  rect(ctx, x + L - 1, y + 1, 1, 3, '#fff3bf');
  rect(ctx, x + L - 1, y + W - 4, 1, 3, '#fff3bf');
  rect(ctx, x, y + 1, 1, 3, '#e03131');
  rect(ctx, x, y + W - 4, 1, 3, '#e03131');
  // Mirrors
  px(ctx, x + 18, y - 1, body);
  px(ctx, x + 18, y + W, body);
  outline(ctx, 0, 0, 34, 20);
}

function paintAuto(ctx: CanvasRenderingContext2D, variant: number) {
  const green = ['#2b8a3e', '#2f9e44', '#37b24d', '#1e7b34'][variant % 4];
  const yellow = '#fcc419';
  const hood = '#25262b';
  const x = 2;
  const y = 3;
  shadow(ctx, x, y, 21, 14);
  // Rear body peeking out under the canopy
  rect(ctx, x, y + 1, 15, 12, green);
  // Canopy (black canvas hood) with yellow trim
  rect(ctx, x + 1, y, 14, 14, hood);
  rect(ctx, x + 1, y, 14, 1, yellow);
  rect(ctx, x + 1, y + 13, 14, 1, yellow);
  rect(ctx, x + 3, y + 2, 10, 1, '#3d3e45');
  rect(ctx, x + 3, y + 6, 10, 1, '#3d3e45');
  rect(ctx, x + 3, y + 10, 10, 1, '#3d3e45');
  // Front cowl tapering to the single front wheel
  rect(ctx, x + 15, y + 2, 3, 10, yellow);
  rect(ctx, x + 18, y + 3, 2, 8, yellow);
  rect(ctx, x + 20, y + 5, 2, 4, green);
  rect(ctx, x + 15, y + 2, 1, 10, '#9ad1ff');
  px(ctx, x + 21, y + 6, '#fff3bf');
  px(ctx, x + 21, y + 7, '#fff3bf');
  rect(ctx, x + 18, y + 10, 2, 1, shade(yellow, -0.3));
  outline(ctx, 0, 0, 26, 20);
}

function paintBus(ctx: CanvasRenderingContext2D, variant: number) {
  const [body, roof] = BUS_COLOURS[variant % BUS_COLOURS.length];
  const x = 2;
  const y = 3;
  const L = 52;
  const W = 16;
  shadow(ctx, x, y, L, W);
  rect(ctx, x, y, L, W, body);
  rect(ctx, x + 1, y + 2, L - 3, W - 4, roof);
  rect(ctx, x, y + W - 2, L, 2, shade(body, -0.25));
  // Roof AC unit and hatches
  rect(ctx, x + 18, y + 4, 14, 8, '#ced4da');
  rect(ctx, x + 19, y + 5, 12, 1, '#f1f3f5');
  rect(ctx, x + 8, y + 6, 5, 4, shade(roof, -0.15));
  rect(ctx, x + 38, y + 6, 5, 4, shade(roof, -0.15));
  // Windscreen
  rect(ctx, x + L - 3, y + 2, 2, W - 4, '#27374d');
  rect(ctx, x + L - 1, y + 2, 1, 2, '#fff3bf');
  rect(ctx, x + L - 1, y + W - 4, 1, 2, '#fff3bf');
  rect(ctx, x, y + 2, 1, 2, '#e03131');
  rect(ctx, x, y + W - 4, 1, 2, '#e03131');
  outline(ctx, 0, 0, 58, 22);
}

function paintScooter(ctx: CanvasRenderingContext2D, variant: number) {
  const body = SCOOTER_COLOURS[variant % SCOOTER_COLOURS.length];
  shadow(ctx, 2, 3, 15, 6);
  rect(ctx, 2, 4, 14, 4, body);
  rect(ctx, 2, 5, 14, 2, shade(body, 0.2));
  rect(ctx, 15, 2, 1, 8, '#343a40'); // handlebar
  px(ctx, 16, 5, '#fff3bf');
  px(ctx, 16, 6, '#fff3bf');
  // Rider: shoulders and helmet seen from above
  rect(ctx, 7, 2, 4, 8, ['#e9ecef', '#495057', '#e8590c', '#1864ab'][variant % 4]);
  ellipse(ctx, 10.5, 6, 2.6, 2.6, ['#212529', '#f8f9fa', '#c92a2a', '#fab005'][variant % 4]);
  outline(ctx, 0, 0, 20, 12);
}

/** Yulu: a small sky-blue shared e-bike with a front basket and its rider, seen from above (east-facing). */
export function paintYulu(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(20, 12);
  shadow(ctx, 2, 3, 15, 6);
  rect(ctx, 3, 5, 12, 2, '#13b5ea');
  rect(ctx, 3, 4, 2, 4, '#0b7fa8');
  rect(ctx, 14, 3, 3, 6, '#f8f9fa');
  rect(ctx, 15, 4, 1, 4, '#13b5ea');
  rect(ctx, 13, 2, 1, 8, '#343a40');
  rect(ctx, 6, 3, 4, 6, '#ffd43b');
  ellipse(ctx, 9, 6, 2.4, 2.4, '#f8f9fa');
  outline(ctx, 0, 0, 20, 12);
  return c;
}

/** A three-coach purple-line metro train (east-facing). */
export function paintTrain(): HTMLCanvasElement {
  const coach = 46;
  const [c, ctx] = makeCanvas(coach * 3 + 4, 18);
  for (let i = 0; i < 3; i++) {
    const x = 2 + i * coach;
    rect(ctx, x, 3, coach - 2, 12, '#dee2e6');
    rect(ctx, x, 3, coach - 2, 1, '#f8f9fa');
    rect(ctx, x, 7, coach - 2, 4, '#7048e8');
    rect(ctx, x, 8, coach - 2, 1, '#9775fa');
    for (let wx = x + 4; wx < x + coach - 6; wx += 7) rect(ctx, wx, 4, 4, 2, '#adb5bd');
    rect(ctx, x + 10, 12, 3, 2, '#868e96');
    rect(ctx, x + coach - 15, 12, 3, 2, '#868e96');
  }
  rect(ctx, coach * 3, 5, 2, 8, '#495057');
  px(ctx, coach * 3 + 1, 6, '#fff3bf');
  px(ctx, coach * 3 + 1, 11, '#fff3bf');
  outline(ctx, 0, 0, coach * 3 + 4, 18);
  return c;
}

/** Small top-down cow, resting. Horns painted in the festival style. */
export function paintCow(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(28, 18);
  ellipse(ctx, 14, 12, 11, 4, 'rgba(0,0,0,0.25)');
  ellipse(ctx, 13, 9, 9, 5, '#f1ede4');
  ellipse(ctx, 10, 8, 3, 2, '#b8b1a3');
  ellipse(ctx, 16, 11, 2.5, 1.5, '#b8b1a3');
  rect(ctx, 20, 6, 5, 5, '#e9e3d7');
  rect(ctx, 24, 7, 1, 3, '#d9a4a4');
  rect(ctx, 21, 4, 1, 2, '#e8590c');
  rect(ctx, 21, 11, 1, 2, '#1971c2');
  px(ctx, 22, 7, '#1c1726');
  px(ctx, 22, 9, '#1c1726');
  rect(ctx, 3, 9, 2, 1, '#8a8173');
  outline(ctx, 0, 0, 28, 18);
  return c;
}

/** Car-variant ids for emergency vehicles (textures `veh_car_<id>` and the flashing `veh_car_<id>b`). */
export const POLICE_VARIANT = 8;
export const AMBULANCE_VARIANT = 9;

/** Police car or ambulance, east-facing, with its roof lights in one of two flash states. */
export function paintEmergency(kind: 'police' | 'ambulance', flash: 0 | 1): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(34, 20);
  const x = 3;
  const y = 3;
  const L = 28;
  const W = 14;
  const body = '#f8f9fa';
  shadow(ctx, x, y, L, W);
  rect(ctx, x + 1, y, L - 2, W, body);
  rect(ctx, x, y + 1, L, W - 2, body);
  rect(ctx, x, y + W - 3, L, 2, '#ced4da');
  if (kind === 'police') {
    rect(ctx, x, y + 5, L, 4, '#1c3d7a');
    rect(ctx, x + 17, y + 2, 4, W - 4, '#27374d');
    rect(ctx, x + 6, y + 2, 3, W - 4, '#27374d');
  } else {
    rect(ctx, x, y + 2, L, 1, '#c92a2a');
    rect(ctx, x, y + W - 4, L, 1, '#c92a2a');
    rect(ctx, x + 20, y + 2, 4, W - 4, '#27374d');
    // Red cross on the roof
    rect(ctx, x + 9, y + 6, 6, 2, '#e03131');
    rect(ctx, x + 11, y + 4, 2, 6, '#e03131');
  }
  // Light bar: red and blue (police) or red and white (ambulance), swapping each flash
  const a = flash ? '#ff2d2d' : kind === 'police' ? '#2d6bff' : '#ffffff';
  const b = flash ? (kind === 'police' ? '#2d6bff' : '#ffffff') : '#ff2d2d';
  const lx = kind === 'police' ? x + 12 : x + 16;
  rect(ctx, lx, y + 2, 2, 5, a);
  rect(ctx, lx, y + 7, 2, 5, b);
  rect(ctx, x + L - 1, y + 1, 1, 3, '#fff3bf');
  rect(ctx, x + L - 1, y + W - 4, 1, 3, '#fff3bf');
  outline(ctx, 0, 0, 34, 20);
  return c;
}

/** Swan pedal boat on Ulsoor Lake, seen from above, facing east. */
export function paintBoat(variant: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(18, 12);
  const hull = ['#f8f9fa', '#ffd43b'][variant % 2];
  const canopy = ['#e03131', '#1971c2'][variant % 2];
  ellipse(ctx, 9, 7, 8, 4, 'rgba(255,255,255,0.35)');
  ellipse(ctx, 8, 6, 7, 3.5, hull);
  rect(ctx, 4, 3, 6, 6, canopy);
  rect(ctx, 4, 3, 6, 1, shade(canopy, 0.3));
  // Swan neck and head at the bow
  rect(ctx, 13, 2, 2, 4, hull);
  rect(ctx, 14, 1, 3, 2, hull);
  px(ctx, 16, 2, '#f08c00');
  outline(ctx, 0, 0, 18, 12);
  return c;
}
