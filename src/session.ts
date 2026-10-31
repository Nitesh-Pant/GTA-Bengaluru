import { MARKS } from './data/bucket';
import { TIP_IDS } from './data/tips';
import { DISH_IDS } from './data/food';
import { FESTIVALS } from './data/festivals';
import { POI_IDS } from './data/pois';
import { audio } from './game/audio';
import { bridge } from './game/bridge';
import { destroyGame } from './game/gameHost';
import type { PlayerProfile } from './logic/player';
import { clearSave, loadSave, safeStorage, writeSave, type StorageLike } from './logic/save';
import { uiStore } from './store/uiStore';

/** The save with every id checked against current content (places, dishes, achievements). */
export const loadGameSave = (storage: StorageLike | null = safeStorage()) => loadSave(storage, POI_IDS, { dishes: DISH_IDS, marks: new Set<string>(MARKS), tips: new Set<string>(TIP_IDS), festivals: new Set(FESTIVALS.map((f) => f.id)) });

/** Starts play. A new game passes the profile from the character screen; Continue keeps the saved one. */
export function startGame(fresh: boolean, profile?: PlayerProfile) {
  const storage = safeStorage();
  if (fresh) clearSave(storage);
  const save = loadGameSave(storage);
  if (profile) {
    save.player = profile;
    writeSave(storage, save);
  }
  audio.init(save.settings);
  uiStore.reset();
  uiStore.set({ phase: 'playing', settings: save.settings, player: save.player });
}

export function quitToMenu(reset: boolean) {
  bridge.api?.saveNow();
  // Detach the bridge first so the dying scene can't write another save.
  bridge.api = null;
  destroyGame();
  if (reset) clearSave(safeStorage());
  audio.stopAll();
  uiStore.reset();
}
