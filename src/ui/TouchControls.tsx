import { useEffect, useRef } from 'react';
import { bridge } from '../game/bridge';
import { touch } from '../game/touch';
import { inputLocked, uiStore, useUi } from '../store/uiStore';

const RADIUS = 46;
/** How far (0–1 of the radius) the stick must move before a direction counts. */
const DEAD = 0.35;

function release() {
  touch.up = touch.down = touch.left = touch.right = false;
  touch.brake = false;
}

/** Drag anywhere on the pad to walk or steer: an 8-way virtual stick. */
function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const knob = useRef<HTMLDivElement>(null);
  const setKnob = (x: number, y: number) => {
    if (knob.current) knob.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const move = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    const r = base.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob(dx, dy);
    touch.left = dx < -RADIUS * DEAD;
    touch.right = dx > RADIUS * DEAD;
    touch.up = dy < -RADIUS * DEAD;
    touch.down = dy > RADIUS * DEAD;
  };
  const end = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    setKnob(0, 0);
    release();
  };
  return (
    <div
      ref={base}
      className="stick"
      onPointerDown={(e) => {
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="stick-knob" />
    </div>
  );
}

/** A button that stays "down" while a finger is on it (handbrake). */
function HoldButton({ label, onChange, className }: { label: string; onChange: (down: boolean) => void; className: string }) {
  return (
    <button
      className={className}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange(true);
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
    >
      {label}
    </button>
  );
}

/** On-screen controls for phones and tablets. Panels (dialogue, metro, journal) are already tappable. */
export function TouchControls() {
  const mode = useUi((s) => s.mode);
  const locked = useUi((s) => inputLocked(s));
  const ready = useUi((s) => s.ready);
  // A panel opening or the mode changing unmounts the stick mid-drag: never leave a direction held.
  useEffect(release, [locked, mode]);
  useEffect(() => release, []);
  if (!ready) return null;
  const open = (panel: 'journal' | 'map') => uiStore.set({ panel: uiStore.get().panel === panel ? null : panel });
  const pause = () => {
    uiStore.set({ panel: 'pause' });
    bridge.api?.setPaused(true);
  };
  return (
    <div className="touch" aria-label="Touch controls">
      <div className="touch-menu">
        <button className="touch-small" onClick={() => open('map')}>Map</button>
        <button className="touch-small" onClick={() => open('journal')}>Journal</button>
        <button className="touch-small" onClick={pause} aria-label="Pause">
          II
        </button>
      </div>
      {!locked && mode !== 'metro' && mode !== 'ride' && (
        <>
          <Joystick />
          <div className="touch-actions">
            {mode === 'drive' && (
              <>
                <button className="touch-btn touch-horn" onClick={() => bridge.api?.horn()}>
                  Horn
                </button>
                <HoldButton label="Brake" className="touch-btn touch-brake" onChange={(down) => (touch.brake = down)} />
              </>
            )}
            <button className="touch-btn touch-e" onClick={() => bridge.api?.interact()}>
              {mode === 'drive' ? 'Exit' : 'E'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
