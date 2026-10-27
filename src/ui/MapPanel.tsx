import { useEffect, useState } from 'react';
import { bridge } from '../game/bridge';
import { uiStore, useUi } from '../store/uiStore';
import { KIND_COLOUR, Minimap } from './Minimap';

export function MapPanel() {
  const panel = useUi((s) => s.panel);
  const [size, setSize] = useState({ w: 900, h: 600 });
  useEffect(() => {
    const fit = () => {
      const w = Math.min(window.innerWidth - 64, 1100);
      const h = Math.min(window.innerHeight - 160, Math.round(w * 0.75));
      setSize({ w: Math.round(h / 0.75), h });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  if (panel !== 'map') return null;
  const pick = (id: string) => {
    const cur = uiStore.get().destination;
    bridge.api?.setDestination(cur === id ? null : id);
  };
  return (
    <div className="modal-backdrop" onClick={() => uiStore.set({ panel: null })}>
      <div className="map-panel panel" onClick={(e) => e.stopPropagation()}>
        <div className="journal-head">
          <h2>City Map</h2>
          <span className="muted">Click a place to toggle its marker</span>
          <button className="btn" onClick={() => uiStore.set({ panel: null })}>
            Close <kbd>M</kbd>
          </button>
        </div>
        <Minimap width={size.w} height={size.h} onPick={pick} />
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
