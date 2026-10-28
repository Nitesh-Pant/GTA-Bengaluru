import { BUS_ROUTES, busStopById } from '../../data/transit';
import { mulberry32, pick } from '../../logic/rng';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

const CONDUCTOR = ['"Tickets! Tickets! Munde hogi, munde!"', '"Change illa, swalpa adjust maadi."', '"Ladies seat bidi, saar!"', '"Hindhe jaaga ide, hindhe hogi!"'];

/** BMTC buses: wait at a stop, board, ride along the main roads, get off at another stop. */
export class BusSystem {
  private rng = mulberry32(83);
  constructor(private scene: WorldScene) {}

  open(stopId: string) {
    uiStore.set({ panel: 'bus', busStop: stopId });
  }

  take(toId: string) {
    uiStore.set({ panel: null, busStop: null });
    const s = this.scene;
    if (s.ride.busy) return;
    const route = pick(BUS_ROUTES, this.rng);
    const to = busStopById(toId)!;
    uiStore.toast({ kind: 'info', title: `BMTC ${route} to ${to.name}`, body: 'Arriving in "two minutes". Stand near the stop.' });
    s.ride.schedule(
      3500,
      () => {
        const stand = { x: t(to.x), y: t(to.y) };
        audio.honk('bus', 0.8);
        uiStore.toast({ kind: 'arrive', title: `BMTC ${route} is here`, body: `Conductor: ${pick(CONDUCTOR, this.rng)}` });
        s.ride.travel(s.ride.route(stand), { texture: 'veh_bus_0', sound: 'bus', speed: 170, label: `BMTC ${route}`, drop: s.ride.freeSpot(stand.x, stand.y) }, () => {
          s.stats.busRides++;
          uiStore.toast({ kind: 'arrive', title: `${to.name}`, body: 'Conductor: "Stop bantu, ilee! Bega, bega!"' }, 3200);
        });
      },
      () => uiStore.toast({ kind: 'info', title: `You missed the ${route}`, body: 'It did not wait. BMTC never waits.' }),
    );
  }
}
