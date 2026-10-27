import { useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS, type Settings, type Stats } from '../logic/save';

export interface Toast {
  id: number;
  kind: 'discover' | 'hint' | 'info' | 'arrive';
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

export type Panel = null | 'pause' | 'journal' | 'map';

export interface UiState {
  phase: 'menu' | 'playing';
  panel: Panel;
  area: { name: string; tagline: string };
  mode: 'walk' | 'drive' | 'metro';
  vehicleName: string | null;
  dialogue: DialogueView | null;
  metro: MetroView | null;
  narration: { title: string; text: string } | null;
  discovered: string[];
  hinted: string[];
  destination: string | null;
  toasts: Toast[];
  settings: Settings;
  stats: Stats;
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
  destination: null,
  toasts: [],
  settings: { ...DEFAULT_SETTINGS },
  stats: { chai: 0, dosa: 0, metroRides: 0, drives: 0 },
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
