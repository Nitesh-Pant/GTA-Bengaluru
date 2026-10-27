import { describe, expect, it } from 'vitest';
import { clearSave, DEFAULT_SETTINGS, defaultSave, loadSave, sanitize, SAVE_KEY, SAVE_VERSION, writeSave, type StorageLike } from '../src/logic/save';

const ids = new Set(['a', 'b', 'c']);
const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};

describe('saving', () => {
  it('round-trips progress and settings', () => {
    const s = memory();
    const save = { ...defaultSave(), discovered: ['a'], hinted: ['b'], settings: { ...DEFAULT_SETTINGS, chatter: 'low' as const }, lastPosition: { x: 5, y: 6 } };
    expect(writeSave(s, save)).toBe(true);
    const loaded = loadSave(s, ids);
    expect(loaded.discovered).toEqual(['a']);
    expect(loaded.hinted).toEqual(['b']);
    expect(loaded.settings.chatter).toBe('low');
    expect(loaded.lastPosition).toEqual({ x: 5, y: 6 });
    expect(loaded.version).toBe(SAVE_VERSION);
  });
  it('falls back to defaults on corrupt JSON', () => {
    const s = memory();
    s.setItem(SAVE_KEY, '{oops');
    expect(loadSave(s, ids)).toEqual(defaultSave());
  });
  it('sanitises wrong types, unknown places and out-of-range values', () => {
    const d = sanitize({ discovered: ['a', 'zzz', 3, 'a'], hinted: 'nope', settings: { masterVolume: 9, chatter: 'loud' }, stats: { chai: -4 }, lastPosition: { x: 'x' } }, ids);
    expect(d.discovered).toEqual(['a']);
    expect(d.hinted).toEqual([]);
    expect(d.settings.masterVolume).toBe(1);
    expect(d.settings.chatter).toBe('normal');
    expect(d.stats.chai).toBe(0);
    expect(d.lastPosition).toBeNull();
  });
  it('migrates version 1 saves', () => {
    expect(sanitize({ version: 1, places: ['b', 'c'] }, ids).discovered).toEqual(['b', 'c']);
  });
  it('a hinted place that was discovered is not also hinted', () => {
    expect(sanitize({ discovered: ['a'], hinted: ['a', 'b'] }, ids).hinted).toEqual(['b']);
  });
  it('survives storage being unavailable or throwing', () => {
    expect(loadSave(null, ids)).toEqual(defaultSave());
    expect(writeSave(null, defaultSave())).toBe(false);
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(loadSave(throwing, ids)).toEqual(defaultSave());
    expect(writeSave(throwing, defaultSave())).toBe(false);
    expect(() => clearSave(throwing)).not.toThrow();
  });
  it('reset clears saved state', () => {
    const s = memory();
    writeSave(s, { ...defaultSave(), discovered: ['a'] });
    clearSave(s);
    expect(s.getItem(SAVE_KEY)).toBeNull();
    expect(loadSave(s, ids).discovered).toEqual([]);
  });
});
