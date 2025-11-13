import { defineConfig } from 'vite';

// Vite config for Electron main process
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['sharp', 'p-limit']
    }
  }
});

