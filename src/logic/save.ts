import { START_MINUTES } from './dayClock';
import { cleanName, DEFAULT_PROFILE, OUTFIT_COUNT, type PlayerProfile } from './player';

export const SAVE_KEY = 'bsam.save';
export const SAVE_VERSION = 2;

export type ChatterLevel = 'low' | 'normal' | 'high';

export interface Settings {
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  voiceVolume: number;
  musicVolume: number;
  /** Silences everything without losing the volume levels. */
  muted: boolean;
  chatter: ChatterLevel;
  showMarkers: boolean;
  /** Red dots along the road to the active marker. */
  showRoute: boolean;
  /** Meanings of Kannada and Hindi words under speech. */
  glosses: boolean;
  /** The Journal (places, food book, achievements): hidden unless switched on. */
  showJournal: boolean;
  screenShake: boolean;
}

export interface Stats {
  chai: number;
  dosa: number;
  metroRides: number;
  drives: number;
  honks: number;
  /** Cricket balls thrown back to the kids. */
  throws: number;
  /** Times the player said hello to a cow (Gowri, Lakshmi or Ganga). */
  cow: number;
  /** Tech questions answered correctly. */
  quiz: number;
  /** Bike-taxi rides taken. */
  rides: number;
  /** Food deliveries completed on time. */
  deliveries: number;
  /** Sunrises watched from Nandi Hills. */
  sunrises: number;
  /** Snacks snatched by Nandi Hills monkeys. */
  monkeyTax: number;
  /** Times you drove through Silk Board junction. */
  silkboard: number;
  /** Festival days lived through. */
  festivals: number;
  /** Times the traffic police pulled you over. */
  challans: number;
  /** Times you talked your way out of a challan. */
  letOff: number;
  /** Rupees paid in fines. */
  fines: number;
  /** Street dogs given a biscuit. */
  dogsFed: number;
  /** Auto passengers dropped, and what they paid. */
  fares: number;
  rupees: number;
  busRides: number;
}

export const STAT_KEYS = ['chai', 'dosa', 'metroRides', 'drives', 'honks', 'throws', 'cow', 'quiz', 'rides', 'deliveries', 'dogsFed', 'fares', 'rupees', 'busRides', 'sunrises', 'monkeyTax', 'silkboard', 'festivals', 'challans', 'letOff', 'fines'] as const satisfies ReadonlyArray<keyof Stats>;

export const defaultStats = (): Stats => Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as unknown as Stats;

export interface SaveData {
  version: number;
  discovered: string[];
  hinted: string[];
  /** Dish ids from the food book. */
  tasted: string[];
  /** Unlocked achievement ids. */
  achievements: string[];
  player: PlayerProfile;
  /** Time of day in game minutes since midnight. */
  timeOfDay: number;
  /** Game days since you arrived (festivals follow it). */
  day: number;
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
  voiceVolume: 0.8,
  musicVolume: 0.5,
  muted: false,
  chatter: 'normal',
  showMarkers: true,
  showRoute: true,
  glosses: true,
  showJournal: false,
  screenShake: true,
};

export const defaultSave = (): SaveData => ({
  version: SAVE_VERSION,
  discovered: [],
  hinted: [],
  tasted: [],
  achievements: [],
  player: { ...DEFAULT_PROFILE },
  timeOfDay: START_MINUTES,
  day: 0,
  settings: { ...DEFAULT_SETTINGS },
  stats: defaultStats(),
  lastPosition: null,
  savedAt: 0,
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number, min = -Infinity, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : d;
const ids = (v: unknown, valid: ReadonlySet<string>) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && valid.has(x)))] : [];

/** Ids the save may hold; anything else is dropped on load. Dishes and achievements default to none. */
export interface ValidIds {
  dishes?: ReadonlySet<string>;
  achievements?: ReadonlySet<string>;
}

/** Accepts anything (corrupt JSON, old versions, hand-edited data) and returns a valid save. */
export function sanitize(raw: unknown, validPoiIds: ReadonlySet<string>, valid: ValidIds = {}): SaveData {
  const d = defaultSave();
  if (!isObj(raw)) return d;
  // v1 stored discoveries under `places`; carry them forward.
  const discoveredRaw = raw.discovered ?? (raw.version === 1 ? raw.places : undefined);
  d.discovered = ids(discoveredRaw, validPoiIds);
  d.hinted = ids(raw.hinted, validPoiIds).filter((id) => !d.discovered.includes(id));
  d.tasted = ids(raw.tasted, valid.dishes ?? new Set());
  d.achievements = ids(raw.achievements, valid.achievements ?? new Set());
  if (isObj(raw.player)) {
    const p = raw.player;
    d.player = {
      name: typeof p.name === 'string' ? cleanName(p.name) : '',
      gender: p.gender === 'f' ? 'f' : 'm',
      outfit: Math.floor(num(p.outfit, 0, 0, OUTFIT_COUNT - 1)),
    };
  }
  if (isObj(raw.settings)) {
    const s = raw.settings;
    d.settings = {
      masterVolume: num(s.masterVolume, DEFAULT_SETTINGS.masterVolume, 0, 1),
      sfxVolume: num(s.sfxVolume, DEFAULT_SETTINGS.sfxVolume, 0, 1),
      ambienceVolume: num(s.ambienceVolume, DEFAULT_SETTINGS.ambienceVolume, 0, 1),
      voiceVolume: num(s.voiceVolume, DEFAULT_SETTINGS.voiceVolume, 0, 1),
      musicVolume: num(s.musicVolume, DEFAULT_SETTINGS.musicVolume, 0, 1),
      muted: typeof s.muted === 'boolean' ? s.muted : DEFAULT_SETTINGS.muted,
      chatter: s.chatter === 'low' || s.chatter === 'high' || s.chatter === 'normal' ? s.chatter : DEFAULT_SETTINGS.chatter,
      showMarkers: typeof s.showMarkers === 'boolean' ? s.showMarkers : DEFAULT_SETTINGS.showMarkers,
      showRoute: typeof s.showRoute === 'boolean' ? s.showRoute : DEFAULT_SETTINGS.showRoute,
      glosses: typeof s.glosses === 'boolean' ? s.glosses : DEFAULT_SETTINGS.glosses,
      showJournal: typeof s.showJournal === 'boolean' ? s.showJournal : DEFAULT_SETTINGS.showJournal,
      screenShake: typeof s.screenShake === 'boolean' ? s.screenShake : DEFAULT_SETTINGS.screenShake,
    };
  }
  if (isObj(raw.stats)) {
    const s = raw.stats;
    for (const k of STAT_KEYS) d.stats[k] = Math.floor(num(s[k], 0, 0));
  }
  if (isObj(raw.lastPosition)) {
    const x = num(raw.lastPosition.x, NaN);
    const y = num(raw.lastPosition.y, NaN);
    d.lastPosition = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }
  d.timeOfDay = num(raw.timeOfDay, START_MINUTES, 0, 1439);
  d.day = Math.floor(num(raw.day, 0, 0, 1e6));
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

export function loadSave(storage: StorageLike | null, validPoiIds: ReadonlySet<string>, valid: ValidIds = {}): SaveData {
  if (!storage) return defaultSave();
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return sanitize(JSON.parse(raw), validPoiIds, valid);
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
