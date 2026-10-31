import Phaser from 'phaser';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import type { WorldScene } from '../scenes/WorldScene';

interface Drop {
  x: number;
  y: number;
  speed: number;
  len: number;
}

/** Monsoon showers: screen-space streaks, a grey wash, and NPC reactions via the scene. */
export class WeatherSystem {
  raining = false;
  private intensity = 0;
  private drops: Drop[] = [];
  private gfx: Phaser.GameObjects.Graphics;
  private endsAt = 0;

  constructor(private scene: WorldScene) {
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(9000);
    for (let i = 0; i < 160; i++) this.drops.push(this.newDrop(true));
  }

  private newDrop(anywhere: boolean): Drop {
    const cam = this.scene.cameras.main;
    return {
      x: Math.random() * (cam.width + 100) - 50,
      y: anywhere ? Math.random() * cam.height : -20 - Math.random() * 60,
      speed: 520 + Math.random() * 260,
      len: 8 + Math.random() * 10,
    };
  }

  start(durationMs: number, now: number) {
    if (this.raining) return;
    this.raining = true;
    this.endsAt = now + durationMs;
    uiStore.set({ raining: true });
    audio.setRain(true);
    const p = this.scene.playerFeet();
    this.scene.react({ type: 'rain_start', x: p.x, y: p.y });
    this.scene.mark('rain');
  }

  stop() {
    if (!this.raining) return;
    this.raining = false;
    uiStore.set({ raining: false });
    audio.setRain(false);
    const p = this.scene.playerFeet();
    this.scene.react({ type: 'rain_stop', x: p.x, y: p.y });
  }

  update(dt: number, now: number) {
    if (this.raining && now >= this.endsAt) this.stop();
    this.intensity += ((this.raining ? 1 : 0) - this.intensity) * Math.min(1, dt * 0.8);
    this.gfx.clear();
    if (this.intensity < 0.02) return;
    const cam = this.scene.cameras.main;
    this.gfx.fillStyle(0x2a3550, 0.22 * this.intensity);
    this.gfx.fillRect(0, 0, cam.width, cam.height);
    this.gfx.lineStyle(1.5, 0xc8d8f0, 0.55 * this.intensity);
    const count = Math.floor(this.drops.length * this.intensity);
    for (let i = 0; i < count; i++) {
      const d = this.drops[i];
      d.y += d.speed * dt;
      d.x -= d.speed * 0.18 * dt;
      if (d.y > cam.height + 20) Object.assign(d, this.newDrop(false));
      this.gfx.lineBetween(d.x, d.y, d.x + d.len * 0.18, d.y - d.len);
    }
  }
}
