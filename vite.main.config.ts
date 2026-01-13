import { defineConfig } from 'vite';

// Vite config for Electron main process
export default defineConfig({
  build: {
    // Electron main is loaded by Node/Electron. Keep output deterministic and ESM.
    target: 'node20',
    ssr: true,
    outDir: '.vite/build',
    emptyOutDir: true,
    rollupOptions: {
      input: 'electron/main.js',
      output: {
        format: 'cjs',
        entryFileNames: 'main.cjs',
        chunkFileNames: 'chunks/[name]-[hash].cjs',
        assetFileNames: 'assets/[name]-[hash][extname]'
      },
      // Keep runtime deps external (especially native modules like sharp)
      external: ['electron', 'sharp', 'path', 'fs', 'url']
    }
  }
});
