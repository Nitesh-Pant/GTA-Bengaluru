import { useEffect, useMemo, useRef } from 'react';
import { buildGround, BUILDINGS, districtCentre, DISTRICTS, STREET_LABELS } from '../data/map';
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

/** Street labels that repeat a district name are left to the district label when zoomed out. */
const DISTRICT_NAMES = new Set(DISTRICTS.map((d) => d.name.toLowerCase()));

let baseCanvas: HTMLCanvasElement | null = null;
const base = () => (baseCanvas ??= paintMinimapBase(buildGround()));

/** Big-map camera, in tiles: zoom 1 fits the whole city. */
export interface MapCamera {
  zoom: number;
  x: number;
  y: number;
}

/** Where the big map is looking: pixels per tile and the top-left tile. Small axes stay centred. */
export function mapView(width: number, height: number, cam: MapCamera) {
  const s = Math.min(width / MAP_W, height / MAP_H) * cam.zoom;
  const vw = width / s;
  const vh = height / s;
  const ox = vw >= MAP_W ? (MAP_W - vw) / 2 : Math.max(0, Math.min(MAP_W - vw, cam.x - vw / 2));
  const oy = vh >= MAP_H ? (MAP_H - vh) / 2 : Math.max(0, Math.min(MAP_H - vh, cam.y - vh / 2));
  return { s, ox, oy };
}

interface Props {
  width: number;
  height: number;
  /** Pixels per tile, following the player. Omit for the big map. */
  scale?: number;
  /** Big map only: zoom and pan, read every frame so dragging never re-renders React. */
  camera?: React.RefObject<MapCamera>;
  onPick?: (poiId: string) => void;
  /** Stop redrawing (e.g. the HUD minimap while the big map or pause menu covers it). */
  paused?: boolean;
}

/** Canvas map drawn every animation frame from a snapshot; React never re-renders for movement. */
export function Minimap({ width, height, scale, camera, onPick, paused = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const view = useRef({ ox: 0, oy: 0, s: 1 });
  const fit = useMemo(() => Math.min(width / MAP_W, height / MAP_H), [width, height]);

  useEffect(() => {
    if (paused) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      const snap = bridge.api?.snapshot();
      const px = snap ? snap.x / TILE : MAP_W / 2;
      const py = snap ? snap.y / TILE : MAP_H / 2;
      const { s, ox, oy } = scale
        ? mapView(width, height, { zoom: scale / fit, x: px, y: py })
        : mapView(width, height, camera?.current ?? { zoom: 1, x: MAP_W / 2, y: MAP_H / 2 });
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
      // Jobs on offer: a yellow "!" per giver.
      if (snap)
        for (const j of snap.jobs) {
          const x = X(j.x / TILE);
          const y = Y(j.y / TILE);
          if (x < -6 || y < -6 || x > width + 6 || y > height + 6) continue;
          ctx.fillStyle = '#1c1726';
          ctx.beginPath();
          ctx.arc(x, y, r + 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fcc419';
          ctx.beginPath();
          ctx.arc(x, y, r + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1c1726';
          ctx.fillText('!', x, y + 0.5);
        }
      // The active marker (a place, Find a ride, or a job) and the route to it.
      if (snap?.target) {
        if (snap.route.length > 1) {
          ctx.strokeStyle = 'rgba(255,107,107,0.9)';
          ctx.lineWidth = Math.max(1.5, s * 0.5);
          ctx.setLineDash([3, 2]);
          ctx.beginPath();
          snap.route.forEach((p, i) => (i ? ctx.lineTo(X(p.x / TILE), Y(p.y / TILE)) : ctx.moveTo(X(p.x / TILE), Y(p.y / TILE))));
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const tx = X(snap.target.x / TILE);
        const ty = Y(snap.target.y / TILE);
        const edge = 7;
        if (tx < edge || ty < edge || tx > width - edge || ty > height - edge) {
          // Off the minimap: a red arrow on its edge, pointing the way.
          const cx = width / 2;
          const cy = height / 2;
          const ang = Math.atan2(ty - cy, tx - cx);
          const k = Math.min((cx - edge) / Math.abs(Math.cos(ang) || 1e-6), (cy - edge) / Math.abs(Math.sin(ang) || 1e-6));
          ctx.save();
          ctx.translate(cx + Math.cos(ang) * k, cy + Math.sin(ang) * k);
          ctx.rotate(ang);
          ctx.fillStyle = '#ff6b6b';
          ctx.strokeStyle = '#1c1726';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(-4, 5);
          ctx.lineTo(-4, -5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.strokeStyle = '#ff6b6b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(tx, ty, r * 2 + 2 + Math.sin(time / 200) * 1.5, 0, Math.PI * 2);
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
      // Names on the big map, so places are recognisable at any zoom: districts when zoomed out,
      // buildings when zoomed in, roads and lakes always.
      if (!scale) {
        const label = (text: string, x: number, y: number, font: string, fill: string, vertical = false) => {
          if (x < -120 || y < -120 || x > width + 120 || y > height + 120) return;
          ctx.save();
          ctx.translate(x, y);
          if (vertical) ctx.rotate(-Math.PI / 2);
          ctx.font = font;
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(20,16,30,0.9)';
          ctx.strokeText(text, 0, 0);
          ctx.fillStyle = fill;
          ctx.fillText(text, 0, 0);
          ctx.restore();
        };
        if (s >= 5) for (const b of BUILDINGS) if (b.sign && b.w >= 5) label(b.sign, X(b.x + b.w / 2), Y(b.y + b.h / 2), `${s >= 9 ? 12 : 10}px "Pixelify Sans", monospace`, 'rgba(255,255,255,0.85)');
        for (const l of STREET_LABELS)
          if (s >= 8 || !DISTRICT_NAMES.has(l.name.toLowerCase())) label(l.name, X(l.x), Y(l.y), 'bold 11px "Pixelify Sans", monospace', '#fff3bf', l.vertical);
        if (s < 8)
          for (const d of DISTRICTS) {
            const c = districtCentre(d);
            label((d.short ?? d.name).toUpperCase(), X(c.x), Y(c.y) - (s >= 5 ? 14 : 0), `bold ${s >= 5 ? 13 : 12}px "Pixelify Sans", monospace`, '#ffd43b');
          }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [width, height, scale, fit, camera, paused]);

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
