import { JUNCTIONS } from '../../data/roads';
import { challanOutcome, FINES, type ChallanAction, type Violation } from '../../logic/police';
import { signalState } from '../../logic/traffic';
import { inputLocked, uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { t } from '../constants';
import type { Npc } from './NpcSystem';
import type { WorldScene } from '../scenes/WorldScene';

/** Constables who run checkpoints at junctions. */
const COPS = ['cop_cmh', 'gowda', 'cop_mg', 'sb_cop'];
/** A stop, then the police leave you alone for a while. */
const COOLDOWN = 60000;

const VERDICT: Record<ChallanAction, { off: string; fined: string }> = {
  pay: { off: '', fined: 'Paid on the spot. The constable writes the receipt slowly, for effect.' },
  adjust: { off: '"Sari sari, hogi. Next time careful!" He waves you on.', fined: '"Adjust aagalla, saar!" Two hundred extra for the joke.' },
  plead: { off: '"New to Bengaluru? Welcome. Rules ide, gothaitha? Hogi." Let off with a warning.', fined: '"Everyone is new to Bengaluru, saar." No luck this time.' },
};

/**
 * Traffic police: near a constable's checkpoint, jump a red light, speed, or ride a rental scooter
 * without a helmet and you get whistled over for a challan. Pay, try "swalpa adjust maadi", or plead.
 */
export class PoliceSystem {
  private inBox = new Set<string>();
  private quietUntil = 0;
  private pending: Violation | null = null;
  private helmetChecked = new Map<string, number>();

  constructor(private scene: WorldScene) {}

  update(now: number) {
    const s = this.scene;
    const v = s.vehicles.driving();
    if (!v) {
      this.inBox.clear();
      return;
    }
    if (inputLocked() || now < this.quietUntil) return;
    const cops = COPS.map((id) => s.npcs.byId(id)).filter((c): c is Npc => !!c);
    const near = (r: number) => cops.find((c) => Math.hypot(c.x - v.sprite.x, c.y - v.sprite.y) < t(r));
    // Red light: entering a junction box against a red, with a constable watching.
    for (const j of JUNCTIONS) {
      if (!j.signal) continue;
      const inside = v.sprite.x > j.x0 && v.sprite.x < j.x1 && v.sprite.y > j.y0 && v.sprite.y < j.y1;
      if (inside && !this.inBox.has(j.id)) {
        this.inBox.add(j.id);
        const axis = Math.abs(Math.cos(v.heading)) > 0.7 ? 'ew' : 'ns';
        const cop = near(12);
        if (cop && Math.abs(v.speed) > 20 && signalState(now, j.timing, j.offset)[axis] === 'red') return this.stop(cop, 'red', now);
      } else if (!inside) this.inBox.delete(j.id);
    }
    // Speeding right past a constable.
    if (Math.abs(v.speed) > s.vehicles.paramsFor(v).maxSpeed * 0.85) {
      const cop = near(5);
      if (cop) return this.stop(cop, 'speed', now);
    }
    // Helmet checks for rental scooters (their helmet is "optimistic"), now and then.
    if (v.def.id.startsWith('scooter')) {
      const cop = near(4);
      if (cop && (this.helmetChecked.get(cop.id) ?? 0) < now) {
        this.helmetChecked.set(cop.id, now + 120000);
        if (Math.random() < 0.7) return this.stop(cop, 'helmet', now);
      }
    }
  }

  private stop(cop: Npc, violation: Violation, now: number) {
    const s = this.scene;
    const v = s.vehicles.driving();
    if (v) v.speed = 0;
    this.pending = violation;
    this.quietUntil = now + COOLDOWN;
    const p = s.playerFeet();
    audio.whistle(1, (cop.x - p.x) / 300);
    s.talk.open(cop, `challan_${violation}`);
  }

  /** The player's answer at a traffic stop (from the challan conversation). */
  resolve(action: ChallanAction) {
    const s = this.scene;
    const violation = this.pending;
    if (!violation) return;
    this.pending = null;
    const out = challanOutcome(action, FINES[violation], s.stats.challans, Math.random);
    s.bump('challans');
    if (out.letOff) {
      s.bump('letOff');
      uiStore.toast({ kind: 'arrive', title: 'Let off with a warning', body: VERDICT[action].off }, 4800);
      return;
    }
    s.stats.rupees = Math.max(0, s.stats.rupees - out.fine);
    s.bump('fines', out.fine);
    uiStore.toast({ kind: 'info', title: `Challan: ₹${out.fine}`, body: VERDICT[action].fined }, 4800);
  }
}
