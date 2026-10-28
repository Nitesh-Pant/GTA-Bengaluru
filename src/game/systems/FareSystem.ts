import type Phaser from 'phaser';
import { POIS } from '../../data/pois';
import { HAIL_SPOTS } from '../../data/transit';
import { poisInRing } from '../../logic/delivery';
import { mulberry32, pick } from '../../logic/rng';
import type { PoiDef } from '../../logic/discovery';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { t, TILE } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

/** The "earn fares or just drive?" card shown when you get into an auto. */
export const FARE_CHOICE = 'fares:choice';
const CHOICE = FARE_CHOICE;
const PASSENGER_LOOKS = ['techie_m', 'techie_f', 'aunty', 'uncle', 'student_f', 'commuter', 'commuter_f', 'student'];
const NAMES = ['Meena', 'Prakash', 'Sowmya', 'Arif', 'Deepak', 'Lata', 'Joseph', 'Nandini', 'Rahul', 'Farzana'];
const ASKS = ['"Meter haaki, anna!"', '"Bega hogi, flight ide!"', '"Left-u, right-u, straight-u. Naanu helthini."', '"Short route gothu alva?"', '"Swalpa slow, nanna coffee chellutte!"'];

/** Driving any auto: people wave you down; slow down beside them, drop them off, collect the meter. */
export class FareSystem {
  private rng = mulberry32(97);
  private job: { stage: 'pickup' | 'carry'; name: string; spot: { x: number; y: number }; to: PoiDef; sprite: Phaser.GameObjects.Image | null } | null = null;
  private nextAt = 0;
  private wasAuto = false;
  /** Picking up passengers in this auto ('ask' until you choose). */
  private duty: 'ask' | 'earn' | 'drive' = 'ask';
  /** Chosen on the auto's job card before getting in. */
  preset: 'earn' | 'drive' | null = null;

  constructor(private scene: WorldScene) {}

  private inAuto() {
    const v = this.scene.vehicles.driving();
    return v?.def.type === 'auto' ? v : null;
  }

  update(now: number) {
    const s = this.scene;
    const v = this.inAuto();
    if (!!v !== this.wasAuto) {
      this.wasAuto = !!v;
      if (v) {
        if (this.preset) this.setDuty(this.preset, now);
        else {
          this.duty = 'ask';
          uiStore.set({ jobOffer: { id: CHOICE, kind: 'fares', title: 'Auto fares', who: v.def.name, body: 'Pick up people who wave you down and earn the meter, or just drive around.', cta: 'Earn fares', alt: 'Just drive' } });
        }
        this.preset = null;
      } else {
        if (this.job) this.abandon();
        if (uiStore.get().jobOffer?.id === CHOICE) uiStore.set({ jobOffer: null });
      }
    }
    if (!v || this.duty !== 'earn') return;
    if (!this.job) {
      if (now >= this.nextAt) this.hail();
      return;
    }
    const j = this.job;
    const near = (x: number, y: number, r: number) => Math.hypot(v.sprite.x - x, v.sprite.y - y) < r && Math.abs(v.speed) < 35;
    if (j.stage === 'pickup' && near(j.spot.x, j.spot.y, 44)) {
      j.stage = 'carry';
      j.sprite?.destroy();
      j.sprite = null;
      s.guides.set('fare', { x: j.to.x, y: j.to.y, label: `Drop: ${j.to.name}` });
      uiStore.setJob('fare', { label: `Auto · Drop ${j.name} at ${j.to.name}` });
      uiStore.toast({ kind: 'info', title: `${j.name} hops in`, body: `"${j.to.name}, please." ${pick(ASKS, this.rng)}` });
      audio.chime('ui');
    } else if (j.stage === 'carry' && near(j.to.x, j.to.y, 64)) {
      const tiles = Math.hypot(j.to.x - j.spot.x, j.to.y - j.spot.y) / TILE;
      const meter = Math.round(30 + tiles * 1.6);
      const paid = Math.floor(meter / 10) * 10;
      s.stats.rupees += paid;
      uiStore.toast({ kind: 'arrive', title: `Fare: ₹${paid}`, body: `Meter said ₹${meter}. ${j.name}: "Change illa, ₹${paid} thogoli. Adjust maadi!"` }, 4200);
      audio.chime('arrive');
      this.clear();
      this.nextAt = now + 5000;
      s.bump('fares');
    }
  }

  /** Earn fares (passengers start waving) or just drive. */
  setDuty(duty: 'earn' | 'drive', now = this.scene.clock) {
    this.duty = duty;
    if (uiStore.get().jobOffer?.id === CHOICE) uiStore.set({ jobOffer: null });
    if (duty === 'earn') {
      this.nextAt = now + 3000;
      uiStore.toast({ kind: 'hint', title: 'On duty', body: 'People will wave you down. Slow down beside them to pick up, then drop them at the marker.' }, 5200);
    } else if (this.job) this.abandon();
  }

  private hail() {
    const s = this.scene;
    const v = this.inAuto()!;
    const spots = HAIL_SPOTS.map((h) => ({ x: t(h.x), y: t(h.y) }))
      .map((h) => ({ h, d: Math.hypot(h.x - v.sprite.x, h.y - v.sprite.y) }))
      .filter((o) => o.d > 120 && o.d < 900);
    if (!spots.length) {
      this.nextAt = s.clock + 3000;
      return;
    }
    const spot = pick(spots, this.rng).h;
    const to = pick(poisInRing(POIS, spot, 30, 80, (p) => p.kind !== 'metro'), this.rng);
    const name = pick(NAMES, this.rng);
    const sprite = s.add.image(spot.x, spot.y, `char_${pick(PASSENGER_LOOKS, this.rng)}`, 0).setOrigin(0.5, 22 / 24).setDepth(spot.y);
    this.job = { stage: 'pickup', name, spot, to, sprite };
    s.guides.set('fare', { x: spot.x, y: spot.y, label: `Pick up: ${name}` });
    s.bubbles.say(() => (this.job?.sprite ? { x: spot.x, y: spot.y - 22 } : null), name, 'Auto! Auto! Baruttira?', 2600, s.clock);
    uiStore.setJob('fare', { label: `Auto · Pick up ${name}` });
  }

  private abandon() {
    const j = this.job!;
    if (j.stage === 'carry') uiStore.toast({ kind: 'info', title: `${j.name} is not happy`, body: '"Half-way bittu hogtira?! Ayyo." They walk off to find another auto.' });
    this.clear();
  }

  private clear() {
    this.job?.sprite?.destroy();
    this.job = null;
    this.scene.guides.delete('fare');
    uiStore.setJob('fare', null);
  }
}
