import type { PlayerProfile } from '../logic/player';
import type { Settings } from '../logic/save';

/** Things the tour's "Show me" buttons can point at. */
export type GuideKind = 'yulu' | 'car' | 'auto' | 'bus' | 'metro';

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
  /** Same as pressing E. */
  interact(): void;
  /** Same as pressing H. */
  horn(): void;
  /** Change name, gender or outfit mid-game. */
  setProfile(profile: PlayerProfile): void;
  /** Jump the city clock to a time of day (minutes since midnight). */
  setTime(minutes: number): void;
  /** Book a bike taxi to one of rideDestinations(). */
  bookRide(destId: string): void;
  /** Open the bike-taxi panel (same as R). */
  openRide(): void;
  /** Cancel a job shown on the HUD (see uiStore.jobs). */
  cancelJob(id: string): void;
  /** Mark the nearest one of `kind` with a guide marker (cleared when you get there). */
  showNearest(kind: GuideKind): void;
  /** Board a BMTC bus from the open stop to another stop. */
  takeBus(toStopId: string): void;
}

export const bridge: { api: GameApi | null } = { api: null };
