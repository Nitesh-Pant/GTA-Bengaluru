import { bridge } from '../game/bridge';
import { nextPeriod, periodLabel } from '../logic/dayClock';
import { inputLocked, uiStore, useUi } from '../store/uiStore';


/** Always-visible side buttons: change character, step the time of day, book a bike taxi. */
export function QuickBar() {
  const ready = useUi((s) => s.ready);
  const period = useUi((s) => s.clock?.period ?? 'morning');
  const mode = useUi((s) => s.mode);
  const locked = useUi((s) => inputLocked(s));
  const muted = useUi((s) => s.settings.muted);
  const panel = useUi((s) => s.panel);
  // Stays up during the tour, which points at it.
  if (!ready || (locked && panel !== 'tour')) return null;
  const next = nextPeriod(period);
  const now = periodLabel(period);
  return (
    <div className="quickbar" aria-label="Quick actions">
      <button className="quick" onClick={() => uiStore.set({ panel: 'character' })} title="Change your name, look and outfit" aria-label="Change character">
        <span className="quick-icon">☺</span>
        <span className="quick-label">Character</span>
      </button>
      <button className="quick" onClick={() => bridge.api?.setTime(next.jumpTo)} title={`It's ${now}. Switch to ${next.label}.`} aria-label={`Time: switch to ${next.label}`}>
        <span className="quick-icon">{period === 'night' ? '☾' : '☀'}</span>
        <span className="quick-label">
          {now} → {next.label}
        </span>
      </button>
      <button className="quick" onClick={() => bridge.api?.updateSettings({ muted: !muted })} title={muted ? 'Sound is off. Turn it on.' : 'Mute all sound'} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>
        <span className="quick-icon">{muted ? '✕' : '♪'}</span>
        <span className="quick-label">{muted ? 'Sound off' : 'Sound on'}</span>
      </button>
      <button className="quick" onClick={() => uiStore.set({ panel: 'tour' })} title="How to play: a quick tour" aria-label="Hints">
        <span className="quick-icon">?</span>
        <span className="quick-label">Hints</span>
      </button>
      {mode === 'walk' && (
        <button className="quick" onClick={() => bridge.api?.openRide()} title="Book a Rapido bike taxi (R)" aria-label="Ride">
          <span className="quick-icon">R</span>
          <span className="quick-label">Ride</span>
        </button>
      )}
    </div>
  );
}
