import { useEffect, useRef, useState } from 'react';
import { POIS } from '../data/pois';
import { bridge } from '../game/bridge';
import { formatDuration, periodLabel } from '../logic/dayClock';
import { isTouchDevice } from '../game/touch';
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
  const showJournal = useUi((s) => s.settings.showJournal);
  // On phones, explain point-to-steer the first time you get into a vehicle.
  const droveOnce = useRef(false);
  useEffect(() => {
    if (mode !== 'drive' || droveOnce.current || !isTouchDevice()) return;
    droveOnce.current = true;
    setOpen(true);
    const id = setTimeout(() => setOpen(false), 9000);
    return () => clearTimeout(id);
  }, [mode]);
  if (isTouchDevice())
    return open ? (
      <div className="controls-hint touch-hint panel" onClick={() => setOpen(false)}>
        {mode === 'drive' ? (
          <div>
            Drag on the left side the way you want to go: the vehicle steers itself there. Push further to go faster. Hold <b>Brake</b> to stop.
          </div>
        ) : (
          <div>
            Drag anywhere on the left side to walk · tap <b>E</b> to talk, drive or ride the metro
          </div>
        )}
        <div className="muted">Nothing to complete. Just wander, maga.</div>
      </div>
    ) : null;
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
          <div><kbd>WASD</kbd>/<kbd>Arrows</kbd> walk · <kbd>E</kbd> talk, drive, metro · <kbd>R</kbd> Rapido</div>
          <div>
            <kbd>F</kbd> find · {showJournal && <><kbd>J</kbd> journal · </>}<kbd>M</kbd> map · <kbd>Esc</kbd> pause
          </div>
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

/** Time, rush hour, rain, jobs and events. Separate so per-second job timers only re-render these chips. */
function StatusChips() {
  const clock = useUi((s) => s.clock);
  const raining = useUi((s) => s.raining);
  const eventTitle = useUi((s) => s.eventTitle);
  const festival = useUi((s) => s.festival);
  const jobs = useUi((s) => s.jobs);
  const match = useUi((s) => s.match);
  return (
    <>
      {clock && <span className={`chip chip-time chip-${clock.period}`}>{periodLabel(clock.period)} · {clock.label}</span>}
      {clock?.rush && <span className="chip chip-rush">Rush hour</span>}
      {raining && <span className="chip chip-rain">Male! Raining</span>}
      {match && <span className="chip chip-match">IPL · {match}</span>}
      {Object.entries(jobs).map(([id, j]) => (
        <span key={id} className="chip chip-job">
          {j.label}
          {j.secondsLeft !== undefined && ` · ${formatDuration(j.secondsLeft)}`}
          {j.cancellable && (
            <button className="chip-x" onClick={() => bridge.api?.cancelJob(id)} aria-label={`Cancel ${j.label}`}>
              ✕
            </button>
          )}
        </span>
      ))}
      {festival && <span className="chip chip-fest">{festival}</span>}
      {eventTitle && <span className="chip chip-event">{eventTitle}</span>}
    </>
  );
}

export function Hud() {
  const area = useUi((s) => s.area);
  const mode = useUi((s) => s.mode);
  const vehicle = useUi((s) => s.vehicleName);
  const discovered = useUi((s) => s.discovered.length);
  const ready = useUi((s) => s.ready);
  const panel = useUi((s) => s.panel);
  const showJournal = useUi((s) => s.settings.showJournal);
  if (!ready) return <div className="loading">Painting the city… swalpa wait maadi</div>;
  // Phones get a smaller minimap so it doesn't eat the screen (and no keyboard hints).
  const phone = isTouchDevice();
  return (
    <div className="hud" style={{ visibility: panel === 'pause' || panel === 'photo' ? 'hidden' : 'visible' }}>
      <div className="area-card panel">
        <div className="area-name">{area.name}</div>
        <div className="area-tag">{area.tagline}</div>
        <div className="chips">
          <span className={`chip chip-${mode}`}>{mode === 'drive' ? `Driving · ${vehicle}` : mode === 'metro' ? 'On the metro' : mode === 'ride' ? `On ${vehicle ?? 'a ride'}` : 'On foot'}</span>
          <StatusChips />
        </div>
      </div>
      <div className="minimap panel">
        <Minimap width={phone ? 124 : 184} height={phone ? 92 : 138} scale={phone ? 2.2 : 2.6} paused={panel === 'map' || panel === 'pause'} />
        <div className="minimap-foot">
          <span>
            Places {discovered}/{POIS.length}
          </span>
          {!phone && (
            <span className="muted">
              {showJournal && <kbd>J</kbd>} <kbd>M</kbd>
            </span>
          )}
        </div>
      </div>
      <Toasts />
      <ControlsHint />
    </div>
  );
}
