import { BUCKET } from '../../data/bucket';
import { STATIONS } from '../../data/metro';
import { poiById } from '../../data/pois';
import { BUS_STOPS } from '../../data/transit';
import { TIPS, type TipId } from '../../data/tips';
import { bucketDone } from '../../logic/bucket';
import { inputLocked, uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

const COPS = ['cop_cmh', 'gowda', 'cop_mg', 'sb_cop'];
const VIEWS = ['vidhana', 'tipusdrop', 'sunrisepoint', 'kerepark', 'airport'];

/**
 * "Did you know?" nudges: the first time you're near a dog, crows, a Yulu, a metro entrance… a short
 * tip says what you can do there. Each shows once (saved), only on foot and never more than one at a time.
 */
export class TipSystem {
  private checkIn = 0;
  private quietUntil = 0;
  private startedAt: number;

  constructor(private scene: WorldScene) {
    this.startedAt = scene.clock;
  }

  update(now: number) {
    if (now < this.checkIn) return;
    this.checkIn = now + 500;
    const s = this.scene;
    if (now < this.quietUntil || s.mode.kind !== 'walk' || inputLocked() || uiStore.get().jobOffer) return;
    const p = s.playerFeet();
    const near = (x: number, y: number, r: number) => Math.hypot(x - p.x, y - p.y) < r;
    const st = s.stats;
    const checks: Array<[TipId, () => boolean]> = [
      ['dog', () => st.dogsFed === 0 && s.animals.dogs.some((d) => near(d.sprite.x, d.sprite.y, 60))],
      ['crows', () => !s.marks.includes('crows') && s.animals.crowSpots().some((c) => near(c.x, c.y, 110))],
      ['yulu', () => !s.marks.includes('yulu') && s.vehicles.list.some((v) => v.def.id.startsWith('yulu') && !v.occupied && near(v.sprite.x, v.sprite.y, 70))],
      ['metro', () => st.metroRides === 0 && STATIONS.some((m) => near(m.entrance.x, m.entrance.y, 80))],
      ['bus', () => st.busRides === 0 && BUS_STOPS.some((b) => near(t(b.x), t(b.y), 60))],
      ['cow', () => st.cow === 0 && near(t(80), t(19.9), 90)], // Gowri (WorldScene's COW)
      ['cricket', () => st.throws === 0 && near(poiById('maidan')!.x, poiById('maidan')!.y, 120)],
      ['monkey', () => st.monkeyTax === 0 && s.animals.monkeys.some((m) => near(m.sprite.x, m.sprite.y, 90))],
      ['cop', () => st.challans === 0 && COPS.some((id) => { const c = s.npcs.byId(id); return !!c && near(c.x, c.y, 90); })],
      ['photo', () => st.postcards === 0 && VIEWS.some((id) => { const v = poiById(id); return !!v && near(v.x, v.y, 70); })],
      ['bucket', () => now - this.startedAt > 120000 && bucketDone(BUCKET, { stats: st, discovered: s.discovered, tasted: s.tasted, marks: s.marks }).length < 4],
    ];
    for (const [id, when] of checks) {
      if (s.tipsSeen.includes(id) || !when()) continue;
      s.tipsSeen = [...s.tipsSeen, id];
      this.quietUntil = now + 20000;
      uiStore.toast({ kind: 'hint', title: 'Did you know?', body: TIPS[id] }, 6500);
      audio.chime('hint');
      s.persist();
      return;
    }
  }
}
