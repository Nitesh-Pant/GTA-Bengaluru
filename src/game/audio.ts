import type { TrafficType } from '../data/roads';
import type { Settings } from '../logic/save';

/**
 * Tiny procedural sound engine: no audio files, nothing fetched over the network.
 * Created on the first user gesture (the Start button) so browsers allow playback.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private amb!: GainNode;
  private rainGain!: GainNode;
  private engineOsc: OscillatorNode | null = null;
  private engineGain!: GainNode;
  private noise!: AudioBuffer;
  private distantTimer: number | null = null;

  init(settings: Settings) {
    if (this.ctx) {
      void this.ctx.resume();
      this.apply(settings);
      if (!this.distantTimer) this.scheduleDistantHonks();
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
    this.scheduleDistantHonks();
  }

  apply(s: Settings) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.masterVolume, t, 0.05);
    this.sfx.gain.setTargetAtTime(s.sfxVolume, t, 0.05);
    this.amb.gain.setTargetAtTime(s.ambienceVolume * 0.5, t, 0.05);
  }

  suspend(on: boolean) {
    if (!this.ctx) return;
    if (on) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, pan = 0) {
    if (!this.ctx) return;
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

  private scheduleDistantHonks() {
    const next = () => {
      this.distantTimer = window.setTimeout(() => {
        if (this.ctx?.state === 'running') {
          const types: TrafficType[] = ['auto', 'car', 'bus', 'scooter'];
          this.honk(types[Math.floor(Math.random() * types.length)], 0.12 + Math.random() * 0.12, Math.random() * 2 - 1);
        }
        next();
      }, 4000 + Math.random() * 9000);
    };
    next();
  }

  stopAll() {
    if (this.distantTimer) clearTimeout(this.distantTimer);
    this.distantTimer = null;
    this.engine(null);
    this.setRain(false);
  }
}

export const audio = new AudioEngine();
