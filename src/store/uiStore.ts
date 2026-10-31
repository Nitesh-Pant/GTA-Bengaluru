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
  /** What the Kannada / Hindi words in `text` mean, if "Word meanings" is on. */
  gloss?: string;
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

/** A job pitched because you walked up to its giver (see JobSystem). */
export interface JobOffer {
  /** Which giver: an NPC id or a vehicle id. */
  id: string;
  kind: 'delivery' | 'fares' | 'quiz';
  title: string;
  who: string;
  body: string;
  cta: string;
  /** A second way to say yes (autos: "Just drive"). */
  alt?: string;
}

export type Panel = null | 'pause' | 'map' | 'ride' | 'character' | 'bus' | 'tour' | 'find' | 'photo' | 'bucket' | 'festival';

export interface UiState {
  phase: 'menu' | 'playing';
  panel: Panel;
  area: { name: string; tagline: string };
  mode: 'walk' | 'drive' | 'metro' | 'ride';
  vehicleName: string | null;
  /** Something in reach to use (talk, ride, order…): phones show the E button only then. */
  canUse: boolean;
  dialogue: DialogueView | null;
  metro: MetroView | null;
  narration: { title: string; text: string } | null;
  discovered: string[];
  hinted: string[];
  tasted: string[];
  /** One-off moments for the bucket list. */
  marks: string[];
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
  jobOffer: JobOffer | null;
  raining: boolean;
  eventTitle: string | null;
  /** Today's festival, if any. */
  festival: string | null;
  /** What it's about and what to do today (the festival card). */
  festivalInfo: { greeting: string; todo: string | null; next: string } | null;
  ready: boolean;
}

const initial = (): UiState => ({
  phase: 'menu',
  panel: null,
  area: { name: '', tagline: '' },
  mode: 'walk',
  vehicleName: null,
  canUse: false,
  dialogue: null,
  metro: null,
  narration: null,
  discovered: [],
  hinted: [],
  tasted: [],
  marks: [],
  destination: null,
  toasts: [],
  settings: { ...DEFAULT_SETTINGS },
  stats: defaultStats(),
  player: { ...DEFAULT_PROFILE },
  clock: null,
  jobs: {},
  match: null,
  busStop: null,
  jobOffer: null,
  raining: false,
  eventTitle: null,
  festival: null,
  festivalInfo: null,
  ready: false,
});

let state = initial();
const queue: Array<{ toast: Toast; ms: number }> = [];

function showToast(t: Toast, ms: number) {
  uiStore.set({ toasts: [...state.toasts, t] });
  setTimeout(() => {
    uiStore.set({ toasts: state.toasts.filter((x) => x.id !== t.id) });
    const next = queue.shift();
    if (next) showToast(next.toast, Math.min(next.ms, 3500));
  }, ms);
}
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
    queue.length = 0;
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
  /** At most two on screen so toasts never bury the street; the rest wait their turn (newest few only). */
  toast(t: Omit<Toast, 'id'>, ms = 4200) {
    const id = toastId++;
    if (state.toasts.length >= 2) {
      queue.push({ toast: { ...t, id }, ms });
      if (queue.length > 4) queue.shift();
      return;
    }
    showToast({ ...t, id }, ms);
  },
};

/** True while a panel owns input; the world must not move the player. */
export const inputLocked = (s: UiState = state) => !!(s.dialogue || s.metro || s.narration || s.panel);

export function useUi<T>(selector: (s: UiState) => T): T {
  return useSyncExternalStore(uiStore.subscribe, () => selector(state));
}
