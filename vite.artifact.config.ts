import { defineConfig } from 'vite';

/**
 * Second build target: one JS file and one CSS file for the self-contained
 * single-page bundle. `scripts/build-artifact.mjs` inlines both, plus the fonts
 * and the built markup, into a single shareable HTML file.
 *
 * This exists only for distribution. The site itself is the multi-page build in
 * vite.config.ts.
 */
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    cssCodeSplit: false,
    target: 'es2020',
    lib: {
      entry: 'src/pages/home.ts',
      formats: ['iife'],
      name: 'KaldunArtifact',
      fileName: () => 'kaldun.js',
    },
  },
});
