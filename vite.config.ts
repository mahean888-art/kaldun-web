import { defineConfig } from 'vite';

/**
 * Static documents: the homepage and the Journal. All copy is in the HTML, so
 * each page is readable without JavaScript and indexable by crawlers;
 * TypeScript only enhances.
 */
export default defineConfig({
  base: './',
  appType: 'mpa',
  build: {
    target: 'es2020',
    cssMinify: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        home: 'index.html',
        introducing: 'journal/introducing-foresight-machines/index.html',
        manifesto: 'journal/the-future-should-be-engineered-with-foresight/index.html',
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
