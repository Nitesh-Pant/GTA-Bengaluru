/** BMTC bus stops (tiles): `x, y` is where you stand to board; a shelter prop sits behind it. */
export const BUS_STOPS: Array<{ id: string; name: string; x: number; y: number; shelter: { x: number; y: number } | null }> = [
  { id: 'indiranagar', name: 'Indiranagar 100 Ft Rd', x: 28, y: 22.7, shelter: { x: 28, y: 23.95 } },
  { id: 'marathahalli', name: 'Marathahalli Bridge', x: 106, y: 22.7, shelter: { x: 106, y: 23.95 } },
  { id: 'thippasandra', name: 'Thippasandra', x: 28, y: 62.6, shelter: { x: 28, y: 63.95 } },
  { id: 'krpuram', name: 'KR Puram', x: 121, y: 75.3, shelter: null },
  { id: 'mgroad', name: 'MG Road', x: 20, y: 112.6, shelter: { x: 20, y: 113.95 } },
  { id: 'sonysignal', name: 'Koramangala (Sony Signal)', x: 66, y: 112.6, shelter: { x: 66, y: 113.95 } },
  { id: 'udupigarden', name: 'BTM (Udupi Garden)', x: 116, y: 112.6, shelter: { x: 116, y: 113.95 } },
];

export const busStopById = (id: string | null) => BUS_STOPS.find((b) => b.id === id);

/** BMTC route numbers, shown on the bus that turns up. */
export const BUS_ROUTES = ['500D', '201R', 'G-4', '335E', 'KBS-1'];

/** Pavement spots (tiles) where people wave down autos. */
export const HAIL_SPOTS: Array<{ x: number; y: number }> = [
  { x: 6, y: 17.3 },
  { x: 48, y: 17.3 },
  { x: 100, y: 17.3 },
  { x: 60, y: 22.7 },
  { x: 120, y: 22.7 },
  { x: 10, y: 56.9 },
  { x: 70, y: 56.9 },
  { x: 120, y: 56.9 },
  { x: 16, y: 63 },
  { x: 76, y: 63 },
  { x: 100, y: 63 },
  { x: 30, y: 106.9 },
  { x: 74, y: 106.9 },
  { x: 100, y: 112.8 },
  { x: 48, y: 112.8 },
];
