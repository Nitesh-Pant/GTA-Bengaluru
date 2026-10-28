import { JOB_INFO, type JobKind } from '../data/jobs';
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

/** Find: the nearest bike, auto, bus stop and metro, and the nearest jobs, each one tap from a route there. */
export function FindPanel() {
  const panel = useUi((s) => s.panel);
  if (panel !== 'find') return null;
  const close = () => uiStore.set({ panel: null });
  const items: PickerItem[] = (bridge.api?.nearestRides() ?? []).map((r) => ({
    id: r.kind,
    name: WHAT[r.kind].name,
    note: `${r.label.replace(/^Bus stop: /, '')} · ${walkTime(r.distance)} · ${WHAT[r.kind].how}`,
  }));
  for (const j of bridge.api?.nearestJobs() ?? [])
    items.push({ id: `job:${j.kind}`, name: `Job: ${JOB_INFO[j.kind].name}`, note: `${j.label} · ${walkTime(j.distance)} · ${JOB_INFO[j.kind].find}` });
  return (
    <PickerPanel
      label="Find rides and jobs"
      logo="F"
      logoClass="ride-logo"
      title="Find rides and jobs"
      subtitle="Pick one and an arrow beside you shows the way"
      items={items}
      verb="show the way"
      onChoose={(id) => {
        close();
        if (id.startsWith('job:')) bridge.api?.showJob(id.slice(4) as JobKind);
        else bridge.api?.showNearest(id as GuideKind);
      }}
      onClose={close}
    />
  );
}
