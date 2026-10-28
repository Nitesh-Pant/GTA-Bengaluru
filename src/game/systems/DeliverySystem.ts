import { POIS } from '../../data/pois';
import { formatDuration } from '../../logic/dayClock';
import { pickDelivery, type DeliveryJob } from '../../logic/delivery';
import { mulberry32, pick } from '../../logic/rng';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import type { WorldScene } from '../scenes/WorldScene';

const ORDERS = [
  '2 masala dose and a filter coffee',
  'Biryani for three, extra raita',
  'Six veg puffs, "very hot please"',
  'A flask of chai for a standup',
  'Ragi mudde combo',
  'One burger: no onion, extra onion (the note is unclear)',
  'Idli-vade, sambar on the side, chutney on the other side',
];

/** Food delivery runs: pick up from a restaurant, drop at an office, PG or landmark before time runs out. */
export class DeliverySystem {
  private rng = mulberry32(57);
  private job: (DeliveryJob & { stage: 'pickup' | 'drop'; endsAt: number; order: string }) | null = null;
  private shownSecond = -1;

  constructor(private scene: WorldScene) {}

  start() {
    const s = this.scene;
    if (this.job) {
      uiStore.toast({ kind: 'info', title: 'One order at a time!', body: `Finish the delivery to ${this.job.drop.name} first.` });
      return;
    }
    const job = pickDelivery(POIS, this.rng, s.playerFeet());
    if (!job) return;
    this.job = { ...job, stage: 'pickup', endsAt: s.clock + job.seconds * 1000, order: pick(ORDERS, this.rng) };
    this.guide(job.pickup, 'Pick up');
    uiStore.toast({ kind: 'hint', title: `New order: pick up at ${job.pickup.name}`, body: `Deliver to ${job.drop.name} within ${formatDuration(job.seconds)}. Follow the marker.` }, 5200);
    audio.chime('hint');
  }

  cancel() {
    if (!this.job) return;
    this.finish();
    uiStore.toast({ kind: 'info', title: 'Order handed back', body: 'No problem. Talk to a delivery rider for another one.' });
  }

  update(now: number) {
    const j = this.job;
    if (!j) return;
    const s = this.scene;
    const target = j.stage === 'pickup' ? j.pickup : j.drop;
    const p = s.playerFeet();
    const arrived = !s.travelling && Math.hypot(p.x - target.x, p.y - target.y) < Math.min(target.radius, 40);
    if (arrived && j.stage === 'pickup') {
      j.stage = 'drop';
      this.guide(j.drop, 'Deliver');
      uiStore.toast({ kind: 'hint', title: 'Order picked up', body: `${j.order}. Now to ${j.drop.name}!` });
      audio.chime('hint');
    } else if (arrived) {
      this.finish();
      uiStore.toast({ kind: 'arrive', title: `Delivered to ${j.drop.name}!`, body: '"Thank you! Five stars, and a tip in good wishes."' }, 4200);
      audio.chime('arrive');
      s.bump('deliveries');
      return;
    }
    if (now >= j.endsAt) {
      this.finish();
      uiStore.toast({ kind: 'info', title: 'The order went cold', body: 'Customer: "One star… but thanks for trying." Ask a rider for another one.' }, 4600);
      return;
    }
    const left = Math.ceil((j.endsAt - now) / 1000);
    if (left !== this.shownSecond) {
      this.shownSecond = left;
      uiStore.setJob('delivery', { label: `Delivery · ${j.stage === 'pickup' ? `Pick up at ${j.pickup.name}` : `Deliver to ${j.drop.name}`}`, secondsLeft: left, cancellable: true });
    }
  }

  /** Jobs steer with their own marker, leaving the player's marked place alone. */
  private guide(poi: { x: number; y: number; name: string }, verb: string) {
    this.scene.guides.set('delivery', { x: poi.x, y: poi.y, label: `${verb}: ${poi.name}` });
  }

  private finish() {
    this.scene.guides.delete('delivery');
    this.job = null;
    this.shownSecond = -1;
    uiStore.setJob('delivery', null);
  }
}
