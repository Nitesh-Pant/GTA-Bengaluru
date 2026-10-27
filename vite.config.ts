import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Vite refuses to serve any file whose path contains ':' (Windows drive/stream hardening),
      // which includes every file in a folder named like "GTA:Bangalore". Strict serving is only
      // relaxed in that case; renaming the folder restores Vite's default.
      strict: !root.includes(':'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
