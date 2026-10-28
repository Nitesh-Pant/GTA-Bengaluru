import type { TrafficType } from '../data/roads';
import { VOICE_FILES } from '../data/voices';
import type { Settings } from '../logic/save';

/**
 * Tiny sound engine. Horns, engines, rain, chimes and the background music are procedural; the only
 * files are the short recorded voice barks in public/audio/voice, fetched once in the background.
 * Created on the first user gesture (the Start button) so browsers allow playback.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private amb!: GainNode;
  private voices!: GainNode;
  private music!: GainNode;
  /** What the soothing ambience should play: set by the world as you move and as time passes. */
  private nature = { birds: false, crickets: false, bell: false, festival: false };
  /** Decoded voice clips; null while loading or if the file failed. */
  private clips = new Map<string, AudioBuffer | null>();
  private rainGain!: GainNode;
  private engineOsc: OscillatorNode | null = null;
  private engineGain!: GainNode;
  private noise!: AudioBuffer;

  init(settings: Settings) {
    if (this.ctx) {
      void this.ctx.resume();
      this.apply(settings);
      this.startLoops();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      return;
    }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.connect(c.destination);
    this.sfx = c.createGain();
    this.sfx.connect(this.master);
    this.amb = c.createGain();
    this.amb.connect(this.master);
    this.voices = c.createGain();
    this.voices.connect(this.master);
    this.music = c.createGain();
    this.music.connect(this.master);
    this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      // Brown-ish noise for a low city rumble
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    // City hum
    const hum = c.createBufferSource();
    hum.buffer = this.noise;
    hum.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const humGain = c.createGain();
    humGain.gain.value = 0.35;
    hum.connect(lp).connect(humGain).connect(this.amb);
    hum.start();
    // Rain bed (white-ish noise, band-passed), silent until it rains
    const white = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const wd = white.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    const rain = c.createBufferSource();
    rain.buffer = white;
    rain.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 0.6;
    this.rainGain = c.createGain();
    this.rainGain.gain.value = 0;
    rain.connect(bp).connect(this.rainGain).connect(this.amb);
    rain.start();
    // Engine
    this.engineGain = c.createGain();
    this.engineGain.gain.value = 0;
    this.engineGain.connect(this.sfx);
    this.apply(settings);
    this.loadVoices();
    this.startMusic();
    this.startLoops();
  }

  /** Two quick "woof"s: a filtered noise burst with a falling pitch. */
  bark(volume: number, pan = 0) {
    if (!this.ctx || this.silent || volume < 0.03) return;
    const c = this.ctx;
    for (const when of [0, 0.22]) {
      const t = c.currentTime + when;
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(420, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.12);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09 * volume, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.14);
      const p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      o.connect(lp).connect(g).connect(p).connect(this.sfx);
      o.start(t);
      o.stop(t + 0.16);
    }
  }

  /** A hoarse "caw". */
  caw(volume: number, pan = 0) {
    if (!this.ctx || this.silent || volume < 0.03) return;
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(760, t);
    o.frequency.linearRampToValueAtTime(560, t + 0.22);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 2;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05 * volume, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.25);
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    o.connect(bp).connect(g).connect(p).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.27);
  }

  /** One cycle (about 1.3 s) of a siren: police "wee-woo", ambulance rising wail. */
  siren(kind: 'police' | 'ambulance', volume: number, pan = 0) {
    if (!this.ctx || this.silent || volume < 0.03) return;
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    if (kind === 'police') {
      o.frequency.setValueAtTime(950, t);
      o.frequency.setValueAtTime(700, t + 0.32);
      o.frequency.setValueAtTime(950, t + 0.64);
      o.frequency.setValueAtTime(700, t + 0.96);
    } else {
      o.frequency.setValueAtTime(650, t);
      o.frequency.linearRampToValueAtTime(1150, t + 0.6);
      o.frequency.linearRampToValueAtTime(650, t + 1.25);
    }
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045 * volume, t + 0.05);
    g.gain.setValueAtTime(0.045 * volume, t + 1.2);
    g.gain.linearRampToValueAtTime(0, t + 1.3);
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    o.connect(lp).connect(g).connect(p).connect(this.sfx);
    o.start(t);
    o.stop(t + 1.32);
  }

  /** A stadium crowd roar: noise swelling up and fading over about 2.5 s. */
  roar(volume: number, pan = 0) {
    if (!this.ctx || this.silent || volume < 0.03) return;
    const c = this.ctx;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.5;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5 * volume, t + 0.7);
    g.gain.linearRampToValueAtTime(0, t + 2.6);
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    src.connect(bp).connect(g).connect(p).connect(this.amb);
    src.start(t, Math.random());
    src.stop(t + 2.7);
  }

  /** The garbage van's cheerful loop (about 3 s); call again to repeat. */
  jingle(volume: number, pan = 0) {
    if (volume < 0.03) return;
    const notes = [523, 659, 784, 659, 698, 880, 784, 659, 587, 659, 523];
    notes.forEach((f, i) => this.tone(f, 0.2, 'square', 0.035 * volume, i * 0.25, pan));
  }

  private inverter: OscillatorNode | null = null;

  /** The low hum of everyone's inverter during a power cut. */
  setInverter(on: boolean) {
    if (!this.ctx) return;
    const c = this.ctx;
    if (on && !this.inverter) {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = 100;
      const g = c.createGain();
      g.gain.value = 0.02;
      o.connect(g).connect(this.amb);
      o.start();
      this.inverter = o;
    } else if (!on && this.inverter) {
      this.inverter.stop();
      this.inverter = null;
    }
  }

  /** Tell the ambience where the player is: birds by parks and lakes in daylight, crickets at night. */
  setNature(n: { birds: boolean; crickets: boolean; bell: boolean; festival: boolean }) {
    const o = this.nature;
    if (o.birds !== n.birds || o.crickets !== n.crickets || o.bell !== n.bell || o.festival !== n.festival) this.nature = n;
  }

  private chirp(base: number, pan: number, when: number, vol: number) {
    const c = this.ctx!;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.07);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.11);
    const p = c.createStereoPanner();
    p.pan.value = pan;
    o.connect(g).connect(p).connect(this.amb);
    o.start(t);
    o.stop(t + 0.13);
  }

  /** Procedural birdsong, crickets and a distant temple bell, layered quietly over the city hum. */
  private startNature() {
    this.every(1400, 3200, () => {
      if (!this.nature.birds) return;
      const base = 2400 + Math.random() * 1600;
      const pan = Math.random() * 1.6 - 0.8;
      const n = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) this.chirp(base * (1 + (i % 2) * 0.12), pan, i * 0.13, 0.05);
    });
    this.every(500, 900, () => {
      if (!this.nature.crickets) return;
      const pan = Math.random() * 2 - 1;
      for (let i = 0; i < 3; i++) this.tone(4300 + Math.random() * 200, 0.03, 'sine', 0.012, i * 0.06, pan);
    });
    // Dhol at the pandal: a steady dum-tak-dum-dum-tak.
    let beat = 0;
    this.every(230, 0, () => {
      if (!this.nature.festival) return;
      const b = beat++ % 8;
      if (b === 0 || b === 3 || b === 4) this.tone(85, 0.14, 'sine', 0.09, 0, 0.2);
      if (b === 2 || b === 6) this.tone(620, 0.04, 'square', 0.02, 0, 0.2);
    });
    this.every(9000, 9000, () => {
      if (this.nature.bell) [880, 1320, 1760].forEach((f, i) => this.tone(f, 1.8 - i * 0.4, 'sine', 0.03 / (i + 1), 0, -0.2));
    });
  }

  /** Background loops (nature, music notes, distant honks): timers we can stop when leaving the game. */
  private timers = new Set<number>();
  private silent = false;
  private musicOn = true;

  /** Run `fn` every `min`–`min + jitter` ms while the game is running and sound is on. */
  private every(min: number, jitter: number, fn: () => void) {
    const tick = () => {
      this.timers.delete(id);
      id = window.setTimeout(tick, min + Math.random() * jitter);
      this.timers.add(id);
      if (this.ctx?.state === 'running' && !this.silent) fn();
    };
    let id = window.setTimeout(tick, min + Math.random() * jitter);
    this.timers.add(id);
  }

  private startLoops() {
    if (this.timers.size) return;
    this.startNature();
    this.startNotes();
    this.every(4000, 9000, () => {
      const types: TrafficType[] = ['auto', 'car', 'bus', 'scooter'];
      this.honk(types[Math.floor(Math.random() * types.length)], 0.12 + Math.random() * 0.12, Math.random() * 2 - 1);
    });
  }

  /**
   * Soft background music: a tanpura-like Sa–Pa drone and slow, sparse notes in raga Mohanam
   * (a pentatonic scale), through a gentle echo. Mixed far below voices and street sound.
   */
  private startMusic() {
    const c = this.ctx!;
    const SA = 146.83; // D3
    const echo = c.createDelay(1);
    echo.delayTime.value = 0.42;
    const feedback = c.createGain();
    feedback.gain.value = 0.35;
    const wet = c.createGain();
    wet.gain.value = 0.5;
    echo.connect(feedback).connect(echo);
    echo.connect(wet).connect(this.music);
    // Drone: Sa, Pa and upper Sa, slowly breathing.
    for (const [f, v] of [
      [SA / 2, 0.05],
      [(SA * 3) / 4, 0.03],
      [SA, 0.035],
    ] as const) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = Math.random() * 6 - 3;
      const g = c.createGain();
      g.gain.value = v;
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.07 + Math.random() * 0.05;
      const depth = c.createGain();
      depth.gain.value = v * 0.4;
      lfo.connect(depth).connect(g.gain);
      o.connect(g).connect(this.music);
      o.start();
      lfo.start();
    }
    this.echo = echo;
  }

  private echo!: DelayNode;

  /** Slow melody notes in raga Mohanam (Sa Ri2 Ga3 Pa Dha2, two octaves). */
  private startNotes() {
    const c = this.ctx!;
    const SA = 146.83;
    const ratios = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2];
    let last = 0;
    this.every(1800, 2600, () => {
      if (!this.musicOn) return;
      // Wander by small steps so it sounds like a melody, not random beeps.
      last = Math.max(0, Math.min(ratios.length - 1, last + Math.floor(Math.random() * 5) - 2));
      const t = c.currentTime;
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = SA * 2 * ratios[last];
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 2.6);
      o.connect(g);
      g.connect(this.music);
      g.connect(this.echo);
      o.start(t);
      o.stop(t + 2.7);
    });
  }

  private loadVoices() {
    const c = this.ctx!;
    for (const file of VOICE_FILES) {
      this.clips.set(file, null);
      fetch(`${import.meta.env.BASE_URL}audio/voice/${file}`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText))))
        .then((b) => c.decodeAudioData(b))
        .then((buf) => this.clips.set(file, buf))
        .catch(() => {
          /* missing or undecodable: that clip stays silent and the bubble still shows */
        });
    }
  }

  /** Plays a recorded voice clip. Returns its length in seconds, or 0 if it isn't loaded. */
  voice(file: string, volume: number, pan = 0): number {
    const buf = this.ctx ? this.clips.get(file) : null;
    if (!this.ctx || !buf || this.silent || volume <= 0.02) return 0;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = volume;
    const p = this.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    src.connect(g).connect(p).connect(this.voices);
    src.start();
    return buf.duration;
  }

  apply(s: Settings) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Nothing to hear: skip building sounds at all, not just their volume.
    this.silent = s.muted || s.masterVolume === 0;
    this.musicOn = s.musicVolume > 0;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.masterVolume, t, 0.05);
    this.sfx.gain.setTargetAtTime(s.sfxVolume, t, 0.05);
    this.amb.gain.setTargetAtTime(s.ambienceVolume * 0.5, t, 0.05);
    this.voices.gain.setTargetAtTime(s.voiceVolume, t, 0.05);
    // Kept very light so it never competes with people talking.
    this.music.gain.setTargetAtTime(s.musicVolume * 0.75, t, 0.3);
  }

  suspend(on: boolean) {
    if (!this.ctx) return;
    if (on) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, pan = 0) {
    if (!this.ctx || this.silent) return;
    const c = this.ctx;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + dur - 0.03);
    g.gain.linearRampToValueAtTime(0, t + dur);
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    o.connect(g).connect(p).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Each vehicle type has its own horn: autos go "pom-pom", buses go "BAAAP". */
  honk(type: TrafficType, volume = 1, pan = 0) {
    if (volume <= 0.02) return;
    const v = 0.12 * volume;
    if (type === 'auto') {
      this.tone(520, 0.11, 'square', v * 0.7, 0, pan);
      this.tone(520, 0.11, 'square', v * 0.7, 0.16, pan);
    } else if (type === 'bus') {
      this.tone(185, 0.5, 'sawtooth', v * 0.6, 0, pan);
      this.tone(233, 0.5, 'sawtooth', v * 0.45, 0, pan);
    } else if (type === 'scooter') {
      this.tone(880, 0.09, 'square', v * 0.5, 0, pan);
      this.tone(880, 0.09, 'square', v * 0.5, 0.12, pan);
      this.tone(880, 0.09, 'square', v * 0.5, 0.24, pan);
    } else {
      this.tone(392, 0.28, 'square', v * 0.55, 0, pan);
      this.tone(494, 0.28, 'square', v * 0.4, 0, pan);
    }
  }

  chime(kind: 'discover' | 'hint' | 'metro' | 'ui' | 'arrive') {
    if (kind === 'ui') return this.tone(660, 0.05, 'square', 0.04);
    if (kind === 'discover')
      return [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.08, i * 0.08));
    if (kind === 'hint') return [659, 880].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.07, i * 0.1));
    if (kind === 'arrive') return [784, 659].forEach((f, i) => this.tone(f, 0.15, 'triangle', 0.07, i * 0.12));
    // Metro door chime
    [659, 523, 392].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.1, i * 0.22));
  }

  thud() {
    this.tone(70, 0.12, 'sine', 0.2);
  }

  setRain(on: boolean) {
    if (!this.ctx) return;
    this.rainGain.gain.setTargetAtTime(on ? 0.28 : 0, this.ctx.currentTime, 1.2);
  }

  /** Engine drone while driving; pass null to stop. */
  engine(speed01: number | null, type: TrafficType = 'car') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (speed01 === null) {
      this.engineGain.gain.setTargetAtTime(0, t, 0.1);
      return;
    }
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 500;
      this.engineOsc.connect(lp).connect(this.engineGain);
      this.engineOsc.start();
    }
    const base = type === 'auto' ? 55 : type === 'scooter' ? 90 : 42;
    this.engineOsc.frequency.setTargetAtTime(base + speed01 * base * 1.6, t, 0.08);
    this.engineGain.gain.setTargetAtTime(0.035 + speed01 * 0.035, t, 0.1);
  }

  stopAll() {
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
    this.music?.gain.setTargetAtTime(0, this.ctx?.currentTime ?? 0, 0.3);
    this.engine(null);
    this.setRain(false);
  }
}

export const audio = new AudioEngine();
