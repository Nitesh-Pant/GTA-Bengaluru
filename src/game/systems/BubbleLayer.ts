import type Phaser from 'phaser';

export type BubbleKind = 'npc' | 'driver' | 'honk' | 'event';

interface Bubble {
  el: HTMLDivElement;
  anchor: () => { x: number; y: number } | null;
  until: number;
  h: number;
}

/**
 * Crisp DOM speech bubbles and prompts positioned over the canvas each frame.
 * Kept in DOM (not canvas text) so text stays sharp at any zoom.
 */
export class BubbleLayer {
  private bubbles = new Map<number, Bubble>();
  private nextId = 1;
  private prompt: HTMLDivElement;
  private promptTarget: { x: number; y: number } | null = null;
  private arrow: HTMLDivElement;
  private arrowTarget: { x: number; y: number; label: string } | null = null;

  constructor(private root: HTMLElement) {
    root.innerHTML = '';
    this.prompt = document.createElement('div');
    this.prompt.className = 'world-prompt';
    this.prompt.style.display = 'none';
    root.appendChild(this.prompt);
    this.arrow = document.createElement('div');
    this.arrow.className = 'dest-arrow';
    this.arrow.style.display = 'none';
    this.arrow.innerHTML = '<i>➤</i><span></span>';
    root.appendChild(this.arrow);
  }

  say(anchor: Bubble['anchor'], speaker: string, text: string, durationMs: number, now: number, kind: BubbleKind = 'npc'): number {
    const id = this.nextId++;
    const el = document.createElement('div');
    el.className = `bubble bubble-${kind}`;
    if (speaker) {
      const name = document.createElement('span');
      name.className = 'bubble-name';
      name.textContent = speaker;
      el.appendChild(name);
    }
    const body = document.createElement('span');
    body.textContent = text;
    el.appendChild(body);
    this.root.appendChild(el);
    this.bubbles.set(id, { el, anchor, until: now + durationMs, h: 0 });
    return id;
  }

  remove(id: number) {
    const b = this.bubbles.get(id);
    if (!b) return;
    b.el.remove();
    this.bubbles.delete(id);
  }

  setPrompt(target: { x: number; y: number } | null, label = '') {
    this.promptTarget = target;
    if (!target) {
      this.prompt.style.display = 'none';
      return;
    }
    if (this.prompt.dataset.label !== label) {
      this.prompt.dataset.label = label;
      this.prompt.innerHTML = `<kbd>E</kbd><span></span>`;
      (this.prompt.lastChild as HTMLSpanElement).textContent = label;
    }
    this.prompt.style.display = 'flex';
  }

  setDestination(target: { x: number; y: number; label: string } | null) {
    this.arrowTarget = target;
    if (!target) this.arrow.style.display = 'none';
  }

  update(cam: Phaser.Cameras.Scene2D.Camera, now: number, hidden: boolean) {
    this.root.style.visibility = hidden ? 'hidden' : 'visible';
    const toScreen = (x: number, y: number) => ({
      x: (x - cam.worldView.x) * cam.zoom,
      y: (y - cam.worldView.y) * cam.zoom,
    });
    const W = cam.width;
    const H = cam.height;
    const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
    const sorted = [...this.bubbles.entries()].sort((a, b) => a[0] - b[0]);
    for (const [id, b] of sorted) {
      const a = b.anchor();
      if (now >= b.until || !a) {
        b.el.classList.add('bubble-out');
        if (now >= b.until + 200 || !a) this.remove(id);
        continue;
      }
      const s = toScreen(a.x, a.y);
      const w = b.el.offsetWidth;
      if (!b.h) b.h = b.el.offsetHeight;
      const x = Math.round(Math.max(8, Math.min(W - w - 8, s.x - w / 2)));
      let y = Math.round(s.y - b.h - 6);
      // Nudge up so simultaneous bubbles never overlap.
      for (let guard = 0; guard < 6; guard++) {
        const hit = placed.find((p) => x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + b.h > p.y);
        if (!hit) break;
        y = hit.y - b.h - 4;
      }
      y = Math.max(52, y);
      placed.push({ x, y, w, h: b.h });
      const off = s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 60;
      b.el.style.display = off ? 'none' : 'block';
      b.el.style.transform = `translate(${x}px, ${y}px)`;
    }
    if (this.promptTarget) {
      const s = toScreen(this.promptTarget.x, this.promptTarget.y);
      const w = this.prompt.offsetWidth;
      this.prompt.style.transform = `translate(${Math.round(s.x - w / 2)}px, ${Math.round(s.y + 10)}px)`;
    }
    if (this.arrowTarget) {
      const t = this.arrowTarget;
      const s = toScreen(t.x, t.y);
      const margin = 40;
      const inView = s.x > margin && s.x < W - margin && s.y > margin + 40 && s.y < H - margin;
      if (inView) {
        this.arrow.style.display = 'none';
      } else {
        const cx = W / 2;
        const cy = H / 2;
        const ang = Math.atan2(s.y - cy, s.x - cx);
        const k = Math.min((W / 2 - margin) / Math.abs(Math.cos(ang) || 1e-6), (H / 2 - margin) / Math.abs(Math.sin(ang) || 1e-6));
        const ax = cx + Math.cos(ang) * k;
        const ay = cy + Math.sin(ang) * k;
        const meters = Math.round(Math.hypot(t.x - (cam.worldView.centerX), t.y - cam.worldView.centerY) / 4);
        this.arrow.style.display = 'flex';
        (this.arrow.firstChild as HTMLElement).style.transform = `rotate(${ang}rad)`;
        (this.arrow.lastChild as HTMLElement).textContent = `${t.label} · ${meters} m`;
        this.arrow.style.transform = `translate(${Math.round(ax)}px, ${Math.round(ay)}px) translate(-50%, -50%)`;
      }
    }
  }

  clear() {
    for (const id of [...this.bubbles.keys()]) this.remove(id);
    this.setPrompt(null);
    this.setDestination(null);
  }
}
