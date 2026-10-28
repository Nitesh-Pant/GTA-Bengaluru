export const TILE = 16;
/** The whole map: the city (CITY_W wide) plus the countryside to its east, with Nandi Hills. */
export const MAP_W = 192;
/** Columns 0..CITY_W-1 are the city; everything east of it is the highway and the hills. */
export const CITY_W = 128;
export const MAP_H = 168;
export const WORLD_W = MAP_W * TILE;
export const WORLD_H = MAP_H * TILE;

export const WALK_SPEED = 78;
export const PLAYER_BODY = { w: 8, h: 6 };

/** Convert tile coordinates (may be fractional) to world pixels. */
export const t = (n: number) => n * TILE;
