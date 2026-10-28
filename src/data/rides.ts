import { TILE } from '../game/constants';
import { districtCentre, DISTRICTS } from './map';
import { poiById } from './pois';

export interface RideDest {
  id: string;
  name: string;
  note: string;
  /** World px. */
  x: number;
  y: number;
}

/** Bike-taxi captains. One of them always cancels. */
export const CAPTAINS = ['Ramesh', 'Suresh', 'Imran', 'Manjunath', 'Kiran', 'Anil', 'Shabbir', 'Lokesh', 'Prakash'];

/** Where a bike taxi can take you: every district, plus your marked destination first if you have one. */
export function rideDestinations(markedPoi: string | null): RideDest[] {
  const out: RideDest[] = DISTRICTS.map((d) => {
    const c = districtCentre(d);
    return { id: `d:${d.id}`, name: d.name, note: d.tagline, x: c.x * TILE, y: c.y * TILE };
  });
  const poi = markedPoi ? poiById(markedPoi) : null;
  if (poi) out.unshift({ id: `p:${poi.id}`, name: poi.name, note: 'Your marked destination', x: poi.x, y: poi.y });
  return out;
}
