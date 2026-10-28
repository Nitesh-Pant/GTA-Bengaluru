import { bridge, type GuideKind } from '../game/bridge';
import { WALK_SPEED } from '../game/constants';
import { uiStore, useUi } from '../store/uiStore';
import { PickerPanel, type PickerItem } from './PickerPanel';

const WHAT: Record<GuideKind, { name: string; how: string }> = {
  yulu: { name: 'Bike', how: 'press E to ride' },
  auto: { name: 'Auto rickshaw', how: 'drive it, pick up fares' },
  bus: { name: 'BMTC bus stop', how: 'press E at the stop' },
  metro: { name: 'Namma Metro', how: 'press E at the entrance' },
  car: { name: 'Car', how: 'drive it' },
};

const walkTime = (px: number) => {
  const s = px / WALK_SPEED;
  return s < 2 ? 'right here' : s < 60 ? `${Math.max(5, Math.round(s / 5) * 5)} sec walk` : `${Math.round(s / 60)} min walk`;
};

/** Find a ride: the nearest bike, auto, bus stop and metro, each one tap from an arrow pointing the way. */
export function FindPanel() {
  const panel = useUi((s) => s.panel);
  const mode = useUi((s) => s.mode);
  if (panel !== 'find') return null;
  const close = () => uiStore.set({ panel: null });
  const items: PickerItem[] = (bridge.api?.nearestRides() ?? []).map((r) => ({
    id: r.kind,
    name: WHAT[r.kind].name,
    note: `${r.label.replace(/^Bus stop: /, '')} · ${walkTime(r.distance)} · ${WHAT[r.kind].how}`,
  }));
  if (mode === 'walk') items.push({ id: 'rapido', name: 'Rapido bike taxi', note: 'comes to you' });
  return (
    <PickerPanel
      label="Find a ride"
      logo="F"
      logoClass="ride-logo"
      title="Find a ride"
      subtitle="Pick one and red dots show the way"
      items={items}
      verb="show the way"
      onChoose={(id) => {
        close();
        if (id === 'rapido') bridge.api?.openRide();
        else bridge.api?.showNearest(id as GuideKind);
      }}
      onClose={close}
    />
  );
}
