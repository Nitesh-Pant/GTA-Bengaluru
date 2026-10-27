export type PoiKind = 'food' | 'landmark' | 'hidden' | 'metro' | 'shop' | 'park';

export interface PoiDef {
  id: string;
  name: string;
  district: string;
  kind: PoiKind;
  x: number;
  y: number;
  radius: number;
  /** Hidden places don't appear on the minimap until hinted or found. */
  hidden?: boolean;
  description: string;
  hint?: string;
  /** Real places that inspired this one, shown so players know it's not a faithful recreation. */
  inspiredBy?: string;
}

export interface DiscoveryState {
  discovered: string[];
  hinted: string[];
}

export type PoiVisibility = 'known' | 'unknown' | 'secret';

export function visibilityOf(state: DiscoveryState, poi: PoiDef): PoiVisibility {
  if (state.discovered.includes(poi.id)) return 'known';
  if (!poi.hidden || state.hinted.includes(poi.id)) return 'unknown';
  return 'secret';
}

/** Returns ids discovered by standing at (px, py), and the updated state. */
export function checkDiscoveries(state: DiscoveryState, pois: readonly PoiDef[], px: number, py: number) {
  const found = pois.filter((p) => !state.discovered.includes(p.id) && Math.hypot(p.x - px, p.y - py) <= p.radius);
  if (found.length === 0) return { state, found: [] as PoiDef[] };
  return { state: { ...state, discovered: [...state.discovered, ...found.map((p) => p.id)] }, found };
}

export function addHint(state: DiscoveryState, id: string): { state: DiscoveryState; isNew: boolean } {
  if (state.discovered.includes(id) || state.hinted.includes(id)) return { state, isNew: false };
  return { state: { ...state, hinted: [...state.hinted, id] }, isNew: true };
}
