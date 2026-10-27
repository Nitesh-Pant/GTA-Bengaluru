import { createRoot } from 'react-dom/client';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/press-start-2p/400.css';
import './styles.css';
import { App } from './App';

// No StrictMode: its dev-only double mount would spin up and tear down a Phaser game for nothing.
// The game host still guarantees a single instance either way.
createRoot(document.getElementById('root')!).render(<App />);
