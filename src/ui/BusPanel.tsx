import { busStopById, BUS_STOPS } from '../data/transit';
import { bridge } from '../game/bridge';
import { uiStore, useUi } from '../store/uiStore';
import { PickerPanel } from './PickerPanel';

/** At a bus stop: pick where the next bus should take you (KSRTC for trips out of town). */
export function BusPanel() {
  const panel = useUi((s) => s.panel);
  const here = busStopById(useUi((s) => s.busStop));
  if (panel !== 'bus' || !here) return null;
  return (
    <PickerPanel
      key={here.id}
      label="BMTC bus stop"
      logo="B"
      logoClass="bus-logo"
      title={here.name}
      subtitle={here.line ? `${here.line.name} · back to the city` : 'BMTC bus stop · buses run "every few minutes"'}
      items={BUS_STOPS.filter((b) => b.id !== here.id).map((b) => ({ ...b, note: (b.line ?? here.line)?.name }))}
      verb="board"
      onChoose={(id) => bridge.api?.takeBus(id)}
      onClose={() => uiStore.set({ panel: null, busStop: null })}
    />
  );
}
