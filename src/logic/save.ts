export const SAVE_KEY = 'bsam.save';
export const SAVE_VERSION = 2;

export type ChatterLevel = 'low' | 'normal' | 'high';

export interface Settings {
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  chatter: ChatterLevel;
  showMarkers: boolean;
  screenShake: boolean;
}

export interface Stats {
  chai: number;
  dosa: number;
  metroRides: number;
  drives: number;
}

export interface SaveData {
  version: number;
  discovered: string[];
  hinted: string[];
  settings: Settings;
  stats: Stats;
  /** Last safe on-foot position. Transient states (vehicle, dialogue, metro) are never saved. */
  lastPosition: { x: number; y: number } | null;
  savedAt: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_SETTINGS: Settings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  ambienceVolume: 0.6,
  chatter: 'normal',
  showMarkers: true,
  screenShake: true,
};

export const defaultSave = (): SaveData => ({
  version: SAVE_VERSION,
  discovered: [],
  hinted: [],
  settings: { ...DEFAULT_SETTINGS },
  stats: { chai: 0, dosa: 0, metroRides: 0, drives: 0 },
  lastPosition: null,
  savedAt: 0,
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number, min = -Infinity, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : d;
const ids = (v: unknown, valid: ReadonlySet<string>) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && valid.has(x)))] : [];

/** Accepts anything (corrupt JSON, old versions, hand-edited data) and returns a valid save. */
export function sanitize(raw: unknown, validPoiIds: ReadonlySet<string>): SaveData {
  const d = defaultSave();
  if (!isObj(raw)) return d;
  // v1 stored discoveries under `places`; carry them forward.
  const discoveredRaw = raw.discovered ?? (raw.version === 1 ? raw.places : undefined);
  d.discovered = ids(discoveredRaw, validPoiIds);
  d.hinted = ids(raw.hinted, validPoiIds).filter((id) => !d.discovered.includes(id));
  if (isObj(raw.settings)) {
    const s = raw.settings;
    d.settings = {
      masterVolume: num(s.masterVolume, DEFAULT_SETTINGS.masterVolume, 0, 1),
      sfxVolume: num(s.sfxVolume, DEFAULT_SETTINGS.sfxVolume, 0, 1),
      ambienceVolume: num(s.ambienceVolume, DEFAULT_SETTINGS.ambienceVolume, 0, 1),
      chatter: s.chatter === 'low' || s.chatter === 'high' || s.chatter === 'normal' ? s.chatter : DEFAULT_SETTINGS.chatter,
      showMarkers: typeof s.showMarkers === 'boolean' ? s.showMarkers : DEFAULT_SETTINGS.showMarkers,
      screenShake: typeof s.screenShake === 'boolean' ? s.screenShake : DEFAULT_SETTINGS.screenShake,
    };
  }
  if (isObj(raw.stats)) {
    const s = raw.stats;
    d.stats = {
      chai: Math.floor(num(s.chai, 0, 0)),
      dosa: Math.floor(num(s.dosa, 0, 0)),
      metroRides: Math.floor(num(s.metroRides, 0, 0)),
      drives: Math.floor(num(s.drives, 0, 0)),
    };
  }
  if (isObj(raw.lastPosition)) {
    const x = num(raw.lastPosition.x, NaN);
    const y = num(raw.lastPosition.y, NaN);
    d.lastPosition = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }
  d.savedAt = num(raw.savedAt, 0);
  return d;
}

export function safeStorage(): StorageLike | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    const probe = '__bsam_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function loadSave(storage: StorageLike | null, validPoiIds: ReadonlySet<string>): SaveData {
  if (!storage) return defaultSave();
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return sanitize(JSON.parse(raw), validPoiIds);
  } catch {
    return defaultSave();
  }
}

export function hasSave(storage: StorageLike | null): boolean {
  try {
    return !!storage?.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function writeSave(storage: StorageLike | null, data: SaveData): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(storage: StorageLike | null): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    /* storage unavailable: nothing to clear */
  }
}
