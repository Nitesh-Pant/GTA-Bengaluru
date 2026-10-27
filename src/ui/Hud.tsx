import { useEffect, useState } from 'react';
import { POIS } from '../data/pois';
import { useUi } from '../store/uiStore';
import { Minimap } from './Minimap';

function ControlsHint() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOpen(false), 14000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  const mode = useUi((s) => s.mode);
  if (!open) return <div className="hint-collapsed">Press <kbd>?</kbd> for controls</div>;
  return (
    <div className="controls-hint panel">
      {mode === 'drive' ? (
        <>
          <div><kbd>W</kbd>/<kbd>↑</kbd> accelerate · <kbd>S</kbd>/<kbd>↓</kbd> brake &amp; reverse</div>
          <div><kbd>A</kbd><kbd>D</kbd> steer · <kbd>Space</kbd> handbrake · <kbd>H</kbd> horn</div>
          <div><kbd>E</kbd> get out</div>
        </>
      ) : (
        <>
          <div><kbd>WASD</kbd>/<kbd>Arrows</kbd> walk · <kbd>E</kbd> talk, drive, metro</div>
          <div><kbd>J</kbd> journal · <kbd>M</kbd> map · <kbd>Esc</kbd> pause</div>
        </>
      )}
      <div className="muted">Nothing to complete. Just wander, maga.</div>
    </div>
  );
}

function Toasts() {
  const toasts = useUi((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <div className="toast-title">{t.title}</div>
          {t.body && <div className="toast-body">{t.body}</div>}
        </div>
      ))}
    </div>
  );
}

export function Hud() {
  const area = useUi((s) => s.area);
  const mode = useUi((s) => s.mode);
  const vehicle = useUi((s) => s.vehicleName);
  const raining = useUi((s) => s.raining);
  const eventTitle = useUi((s) => s.eventTitle);
  const discovered = useUi((s) => s.discovered.length);
  const ready = useUi((s) => s.ready);
  const panel = useUi((s) => s.panel);
  if (!ready) return <div className="loading">Painting the city… swalpa wait maadi</div>;
  return (
    <div className="hud" style={{ visibility: panel === 'pause' ? 'hidden' : 'visible' }}>
      <div className="area-card panel">
        <div className="area-name">{area.name}</div>
        <div className="area-tag">{area.tagline}</div>
        <div className="chips">
          <span className={`chip chip-${mode}`}>{mode === 'drive' ? `Driving · ${vehicle}` : mode === 'metro' ? 'On the metro' : 'On foot'}</span>
          {raining && <span className="chip chip-rain">Male! Raining</span>}
          {eventTitle && <span className="chip chip-event">{eventTitle}</span>}
        </div>
      </div>
      <div className="minimap panel">
        <Minimap width={184} height={138} scale={2.6} />
        <div className="minimap-foot">
          <span>
            Places {discovered}/{POIS.length}
          </span>
          <span className="muted">
            <kbd>J</kbd> <kbd>M</kbd>
          </span>
        </div>
      </div>
      <Toasts />
      <ControlsHint />
    </div>
  );
}
