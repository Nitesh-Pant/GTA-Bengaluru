import { createRoot } from 'react-dom/client';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/press-start-2p/400.css';
import './styles.css';
import { App } from './App';
import { listenForInstall } from './install';

// No StrictMode: its dev-only double mount would spin up and tear down a Phaser game for nothing.
// The game host still guarantees a single instance either way.
createRoot(document.getElementById('root')!).render(<App />);
listenForInstall();

// Installable and playable offline (production builds only; dev keeps hot reload simple).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = performance
          .getEntriesByType('resource')
          .map((r) => r.name)
          .filter((u) => u.startsWith(location.origin));
        reg.active?.postMessage({ type: 'cache', urls: [location.href, ...urls] });
      })
      .catch(() => {
        /* no offline support in this browser: the game still works online */
      });
  });
}
