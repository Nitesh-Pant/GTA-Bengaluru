/** What goes on a postcard besides the photo. */
export interface PostcardInfo {
  area: string;
  time: string;
  name: string;
  festival: string | null;
}

/** Card size: landscape for a landscape shot, portrait for a phone held upright. */
export const postcardSize = (photoW: number, photoH: number) => (photoW >= photoH ? { w: 1200, h: 900 } : { w: 900, h: 1260 });

/** "Indiranagar · 8:20 AM · Ugadi" */
export const postcardCaption = (p: PostcardInfo) => [p.area, p.time, p.festival].filter(Boolean).join(' · ');

const TITLE = '"Press Start 2P", monospace';
const BODY = '"Pixelify Sans", monospace';

/**
 * A "Greetings from Bengaluru" postcard: airmail border, the shot (cropped to fill), a caption, a
 * signature, a Kannada-flag stamp with a postmark, and the game's address.
 */
export async function composePostcard(
  photo: CanvasImageSource & { width: number; height: number },
  info: PostcardInfo,
  focus = { x: 0.5, y: 0.5 },
): Promise<HTMLCanvasElement> {
  await Promise.all([document.fonts.load(`64px ${TITLE}`), document.fonts.load(`28px ${BODY}`)]).catch(() => {});
  const { w: W, h: H } = postcardSize(photo.width, photo.height);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Card and airmail border.
  ctx.fillStyle = '#fbf3e4';
  ctx.fillRect(0, 0, W, H);
  const stripe = 22;
  for (let i = -H; i < W + H; i += stripe * 2) {
    for (const [col, off] of [
      ['#d6336c', 0],
      ['#1c7ed6', stripe],
    ] as const) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(i + off, 0);
      ctx.lineTo(i + off + stripe, 0);
      ctx.lineTo(i + off + stripe - H, H);
      ctx.lineTo(i + off - H, H);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = '#fbf3e4';
  ctx.fillRect(14, 14, W - 28, H - 28);

  // The photo, cropped to fill its frame around `focus` (you), with a white border and a shadow.
  const capH = 230;
  const fx = 44;
  const fy = 44;
  const fw = W - 88;
  const fh = H - 88 - capH;
  const scale = Math.max(fw / photo.width, fh / photo.height);
  const sw = fw / scale;
  const sh = fh / scale;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(fx + 6, fy + 8, fw + 12, fh + 12);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(fx - 6, fy - 6, fw + 12, fh + 12);
  const cx = Math.max(0, Math.min(photo.width - sw, focus.x * photo.width - sw / 2));
  const cy = Math.max(0, Math.min(photo.height - sh, focus.y * photo.height - sh / 2));
  ctx.drawImage(photo, cx, cy, sw, sh, fx, fy, fw, fh);

  // Caption: "Greetings from BENGALURU", where and when, the signature, the web address.
  const base = fy + fh + 30;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#7a5a40';
  ctx.font = `30px ${BODY}`;
  ctx.fillText('Greetings from', 48, base);
  ctx.font = `${W > 1000 ? 64 : 52}px ${TITLE}`;
  ctx.fillStyle = '#c92a2a';
  ctx.fillText('BENGALURU', 53, base + 47);
  ctx.fillStyle = '#fab005';
  ctx.fillText('BENGALURU', 48, base + 42);
  ctx.fillStyle = '#3d2c22';
  ctx.font = `26px ${BODY}`;
  ctx.fillText(postcardCaption(info), 48, base + 128);
  ctx.font = `italic 30px ${BODY}`;
  ctx.fillText(`Love, ${info.name}`, 48, base + 164);
  ctx.fillStyle = '#7a5a40';
  ctx.font = `20px ${BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText('GTE-Bengaluru · gte-bengaluru.pages.dev', W - 48, H - 46);
  ctx.textAlign = 'left';

  // Stamp: Kannada flag colours, perforated edge, "GTE"; a postmark ring over its corner.
  const stW = 132;
  const stH = 160;
  const sx = W - 48 - stW;
  const sy = base - 4;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx, sy, stW, stH);
  ctx.fillStyle = '#fbf3e4';
  for (let x = sx; x <= sx + stW; x += 12) {
    for (const y of [sy, sy + stH]) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let y = sy; y <= sy + stH; y += 12) {
    for (const x of [sx, sx + stW]) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#fcc419';
  ctx.fillRect(sx + 10, sy + 10, stW - 20, (stH - 20) / 2);
  ctx.fillStyle = '#e03131';
  ctx.fillRect(sx + 10, sy + 10 + (stH - 20) / 2, stW - 20, (stH - 20) / 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = `30px ${TITLE}`;
  ctx.textAlign = 'center';
  ctx.fillText('GTE', sx + stW / 2, sy + stH / 2 - 15);
  ctx.strokeStyle = 'rgba(60,40,30,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx - 6, sy + stH * 0.62, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,40,30,0.6)';
  ctx.font = `14px ${BODY}`;
  ctx.fillText('BENGALURU', sx - 6, sy + stH * 0.62 - 16);
  ctx.font = `10px ${TITLE}`;
  ctx.fillText('560001', sx - 6, sy + stH * 0.62 + 6);
  ctx.textAlign = 'left';
  return c;
}
