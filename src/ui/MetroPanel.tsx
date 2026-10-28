import { bridge } from '../game/bridge';
import { useUi } from '../store/uiStore';
import { PickerPanel } from './PickerPanel';

export function MetroPanel() {
  const m = useUi((s) => s.metro);
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
    <PickerPanel
      key={m.stationId}
      label="Metro destinations"
      logo="M"
      title={m.stationName}
      subtitle="Purple Line · tap in with QR"
      prompt="Where to?"
      items={m.destinations.map((d) => ({ id: d.id, name: d.name, note: `~${d.minutes} sec ride` }))}
      closeLabel="Not now (leave station)"
      verb="travel"
      closeOnBackdrop={false}
      onChoose={(id) => bridge.api?.travel(id)}
      onClose={() => bridge.api?.closeMetro()}
    />
  );
}
