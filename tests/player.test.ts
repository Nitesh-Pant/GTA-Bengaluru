import { describe, expect, it } from 'vitest';
import { LINE_POOLS } from '../src/data/dialogue';
import { OUTFITS, playerLook } from '../src/data/player';
import { DialogueDirector } from '../src/logic/dialogueDirector';
import { cleanName, DEFAULT_PROFILE, OUTFIT_COUNT, personalise } from '../src/logic/player';
import { sanitize } from '../src/logic/save';

const her = { name: 'Asha', gender: 'f' as const, outfit: 0 };
const him = { name: 'Ravi', gender: 'm' as const, outfit: 0 };

describe('player profile', () => {
  it('cleans names', () => {
    expect(cleanName('  Asha   <b>Rao</b>  ')).toBe('Asha bRaob');
    expect(cleanName('ಅನಿಲ್')).toBe('ಅನಿಲ್');
    expect(cleanName('नितेश')).toBe('नितेश');
    expect(cleanName('x'.repeat(40))).toHaveLength(16);
  });
  it('fills {name}, with a friendly fallback', () => {
    expect(personalise('Banni, {name}!', him)).toBe('Banni, Ravi!');
    expect(personalise('Banni, {name}!', { ...DEFAULT_PROFILE })).toBe('Banni, guru!');
    expect(personalise('Banni, {name}!', { ...her, name: '' })).toBe('Banni, akka!');
  });
  it('addresses a woman as akka / madam / didi, keeping capitals, and leaves men alone', () => {
    expect(personalise('Ayyo! Nodkondu nadi, anna!', her)).toBe('Ayyo! Nodkondu nadi, akka!');
    expect(personalise('Saar, nidhaana!', her)).toBe('Madam, nidhaana!');
    expect(personalise('Bhaiya, thoda side ho jao. Arre bhai!', her)).toBe('Didi, thoda side ho jao. Arre didi!');
    expect(personalise('Uncle, throw maadi please!', her)).toBe('Aunty, throw maadi please!');
    expect(personalise('Young man, in 1990…', her)).toBe('Young lady, in 1990…');
    expect(personalise('Annapoorna and Sirsi stay as they are.', her)).toBe('Annapoorna and Sirsi stay as they are.');
    expect(personalise('Ayyo! Nodkondu nadi, anna!', him)).toBe('Ayyo! Nodkondu nadi, anna!');
  });
  it('men-only lines are never picked for a woman', () => {
    const line = LINE_POOLS.metro.find((l) => l.text.includes('ladies seat'))!;
    const d = new DialogueDirector({ metro: [line] }, { rng: () => 0 });
    const ctx = { area: 'metrohub', raining: false, mode: 'walk' as const };
    expect(d.pick('a', ['metro'], { ...ctx, player: 'f' })).toBeNull();
    expect(d.pick('b', ['metro'], { ...ctx, player: 'm' })?.id).toBe(line.id);
  });
  it('each gender has four outfits, including lungi and saree, and different hair', () => {
    for (const g of ['m', 'f'] as const) {
      expect(OUTFITS[g]).toHaveLength(OUTFIT_COUNT);
      OUTFITS[g].forEach((o, i) => expect(playerLook({ name: '', gender: g, outfit: i }).top).toBe(o.look.top));
    }
    expect(OUTFITS.m.some((o) => o.look.bottomStyle === 'lungi')).toBe(true);
    expect(OUTFITS.f.some((o) => o.look.bottomStyle === 'saree')).toBe(true);
    expect(playerLook(her).hairStyle).toBe('long');
    expect(playerLook(him).hairStyle).toBe('short');
  });
  it('saves keep a clean profile and old saves default to it', () => {
    expect(sanitize({ player: { name: '  Asha!! ', gender: 'f', outfit: 9 } }, new Set()).player).toEqual({ name: 'Asha', gender: 'f', outfit: 3 });
    expect(sanitize({ player: { gender: 'x' } }, new Set()).player).toEqual(DEFAULT_PROFILE);
    expect(sanitize({}, new Set()).player).toEqual(DEFAULT_PROFILE);
  });
});
