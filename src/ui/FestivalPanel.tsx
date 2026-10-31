import { bridge } from '../game/bridge';
import { uiStore, useUi } from '../store/uiStore';

/** Tap the festival chip: what today is about and what to do, with "Show me" for the host and a skip to the next one. */
export function FestivalPanel() {
  const panel = useUi((s) => s.panel);
  const name = useUi((s) => s.festival);
  const info = useUi((s) => s.festivalInfo);
  if (panel !== 'festival' || !name || !info) return null;
  const close = () => uiStore.set({ panel: null });
  return (
    <div className="modal-backdrop bucket-backdrop" onClick={close}>
      <div className="festival-card panel" role="dialog" aria-label={`Today: ${name}`} onClick={(e) => e.stopPropagation()}>
        <div className="festival-title">Today: {name}</div>
        <p>{info.greeting}</p>
        {info.todo && (
          <p className="festival-todo">
            <b>What to do:</b> {info.todo}
          </p>
        )}
        <div className="job-offer-actions">
          {info.todo && (
            <button
              className="btn btn-primary"
              onClick={() => {
                close();
                bridge.api?.showFestival();
              }}
            >
              Show me
            </button>
          )}
          <button
            className="btn"
            title="Skip to the next festival"
            onClick={() => {
              close();
              bridge.api?.nextFestival();
            }}
          >
            Next: {info.next} →
          </button>
          <button className="btn" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
