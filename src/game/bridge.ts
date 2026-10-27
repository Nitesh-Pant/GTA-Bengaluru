import type { Settings } from '../logic/save';

export interface MinimapSnapshot {
  x: number;
  y: number;
  angle: number;
  driving: boolean;
  rideables: Array<{ x: number; y: number }>;
}

/** Commands React can send into the running world. Set by WorldScene on create, cleared on shutdown. */
export interface GameApi {
  chooseOption(index: number): void;
  closeDialogue(): void;
  travel(stationId: string): void;
  closeMetro(): void;
  closeNarration(): void;
  setDestination(poiId: string | null): void;
  setPaused(paused: boolean): void;
  updateSettings(patch: Partial<Settings>): void;
  snapshot(): MinimapSnapshot | null;
  saveNow(): void;
}

export const bridge: { api: GameApi | null } = { api: null };
