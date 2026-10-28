import { lazy, Suspense, useEffect } from 'react';
import { bridge } from './game/bridge';
import { loadGame } from './game/loadGame';
import { uiStore, useUi } from './store/uiStore';
import { DialoguePanel } from './ui/DialoguePanel';
import { isTouchDevice } from './game/touch';
import { Footer } from './ui/Footer';
import { Hud } from './ui/Hud';
import { Journal } from './ui/Journal';
import { MainMenu } from './ui/MainMenu';
import { MapPanel } from './ui/MapPanel';
import { MetroPanel } from './ui/MetroPanel';
import { NarrationPanel } from './ui/NarrationPanel';
import { PauseMenu } from './ui/PauseMenu';
import { CharacterPanel } from './ui/CharacterSetup';
import { QuickBar } from './ui/QuickBar';
import { RidePanel } from './ui/RidePanel';
import { FindPanel } from './ui/FindPanel';
import { JobOffer } from './ui/JobOffer';
import { BusPanel } from './ui/BusPanel';
import { Tour } from './ui/Tour';
import { TouchControls } from './ui/TouchControls';

const PhaserGame = lazy(() => loadGame().then((m) => ({ default: m.PhaserGame })));

/** One owner for global keys: Esc closes the top-most panel or toggles pause; J journal; M map. */
function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = uiStore.get();
      if (s.phase !== 'playing' || !s.ready) return;
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        e.preventDefault();
        if (s.dialogue) bridge.api?.closeDialogue();
        else if (s.metro) {
          if (!s.metro.travelling) bridge.api?.closeMetro();
        } else if (s.narration) bridge.api?.closeNarration();
        else if (s.panel === 'pause') {
          uiStore.set({ panel: null });
          bridge.api?.setPaused(false);
        } else if (s.panel) uiStore.set({ panel: null });
        else {
          uiStore.set({ panel: 'pause' });
          bridge.api?.setPaused(true);
        }
        return;
      }
      if (s.dialogue || s.metro || s.narration || s.panel === 'pause' || e.repeat) return;
      if (k === 'j') uiStore.set({ panel: s.panel === 'journal' ? null : 'journal' });
      if (k === 'm') uiStore.set({ panel: s.panel === 'map' ? null : 'map' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function App() {
  const phase = useUi((s) => s.phase);
  useGlobalKeys();
  if (phase === 'menu')
    return (
      <>
        <MainMenu />
        <Footer />
      </>
    );
  return (
    <>
      <Suspense fallback={<div className="loading">Loading the city… swalpa wait maadi</div>}>
        <PhaserGame />
      </Suspense>
      <Hud />
      <DialoguePanel />
      <MetroPanel />
      <NarrationPanel />
      <Journal />
      <MapPanel />
      <PauseMenu />
      <QuickBar />
      <RidePanel />
      <FindPanel />
      <JobOffer />
      <BusPanel />
      <Tour />
      <CharacterPanel />
      {isTouchDevice() && <TouchControls />}
      <Footer />
    </>
  );
}
