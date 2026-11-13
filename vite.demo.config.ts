import { defineConfig } from 'vite';

/**
 * The demo workspace: a clickable prototype for meetings and live demos.
 * Built on its own into dist-demo/, never into dist/, so it is not deployed.
 * `npm run build:demo` then folds it into one file, dist-demo/demo.html.
 */
export default defineConfig({
  base: './',
  appType: 'mpa',
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 0,
    rollupOptions: { input: { demo: 'demo/index.html' } },
  },
});
