import { useEffect, useRef, useState } from 'react';
import { districtCentre, DISTRICTS } from '../data/map';
import { POIS } from '../data/pois';
import { bridge } from '../game/bridge';
import { visibilityOf } from '../logic/discovery';
import { MAP_H, MAP_W, TILE } from '../game/constants';
import { uiStore, useUi } from '../store/uiStore';
import { KIND_COLOUR, mapView, Minimap, type MapCamera } from './Minimap';

const MAX_ZOOM = 6;

interface SearchHit {
  /** Ride id: `p:<poi>` or `d:<district>`. */
  id: string;
  poi: string | null;
  name: string;
  note: string;
  x: number;
  y: number;
}

/** Places and areas whose name matches; hidden spots only once you know about them. */
function search(query: string, discovered: string[], hinted: string[]): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const state = { discovered, hinted };
  const places: SearchHit[] = POIS.filter((p) => visibilityOf(state, p) !== 'secret' && p.name.toLowerCase().includes(q)).map((p) => ({
    id: `p:${p.id}`,
    poi: p.id,
    name: p.name,
    note: DISTRICTS.find((d) => d.id === p.district)?.name ?? '',
    x: p.x / TILE,
    y: p.y / TILE,
  }));
  const areas: SearchHit[] = DISTRICTS.filter((d) => d.name.toLowerCase().includes(q)).map((d) => ({
    id: `d:${d.id}`,
    poi: null,
    name: d.name,
    note: 'Area',
    ...districtCentre(d),
  }));
  return [...areas, ...places].slice(0, 6);
}
const clampZoom = (z: number) => Math.max(1, Math.min(MAX_ZOOM, z));

