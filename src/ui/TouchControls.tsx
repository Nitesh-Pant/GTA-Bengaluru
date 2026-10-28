import { useEffect, useRef } from 'react';
import { bridge } from '../game/bridge';
import { touch } from '../game/touch';
import { inputLocked, uiStore, useUi } from '../store/uiStore';

const RADIUS = 56;
/** How far (0–1 of the radius) the stick must move before a direction counts. */
const DEAD = 0.3;

function release() {
  touch.up = touch.down = touch.left = touch.right = false;
  touch.brake = false;
  touch.stick.x = touch.stick.y = 0;
}

/**
 * A floating stick: touch anywhere in the lower-left of the screen and the pad appears under your
 * thumb, so there is no small circle to hit. Walking reads 8 directions; driving reads the raw angle.
 */
function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const centre = useRef({ x: 0, y: 0 });
  const setKnob = (x: number, y: number) => {
    if (knob.current) knob.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const move = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    let dx = e.clientX - centre.current.x;
    let dy = e.clientY - centre.current.y;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob(dx, dy);
    touch.stick.x = dx / RADIUS;
    touch.stick.y = dy / RADIUS;
    touch.left = dx < -RADIUS * DEAD;
    touch.right = dx > RADIUS * DEAD;
    touch.up = dy < -RADIUS * DEAD;
    touch.down = dy > RADIUS * DEAD;
  };
  const end = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    setKnob(0, 0);
    base.current?.removeAttribute('style'); // back to its resting spot
    base.current?.classList.remove('stick-active');
    release();
  };
  return (
    <div
      className="stick-zone"
      onPointerDown={(e) => {
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        // Centre the pad under the thumb, kept fully on screen.
        const pad = RADIUS + 10;
        const x = Math.max(pad, Math.min(window.innerWidth - pad, e.clientX));
        const y = Math.max(pad, Math.min(window.innerHeight - pad, e.clientY));
        centre.current = { x, y };
        const b = base.current!;
        b.style.left = `${x - pad}px`;
        b.style.top = `${y - pad}px`;
        b.style.bottom = 'auto';
        b.classList.add('stick-active');
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={base} className="stick">
        <div ref={knob} className="stick-knob" />
      </div>
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
      {/* Hidden while a panel is open: panels have their own close buttons, and these would sit on top of them. */}
      {!locked && (
        <div className="touch-menu">
          <button className="touch-small touch-find" onClick={() => uiStore.set({ panel: 'find' })}>
            Find ride
          </button>
          <button className="touch-small" onClick={() => open('map')}>Map</button>
          <button className="touch-small" onClick={() => open('journal')}>Journal</button>
          <button className="touch-small" onClick={pause} aria-label="Pause">
            II
          </button>
        </div>
      )}
      {!locked && mode !== 'metro' && mode !== 'ride' && (
        <>
          <Joystick />
          <div className="touch-actions">
            {mode === 'drive' ? (
              <>
                {/* Small and up out of the way, so a resting thumb never gets out by accident. */}
                <button className="touch-small touch-exit" onClick={() => bridge.api?.interact()}>
                  Get out
                </button>
                <div className="touch-pedals">
                  <button className="touch-btn touch-horn" onClick={() => bridge.api?.horn()}>
                    Horn
                  </button>
                  <HoldButton label="Brake" className="touch-btn touch-brake" onChange={(down) => (touch.brake = down)} />
                </div>
              </>
            ) : (
              <button className="touch-btn touch-e" onClick={() => bridge.api?.interact()}>
                E
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
