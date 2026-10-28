import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONVERSATIONS } from '../src/data/conversations';
import { LINE_POOLS } from '../src/data/dialogue';
import { LOOKS } from '../src/data/looks';
import { NPCS } from '../src/data/npcs';
import { VOICE_FILES, VOICE_POOLS, voiceOfLook, type VoiceClip } from '../src/data/voices';
import { VoiceDirector } from '../src/logic/voiceDirector';

describe('voice data', () => {
  it('every voice pool is a dialogue pool (or banter) and every file exists', () => {
    const special = (pool: string) => pool === 'banter' || pool === 'argument' || pool.startsWith('talk:') || pool.startsWith('announce:');
    for (const pool of Object.keys(VOICE_POOLS)) expect(special(pool) || pool in LINE_POOLS, pool).toBe(true);
    for (const pool of Object.keys(VOICE_POOLS)) if (pool.startsWith('talk:')) expect(pool.slice(5) in CONVERSATIONS, pool).toBe(true);
    for (const f of VOICE_FILES) expect(existsSync(`public/audio/voice/${f}`), f).toBe(true);
  });
  it('voices follow the look presets', () => {
    expect(voiceOfLook('aunty2')).toBe('f');
    expect(voiceOfLook('ajji')).toBe('f');
    expect(voiceOfLook('techie_f2')).toBe('f');
    expect(voiceOfLook('vendor_f')).toBe('f');
    expect(voiceOfLook('kid3')).toBe('kid');
    expect(voiceOfLook('techie_m2')).toBe('m');
    expect(voiceOfLook('uncle_veshti')).toBe('m');
    for (const look of Object.keys(LOOKS)) expect(['m', 'f', 'kid']).toContain(voiceOfLook(look));
  });
  it('every NPC-category clip has at least one NPC who can say it', () => {
    const reactionPools = new Set(['bump', 'vehicle_near', 'block_ped', 'block_vehicle', 'block_vehicle_long', 'queue', 'food_visit', 'rain_start', 'banter', 'argument', 'cricket_ball', 'cricket_thanks']);
    for (const [pool, clips] of Object.entries(VOICE_POOLS)) {
      if (reactionPools.has(pool) || pool.includes(':')) continue;
      for (const c of clips) expect(NPCS.some((n) => n.categories.includes(pool) && (!c.voice || voiceOfLook(n.look) === c.voice)), `${pool}/${c.file}`).toBe(true);
    }
  });
});

describe('VoiceDirector', () => {
  const a: VoiceClip = { file: 'a.mp3', voice: 'm' };
  const b: VoiceClip = { file: 'b.mp3', voice: 'f' };
  const always = () => 0;

  it('only picks clips that match the speaker voice', () => {
    const d = new VoiceDirector({ p: [a, b] }, always, { chance: 1 });
    expect(d.pick('p', 'f', 0)).toBe(b);
    expect(d.pick('p', 'kid', 0)).toBeNull();
    expect(d.pick('missing', 'm', 0)).toBeNull();
  });
  it('plays one clip at a time with a gap, and rests a clip after it plays', () => {
    const d = new VoiceDirector({ p: [a] }, always, { chance: 1, gapMs: 1000, clipCooldownMs: 10000 });
    d.markPlayed(a, 0, 2000);
    expect(d.pick('p', 'm', 2500)).toBeNull(); // still in the gap
    expect(d.pick('p', 'm', 5000)).toBeNull(); // clip resting
    expect(d.pick('p', 'm', 10000)).toBe(a);
  });
  it('forced clips (announcements) skip the chance roll and the wait, and voiceless clips fit everyone', () => {
    const crowd: VoiceClip = { file: 'crowd.mp3' };
    const d = new VoiceDirector({ p: [crowd] }, () => 0.99, { chance: 0.1 });
    d.markPlayed(crowd, 0, 5000);
    expect(d.pick('p', 'f', 100)).toBeNull();
    expect(d.pick('p', 'f', 100, true)).toBe(crowd);
    expect(d.pick('p', 'kid', 100, true)).toBe(crowd);
  });
  it('leaves most lines silent when chance is low', () => {
    const d = new VoiceDirector({ p: [a] }, () => 0.9, { chance: 0.5 });
    expect(d.pick('p', 'm', 0)).toBeNull();
  });
});
