import { POI_IDS } from './data/pois';
import { audio } from './game/audio';
import { bridge } from './game/bridge';
import { destroyGame } from './game/gameHost';
import { clearSave, loadSave, safeStorage } from './logic/save';
import { uiStore } from './store/uiStore';

export function startGame(fresh: boolean) {
  const storage = safeStorage();
  if (fresh) clearSave(storage);
  const save = loadSave(storage, POI_IDS);
  audio.init(save.settings);
  uiStore.reset();
  uiStore.set({ phase: 'playing', settings: save.settings });
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
