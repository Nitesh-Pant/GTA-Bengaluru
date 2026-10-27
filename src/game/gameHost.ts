/**
 * Owns the single game instance. React components may mount/unmount (or StrictMode may
 * double-invoke effects), but there is never more than one live game.
 */
export interface Destroyable {
  destroy(removeCanvas: boolean): void;
}

let current: { game: Destroyable; parent: HTMLElement } | null = null;
let created = 0;

export function ensureGame<T extends Destroyable>(parent: HTMLElement, factory: (parent: HTMLElement) => T): T {
  if (current && current.parent === parent) return current.game as T;
  if (current) destroyGame();
  const game = factory(parent);
  created++;
  current = { game, parent };
  return game;
}

export function destroyGame() {
  if (!current) return;
  current.game.destroy(true);
  current = null;
}

export const liveGameCount = () => (current ? 1 : 0);
export const totalGamesCreated = () => created;
