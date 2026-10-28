import { BUS_ROUTES, busStopById } from '../../data/transit';
import { mulberry32, pick } from '../../logic/rng';
import { uiStore } from '../../store/uiStore';
import { audio } from '../audio';
import { CITY_W, t } from '../constants';
import type { WorldScene } from '../scenes/WorldScene';

const KSRTC_CONDUCTOR = ['"Nandi Hills! Nandi Hills! Window seat ide, banni!"', '"Hairpin alli vomit beda, plastic cover ide."', '"Sunrise ge bega bandre seat sigutte, saar."'];
const CONDUCTOR = ['"Tickets! Tickets! Munde hogi, munde!"', '"Change illa, swalpa adjust maadi."', '"Ladies seat bidi, saar!"', '"Hindhe jaaga ide, hindhe hogi!"'];

/** BMTC buses: wait at a stop, board, ride along the main roads, get off at another stop. */
export class BusSystem {
  private rng = mulberry32(83);
  constructor(private scene: WorldScene) {}

  open(stopId: string) {
    uiStore.set({ panel: 'bus', busStop: stopId });
  }

  take(toId: string) {
    const from = busStopById(uiStore.get().busStop);
    uiStore.set({ panel: null, busStop: null });
    const s = this.scene;
    if (s.ride.busy) return;
    const to = busStopById(toId)!;
    // Out of town it's the red KSRTC bus, not a city BMTC.
    const outstation = to.x >= CITY_W || (from?.x ?? 0) >= CITY_W;
    const route = outstation ? 'KSRTC Nandi Hills Express' : `BMTC ${pick(BUS_ROUTES, this.rng)}`;
    uiStore.toast({ kind: 'info', title: `${route} to ${to.name}`, body: 'Arriving in "two minutes". Stand near the stop.' });
    s.ride.schedule(
      3500,
      () => {
        const stand = { x: t(to.x), y: t(to.y) };
        audio.honk('bus', 0.8);
        uiStore.toast({ kind: 'arrive', title: `${route} is here`, body: `Conductor: ${pick(outstation ? KSRTC_CONDUCTOR : CONDUCTOR, this.rng)}` });
        s.ride.travel(s.ride.route(stand), { texture: outstation ? 'veh_bus_1' : 'veh_bus_0', sound: 'bus', speed: outstation ? 200 : 170, label: route, drop: s.ride.freeSpot(stand.x, stand.y) }, () => {
          s.stats.busRides++;
          uiStore.toast({ kind: 'arrive', title: `${to.name}`, body: 'Conductor: "Stop bantu, ilee! Bega, bega!"' }, 3200);
        });
      },
      () => uiStore.toast({ kind: 'info', title: `You missed the ${route}`, body: outstation ? 'Next one in an hour. Or hitch a ride with the bikers.' : 'It did not wait. BMTC never waits.' }),
    );
  }
}
