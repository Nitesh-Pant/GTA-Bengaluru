import { rideDestinations } from '../data/rides';
import { bridge } from '../game/bridge';
import { uiStore, useUi } from '../store/uiStore';
import { PickerPanel } from './PickerPanel';

/** Book a Rapido-style bike taxi to any district (or your marked place). */
export function RidePanel() {
  const panel = useUi((s) => s.panel);
  const destination = useUi((s) => s.destination);
  if (panel !== 'ride') return null;
  return (
    <PickerPanel
      label="Book a bike taxi"
      logo="R"
      logoClass="ride-logo"
      title="Rapido bike taxi"
      subtitle="Captain picks you up from the nearest main road"
      items={rideDestinations(destination)}
      verb="book"
      onChoose={(id) => bridge.api?.bookRide(id)}
      onClose={() => uiStore.set({ panel: null })}
    />
  );
}
