export type Gender = 'm' | 'f';

export interface PlayerProfile {
  name: string;
  gender: Gender;
  /** Index into OUTFITS (src/data/player.ts). */
  outfit: number;
}

export const MAX_NAME = 16;
/** Outfits per gender on the character screen (see OUTFITS in src/data/player.ts). */
export const OUTFIT_COUNT = 4;
/** Pre-filled on the character screen: common Kannada names no NPC uses. */
export const DEFAULT_NAMES: Record<Gender, string> = { m: 'Darshan', f: 'Rashmi' };
export const DEFAULT_PROFILE: PlayerProfile = { name: '', gender: 'm', outfit: 0 };

/** Letters, digits, spaces and a little punctuation; collapsed and capped so it fits a speech bubble. */
export const cleanName = (raw: string) =>
  raw
    .replace(/[^\p{L}\p{M}\p{N} .'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME);

const FEMALE_ADDRESS: Array<[RegExp, string]> = [
  [/\bbhaiya\b/gi, 'didi'],
  [/\bbhai\b/gi, 'didi'],
  [/\banna\b/gi, 'akka'],
  [/\b(saar|sir)\b/gi, 'madam'],
  [/\buncle\b/gi, 'aunty'],
  [/\byoung man\b/gi, 'young lady'],
];

const keepCase = (from: string, to: string) => (from[0] === from[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);

/** What people call you: your name, or a friendly default. */
export const addressOf = (p: PlayerProfile) => p.name || (p.gender === 'f' ? 'akka' : 'guru');

/**
 * Fits a line an NPC says *to the player*: fills `{name}` and, for a woman, swaps how she is
 * addressed (anna → akka, saar → madam, bhai → didi…). Not for lines NPCs say to each other.
 */
export function personalise(text: string, p: PlayerProfile): string {
  let out = text.replace(/\{name\}/g, addressOf(p));
  if (p.gender === 'f') for (const [re, to] of FEMALE_ADDRESS) out = out.replace(re, (m) => keepCase(m, to));
  return out;
}
