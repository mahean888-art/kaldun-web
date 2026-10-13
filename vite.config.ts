import { defineConfig } from 'vite';

/**
 * Two static documents: the launch essay, and its interactive example. All
 * copy is in the HTML, so each page is readable without JavaScript and
 * indexable by crawlers; TypeScript only enhances.
 */
export default defineConfig({
  base: './',
  appType: 'mpa',
  build: {
    target: 'es2020',
    cssMinify: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { home: 'index.html', example: 'example/index.html' },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
