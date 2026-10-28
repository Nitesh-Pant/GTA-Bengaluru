import { busStopById, BUS_STOPS } from '../data/transit';
import { bridge } from '../game/bridge';
import { CITY_W } from '../game/constants';
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
      subtitle={here.x >= CITY_W ? 'KSRTC stop · the Nandi Hills Express back to the city' : 'BMTC bus stop · buses run "every few minutes"'}
      items={BUS_STOPS.filter((b) => b.id !== here.id).map((b) => ({ ...b, note: b.x >= CITY_W || here.x >= CITY_W ? 'KSRTC, out of town' : undefined }))}
      verb="board"
      onChoose={(id) => bridge.api?.takeBus(id)}
      onClose={() => uiStore.set({ panel: null, busStop: null })}
    />
  );
}
