import { defineConfig } from 'vite';

/**
 * One static document. All copy is in index.html, so the page is readable
 * without JavaScript and indexable by crawlers; TypeScript only enhances.
 */
export default defineConfig({
  base: './',
  appType: 'mpa',
  build: {
    target: 'es2020',
    cssMinify: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { home: 'index.html' },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
