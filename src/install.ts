import { useSyncExternalStore } from 'react';
import { isTouchDevice } from './game/touch';
import { safeStorage } from './logic/save';

/** Chrome/Edge/Samsung's install offer; not in the DOM typings yet. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const ASKED_KEY = 'bsam.installAsked';

let offer: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Call once at startup: the browser fires its install offer early and only once per page. */
export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep the browser's own mini-bar away; the menu asks instead
    offer = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    offer = null;
    installed = true;
    notify();
  });
}

/** Already running as the installed app (home-screen icon), not in a browser tab. */
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as { standalone?: boolean }).standalone === true;

/** iPhone and iPad (iPadOS reports itself as a Mac with touch). Safari has no install button to press for them. */
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);

/** Phones and tablets in a browser tab are offered the app; desktops and the app itself are not. */
export const shouldOfferInstall = () => isTouchDevice() && !isStandalone();

export const wasAsked = () => safeStorage()?.getItem(ASKED_KEY) === '1';
export const markAsked = () => safeStorage()?.setItem(ASKED_KEY, '1');

/**
 * 'prompt': the browser's own install dialog can open right now.
 * 'manual': the player adds it from the browser menu (iPhone, Firefox, or before the offer arrives).
 * 'installed': done this session.
 */
export type InstallMode = 'prompt' | 'manual' | 'installed';
const mode = (): InstallMode => (installed ? 'installed' : offer ? 'prompt' : 'manual');

export function useInstallMode() {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, mode);
}

/** Opens the browser's install dialog. Resolves true when the player accepts. */
export async function installApp() {
  const e = offer;
  if (!e) return false;
  offer = null; // the event can only be used once
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'accepted') installed = true;
  notify();
  return outcome === 'accepted';
}
