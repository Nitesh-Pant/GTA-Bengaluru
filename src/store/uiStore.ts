import { useSyncExternalStore } from 'react';
import type { Period } from '../logic/dayClock';
import { DEFAULT_PROFILE, type PlayerProfile } from '../logic/player';
import { DEFAULT_SETTINGS, defaultStats, type Settings, type Stats } from '../logic/save';

export interface Toast {
  id: number;
  kind: 'discover' | 'hint' | 'info' | 'arrive' | 'taste' | 'achievement';
  title: string;
  body?: string;
}

export interface DialogueView {
  speaker: string;
  role: string;
  text: string;
  options: string[];
}

export interface MetroView {
  stationId: string;
  stationName: string;
  destinations: Array<{ id: string; name: string; minutes: number }>;
  travelling: string | null;
}

export interface Job {
  label: string;
  secondsLeft?: number;
  /** Shows a ✕ that calls bridge.api.cancelJob(id). */
  cancellable?: boolean;
}

export type Panel = null | 'pause' | 'journal' | 'map' | 'ride' | 'character' | 'bus' | 'tour' | 'find';

export interface UiState {
  phase: 'menu' | 'playing';
  panel: Panel;
  area: { name: string; tagline: string };
  mode: 'walk' | 'drive' | 'metro' | 'ride';
  vehicleName: string | null;
  dialogue: DialogueView | null;
  metro: MetroView | null;
  narration: { title: string; text: string } | null;
  discovered: string[];
  hinted: string[];
  tasted: string[];
  achievements: string[];
  destination: string | null;
  toasts: Toast[];
  settings: Settings;
  stats: Stats;
  player: PlayerProfile;
  clock: { label: string; period: Period; rush: boolean } | null;
  /** The IPL match on tonight, e.g. "RCB vs CSK". */
  match: string | null;
  /** Jobs in progress (a delivery, an auto fare), shown as HUD chips. */
  jobs: Record<string, Job>;
  /** Bus stop whose panel is open. */
  busStop: string | null;
  raining: boolean;
  eventTitle: string | null;
  ready: boolean;
}

const initial = (): UiState => ({
  phase: 'menu',
  panel: null,
  area: { name: '', tagline: '' },
  mode: 'walk',
  vehicleName: null,
  dialogue: null,
  metro: null,
  narration: null,
  discovered: [],
  hinted: [],
  tasted: [],
  achievements: [],
  destination: null,
  toasts: [],
  settings: { ...DEFAULT_SETTINGS },
  stats: defaultStats(),
  player: { ...DEFAULT_PROFILE },
  clock: null,
  jobs: {},
  match: null,
  busStop: null,
  raining: false,
  eventTitle: null,
  ready: false,
});

let state = initial();
const listeners = new Set<() => void>();
let toastId = 1;

export const uiStore = {
  get: () => state,
  set(patch: Partial<UiState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    state = { ...initial(), settings: state.settings };
    listeners.forEach((l) => l());
  },
  /** Add, update or (with null) remove a job chip. */
  setJob(id: string, job: Job | null) {
    const jobs = { ...state.jobs };
    if (job) jobs[id] = job;
    else delete jobs[id];
    uiStore.set({ jobs });
  },
  toast(t: Omit<Toast, 'id'>, ms = 4200) {
    const id = toastId++;
    // At most two on screen so toasts never bury the street.
    uiStore.set({ toasts: [...state.toasts.slice(-1), { ...t, id }] });
    setTimeout(() => uiStore.set({ toasts: state.toasts.filter((x) => x.id !== id) }), ms);
  },
};

/** True while a panel owns input; the world must not move the player. */
export const inputLocked = (s: UiState = state) => !!(s.dialogue || s.metro || s.narration || s.panel);

export function useUi<T>(selector: (s: UiState) => T): T {
  return useSyncExternalStore(uiStore.subscribe, () => selector(state));
}
