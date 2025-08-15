import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
    plugins: [vue()],
    css: {
        postcss: './postcss.config.js',
    },
    base: './',
    server: { port: 5173, strictPort: true },
    build: { outDir: 'dist', emptyOutDir: true },
});