export function MapPanel() {
  const panel = useUi((s) => s.panel);
  const discovered = useUi((s) => s.discovered);
  const hinted = useUi((s) => s.hinted);
  const mode = useUi((s) => s.mode);
  const [query, setQuery] = useState('');
  const [size, setSize] = useState({ w: 900, h: 600 });
  const cam = useRef<MapCamera>({ zoom: 1, x: MAP_W / 2, y: MAP_H / 2 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef({ moved: 0, pinch: 0 });
  useEffect(() => {
    const fit = () => {
      const w = Math.min(window.innerWidth - 64, 1100);
      const h = Math.min(window.innerHeight - 170, Math.round(w * 0.75));
      setSize({ w: Math.round(Math.min(w, h / 0.75)), h });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  // Open zoomed in a little on where you are.
  useEffect(() => {
    if (panel !== 'map') return;
    const snap = bridge.api?.snapshot();
    cam.current = { zoom: 2, x: snap ? snap.x / TILE : MAP_W / 2, y: snap ? snap.y / TILE : MAP_H / 2 };
    setQuery('');
  }, [panel]);
  if (panel !== 'map') return null;

  /** Zoom by `factor`, keeping the tile under (px, py) in place. */
  const zoomAt = (factor: number, px = size.w / 2, py = size.h / 2) => {
    const before = mapView(size.w, size.h, cam.current);
    const tx = before.ox + px / before.s;
    const ty = before.oy + py / before.s;
    const zoom = clampZoom(cam.current.zoom * factor);
    const after = mapView(size.w, size.h, { ...cam.current, zoom });
    // Re-centre so (tx, ty) stays under the pointer.
    const vw = size.w / after.s;
    const vh = size.h / after.s;
    cam.current = { zoom, x: tx - px / after.s + vw / 2, y: ty - py / after.s + vh / 2 };
  };
  const panBy = (dx: number, dy: number) => {
    const v = mapView(size.w, size.h, cam.current);
    const vw = size.w / v.s;
    const vh = size.h / v.s;
    // Start from the clamped view so panning never has to "unwind" past an edge.
    cam.current = { ...cam.current, x: v.ox + vw / 2 - dx / v.s, y: v.oy + vh / 2 - dy / v.s };
  };
  const local = (e: React.PointerEvent | React.WheelEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const pick = (id: string) => {
    if (drag.current.moved > 6) return; // that was a drag, not a click
    const cur = uiStore.get().destination;
    bridge.api?.setDestination(cur === id ? null : id);
  };
  const hits = search(query, discovered, hinted);
  const goTo = (h: SearchHit) => {
    cam.current = { zoom: Math.max(cam.current.zoom, 3), x: h.x, y: h.y };
    if (h.poi) bridge.api?.setDestination(h.poi);
  };
  const rideTo = (h: SearchHit) => {
    if (h.poi) bridge.api?.setDestination(h.poi);
    uiStore.set({ panel: null });
    bridge.api?.bookRide(h.id);
  };
  const me = () => {
    const snap = bridge.api?.snapshot();
    if (snap) cam.current = { zoom: Math.max(cam.current.zoom, 3), x: snap.x / TILE, y: snap.y / TILE };
  };
  return (
    <div className="modal-backdrop" onClick={() => uiStore.set({ panel: null })}>
      <div className="map-panel panel" onClick={(e) => e.stopPropagation()}>
        <div className="journal-head">
          <h2>City Map</h2>
          <span className="muted">Drag to move · scroll or pinch to zoom · click a place to mark it</span>
          <button className="btn" onClick={() => uiStore.set({ panel: null })}>
            Close <kbd>M</kbd>
          </button>
        </div>
        <div className="map-search">
          <input
            type="search"
            value={query}
            placeholder="Search a place or area: Koramangala, Toit, Cubbon Park…"
            aria-label="Search the map"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Typing "m" or "j" must not close the map; Esc still does.
              if (e.key !== 'Escape') e.stopPropagation();
              if (e.key === 'Enter' && hits[0]) goTo(hits[0]);
            }}
          />
          {hits.length > 0 && (
            <ul className="map-results">
              {hits.map((h) => (
                <li key={h.id}>
                  <button className="map-hit" onClick={() => goTo(h)}>
                    <b>{h.name}</b> <span className="muted">· {h.note}</span>
                  </button>
                  <button className="btn" disabled={mode !== 'walk'} title={mode === 'walk' ? 'Book a Rapido there' : 'Get out of the vehicle first'} onClick={() => rideTo(h)}>
                    Ride
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim() && hits.length === 0 && <div className="muted map-none">No place called that yet. Maybe it's a secret?</div>}
        </div>
        <div
          className="map-view"
          style={{ width: size.w, height: size.h }}
          onWheel={(e) => {
            const p = local(e);
            zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y);
          }}
          onPointerDown={(e) => {
            pointers.current.set(e.pointerId, local(e));
            if (pointers.current.size === 1) drag.current = { moved: 0, pinch: 0 };
          }}
          onPointerMove={(e) => {
            const prev = pointers.current.get(e.pointerId);
            if (!prev) return;
            const p = local(e);
            pointers.current.set(e.pointerId, p);
            if (pointers.current.size >= 2) {
              // Pinch: zoom by the change in finger spread, around their midpoint.
              const [a, b] = [...pointers.current.values()];
              const spread = Math.hypot(a.x - b.x, a.y - b.y);
              if (drag.current.pinch) zoomAt(spread / drag.current.pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
              drag.current = { moved: 99, pinch: spread };
              return;
            }
            drag.current.moved += Math.hypot(p.x - prev.x, p.y - prev.y);
            if (drag.current.moved > 6) {
              e.currentTarget.setPointerCapture(e.pointerId);
              panBy(p.x - prev.x, p.y - prev.y);
            }
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            if (pointers.current.size < 2) drag.current.pinch = 0;
          }}
          onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
        >
          <Minimap width={size.w} height={size.h} camera={cam} onPick={pick} />
          <div className="map-zoom">
            <button className="btn" aria-label="Zoom in" onClick={() => zoomAt(1.5)}>
              +
            </button>
            <button className="btn" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.5)}>
              −
            </button>
            <button className="btn" onClick={me}>
              Me
            </button>
            <button className="btn" onClick={() => (cam.current = { zoom: 1, x: MAP_W / 2, y: MAP_H / 2 })}>
              Whole city
            </button>
          </div>
        </div>
        <div className="legend">
          {Object.entries(KIND_COLOUR).map(([k, c]) => (
            <span key={k}>
              <i style={{ background: c }} /> {k}
            </span>
          ))}
          <span>? not yet visited</span>
          <span>
            <i style={{ background: '#fcc419' }} /> rideable
          </span>
        </div>
      </div>
    </div>
  );
}
