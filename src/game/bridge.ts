import type { JobKind } from '../data/jobs';
import type { PlayerProfile } from '../logic/player';
import type { Settings } from '../logic/save';

/** Things "Show me" and Find a ride can point at ('yulu' covers every bike: Yulu and rental scooters). */
export const GUIDE_KINDS = ['yulu', 'auto', 'bus', 'metro', 'car'] as const;
export type GuideKind = (typeof GUIDE_KINDS)[number];

export interface NearbyRide {
  kind: GuideKind;
  label: string;
  /** World pixels from the player. */
  distance: number;
}

export interface MinimapSnapshot {
  x: number;
  y: number;
  angle: number;
  driving: boolean;
  rideables: Array<{ x: number; y: number }>;
  /** Job givers on offer right now (the "!" markers). */
  jobs: Array<{ x: number; y: number }>;
  /** The active marker (destination or guide) and the dotted route to it, in world px. */
  target: { x: number; y: number } | null;
  route: ReadonlyArray<{ x: number; y: number }>;
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
  /** The nearest of each kind, for the Find a ride panel. */
  nearestRides(): NearbyRide[];
  /** The nearest giver of each open job (delivery, auto fares, tech quiz), for Find. */
  nearestJobs(): Array<{ kind: JobKind; label: string; distance: number }>;
  /** Mark the nearest giver of this job. */
  showJob(kind: JobKind): void;
  /** Start the job pitched by uiStore.jobOffer, or quieten that giver for a while. */
  acceptJob(id: string, alt?: boolean): void;
  /** Photo mode: a clean shot of the world (no HUD), zoom to frame it, and back to normal. */
  takePhoto(): Promise<{ image: HTMLImageElement; focus: { x: number; y: number } }>;
  photoZoom(factor: number): void;
  endPhoto(): void;
  /** Count a postcard made (for the achievement). */
  notePostcard(): void;
  snoozeJob(id: string): void;
  /** Board a BMTC bus from the open stop to another stop. */
  takeBus(toStopId: string): void;
}

export const bridge: { api: GameApi | null } = { api: null };
