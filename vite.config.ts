import { defineConfig } from 'vite';

/**
 * Multi-page static build. Every route is a real HTML document so the copy is
 * readable without JavaScript and indexable by crawlers; TypeScript only
 * enhances (motion, carousels, canvases, tabs).
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
        engine: 'engine.html',
        domains: 'domains.html',
        record: 'record.html',
        project: 'project-10191.html',
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
