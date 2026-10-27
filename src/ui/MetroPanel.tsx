import { useEffect, useState } from 'react';
import { bridge } from '../game/bridge';
import { useUi } from '../store/uiStore';
import { useMenuKeys } from './useMenuKeys';

export function MetroPanel() {
  const m = useUi((s) => s.metro);
  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [m?.stationId]);
  const count = m && !m.travelling ? m.destinations.length + 1 : 0;
  const choose = (i: number) => {
    if (!m || m.travelling) return;
    if (i >= m.destinations.length) bridge.api?.closeMetro();
    else bridge.api?.travel(m.destinations[i].id);
  };
  useMenuKeys(count, sel, setSel, choose, !!m && !m.travelling);
  if (!m) return null;
  if (m.travelling)
    return (
      <div className="metro-banner panel" role="status">
        <span className="metro-logo">M</span>
        <div>
          <div>
            Next station: <b>{m.travelling}</b>
          </div>
          <div className="muted">Doors closing. Please mind the gap.</div>
        </div>
        <div className="metro-track">
          <span className="metro-train" />
        </div>
      </div>
    );
  return (
    <div className="modal-backdrop">
      <div className="metro panel" role="dialog" aria-label="Metro destinations">
        <div className="metro-head">
          <span className="metro-logo">M</span>
          <div>
            <div className="metro-title">{m.stationName}</div>
            <div className="muted">Purple Line · tap in with QR</div>
          </div>
        </div>
        <p className="muted">Where to?</p>
        <ol className="options">
          {m.destinations.map((d, i) => (
            <li key={d.id}>
              <button className={i === sel ? 'option selected' : 'option'} onMouseEnter={() => setSel(i)} onClick={() => choose(i)}>
                <kbd>{i + 1}</kbd> {d.name} <span className="muted">· ~{d.minutes} sec ride</span>
              </button>
            </li>
          ))}
          <li>
            <button className={sel === m.destinations.length ? 'option selected' : 'option'} onMouseEnter={() => setSel(m.destinations.length)} onClick={() => choose(m.destinations.length)}>
              <kbd>{m.destinations.length + 1}</kbd> Not now (leave station)
            </button>
          </li>
        </ol>
        <div className="panel-foot muted">
          <kbd>Enter</kbd> travel · <kbd>Esc</kbd> cancel
        </div>
      </div>
    </div>
  );
}
