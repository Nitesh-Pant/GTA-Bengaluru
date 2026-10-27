import { describe, expect, it } from 'vitest';
import { destroyGame, ensureGame, liveGameCount, totalGamesCreated } from '../src/game/gameHost';

const parent = {} as HTMLElement;

describe('game host', () => {
  it('reuses the existing game across repeated mounts', () => {
    let destroyed = 0;
    const factory = () => ({ destroy: () => void destroyed++ });
    const before = totalGamesCreated();
    const a = ensureGame(parent, factory);
    const b = ensureGame(parent, factory);
    expect(a).toBe(b);
    expect(totalGamesCreated() - before).toBe(1);
    expect(liveGameCount()).toBe(1);
    destroyGame();
    expect(destroyed).toBe(1);
    expect(liveGameCount()).toBe(0);
    destroyGame(); // idempotent
    expect(destroyed).toBe(1);
  });
  it('a StrictMode-style mount/unmount/mount ends with exactly one live game', () => {
    const live = new Set<object>();
    const factory = () => {
      const g = { destroy: () => void live.delete(g) };
      live.add(g);
      return g;
    };
    ensureGame(parent, factory);
    destroyGame();
    ensureGame(parent, factory);
    expect(live.size).toBe(1);
    expect(liveGameCount()).toBe(1);
    destroyGame();
    expect(live.size).toBe(0);
  });
});
