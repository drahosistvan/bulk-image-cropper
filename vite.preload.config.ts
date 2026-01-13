import { defineConfig } from 'vite';

// Vite config for Electron preload script
export default defineConfig({
  build: {
    target: 'node20',
    ssr: true,
    // Keep in the same folder as forge's default "main" output
    outDir: '.vite/build',
    emptyOutDir: false,
    rollupOptions: {
      input: 'electron/preload.js',
      output: {
        format: 'cjs',
        entryFileNames: 'preload.cjs',
        chunkFileNames: 'chunks/[name]-[hash].cjs',
        assetFileNames: 'assets/[name]-[hash][extname]'
      },
      external: ['electron', 'path', 'url']
    }
  }
});
