import { t } from '../game/constants';
import type { StationDef } from '../logic/metro';

/** Add a station here (and a platform on METRO_TRACK) to extend the network. */
export const STATIONS: StationDef[] = [
  {
    id: 'indiranagar',
    name: 'Indiranagar',
    entrance: { x: t(32), y: t(56.4) },
    exit: { x: t(33.6), y: t(57.2) },
    platform: { x: t(32), y: t(60) },
    connections: ['hub'],
  },
  {
    id: 'hub',
    name: 'Central Metro Hub',
    entrance: { x: t(107), y: t(72.4) },
    exit: { x: t(105), y: t(73.4) },
    platform: { x: t(106), y: t(60) },
    connections: ['indiranagar'],
  },
];
