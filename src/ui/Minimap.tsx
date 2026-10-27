import { useEffect, useMemo, useRef } from 'react';
import { buildGround, BUILDINGS } from '../data/map';
import { STATIONS } from '../data/metro';
import { POIS } from '../data/pois';
import { METRO_TRACK } from '../data/roads';
import { paintMinimapBase } from '../game/art/ground';
import { bridge } from '../game/bridge';
import { MAP_H, MAP_W, TILE } from '../game/constants';
import { visibilityOf, type PoiKind } from '../logic/discovery';
import { uiStore } from '../store/uiStore';

export const KIND_COLOUR: Record<PoiKind, string> = {
  food: '#ff922b',
  landmark: '#4dabf7',
  hidden: '#da77f2',
  metro: '#9775fa',
  shop: '#ffd43b',
  park: '#69db7c',
};

let baseCanvas: HTMLCanvasElement | null = null;
const base = () => (baseCanvas ??= paintMinimapBase(buildGround()));

interface Props {
  width: number;
  height: number;
  /** Pixels per tile. Omit to fit the whole city. */
  scale?: number;
  onPick?: (poiId: string) => void;
}

/** Canvas map drawn every animation frame from a snapshot; React never re-renders for movement. */
export function Minimap({ width, height, scale, onPick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const view = useRef({ ox: 0, oy: 0, s: 1 });
  const fit = useMemo(() => Math.min(width / MAP_W, height / MAP_H), [width, height]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      const snap = bridge.api?.snapshot();
      const s = scale ?? fit;
      const px = snap ? snap.x / TILE : MAP_W / 2;
      const py = snap ? snap.y / TILE : MAP_H / 2;
      const vw = width / s;
      const vh = height / s;
      const ox = scale ? Math.max(0, Math.min(MAP_W - vw, px - vw / 2)) : (MAP_W - vw) / 2;
      const oy = scale ? Math.max(0, Math.min(MAP_H - vh, py - vh / 2)) : (MAP_H - vh) / 2;
      view.current = { ox, oy, s };
      const X = (tx: number) => (tx - ox) * s;
      const Y = (ty: number) => (ty - oy) * s;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#14101e';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(base(), 0, 0, MAP_W, MAP_H, X(0), Y(0), MAP_W * s, MAP_H * s);
      // Metro line
      ctx.strokeStyle = 'rgba(151,117,250,0.85)';
      ctx.lineWidth = Math.max(1.5, s * 0.6);
      ctx.beginPath();
      ctx.moveTo(X(METRO_TRACK[0].x / TILE), Y(METRO_TRACK[0].y / TILE));
      ctx.lineTo(X(METRO_TRACK[1].x / TILE), Y(METRO_TRACK[1].y / TILE));
      ctx.stroke();
      const st = uiStore.get();
      const state = { discovered: st.discovered, hinted: st.hinted };
      const r = Math.max(2.5, s * 1.1);
      ctx.font = `bold ${Math.max(8, Math.round(r * 2.2))}px "Pixelify Sans", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const poi of POIS) {
        const vis = visibilityOf(state, poi);
        if (vis === 'secret') continue;
        const x = X(poi.x / TILE);
        const y = Y(poi.y / TILE);
        if (x < -8 || y < -8 || x > width + 8 || y > height + 8) continue;
        if (vis === 'known') {
          ctx.fillStyle = '#1c1726';
          ctx.fillRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2);
          ctx.fillStyle = KIND_COLOUR[poi.kind];
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        } else {
          const hinted = st.hinted.includes(poi.id);
          ctx.fillStyle = hinted ? (Math.floor(time / 400) % 2 ? '#fcc419' : '#fff3bf') : 'rgba(248,249,250,0.75)';
          ctx.fillText('?', x, y);
        }
      }
      for (const s2 of STATIONS) {
        const x = X(s2.entrance.x / TILE);
        const y = Y(s2.entrance.y / TILE);
        ctx.fillStyle = '#7048e8';
        ctx.fillRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2);
        ctx.fillStyle = '#fff';
        ctx.fillText('M', x, y + 0.5);
      }
      if (snap)
        for (const v of snap.rideables) {
          ctx.fillStyle = '#fcc419';
          ctx.fillRect(X(v.x / TILE) - 1.5, Y(v.y / TILE) - 1.5, 3, 3);
        }
      if (st.destination) {
        const poi = POIS.find((p) => p.id === st.destination);
        if (poi) {
          const x = X(poi.x / TILE);
          const y = Y(poi.y / TILE);
          ctx.strokeStyle = '#ff6b6b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r * 2 + 2 + Math.sin(time / 200) * 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (snap) {
        const x = X(px);
        const y = Y(py);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(snap.angle);
        const k = Math.max(4, s * 1.6);
        ctx.fillStyle = snap.driving ? '#fcc419' : '#ff4d4d';
        ctx.strokeStyle = '#1c1726';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(-k * 0.7, k * 0.7);
        ctx.lineTo(-k * 0.35, 0);
        ctx.lineTo(-k * 0.7, -k * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // Building names on the big map
      if (!scale && s >= 6) {
        ctx.font = '10px "Pixelify Sans", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (const b of BUILDINGS) if (b.sign && b.w >= 7) ctx.fillText(b.sign, X(b.x + b.w / 2), Y(b.y + b.h / 2));
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [width, height, scale, fit]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { ox, oy, s } = view.current;
    const tx = (e.clientX - rect.left) / s + ox;
    const ty = (e.clientY - rect.top) / s + oy;
    const st = uiStore.get();
    const state = { discovered: st.discovered, hinted: st.hinted };
    const hit = POIS.filter((p) => visibilityOf(state, p) !== 'secret')
      .map((p) => ({ p, d: Math.hypot(p.x / TILE - tx, p.y / TILE - ty) }))
      .sort((a, b) => a.d - b.d)[0];
    if (hit && hit.d < 4) onPick(hit.p.id);
  };

  return <canvas ref={ref} width={width} height={height} className="minimap-canvas" onClick={onClick} style={{ cursor: onPick ? 'pointer' : 'default' }} />;
}
