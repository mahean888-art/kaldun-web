import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';

/** One footer for every page: src/partials/footer.html, injected at <!-- @footer -->. */
const footer = (): Plugin => ({
  name: 'fm-footer',
  transformIndexHtml: (html) =>
    html
      .replace('<!-- @footer -->', readFileSync('src/partials/footer.html', 'utf8'))
      .replace('<!-- @film -->', readFileSync('src/partials/film.svg', 'utf8')),
});

/**
 * Static documents: the homepage and the Journal. All copy is in the HTML, so
 * each page is readable without JavaScript and indexable by crawlers;
 * TypeScript only enhances.
 */
export default defineConfig({
  base: './',
  appType: 'mpa',
  plugins: [footer()],
  build: {
    target: 'es2020',
    cssMinify: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        home: 'index.html',
        journal: 'journal/index.html',
        manifesto: 'journal/the-future-should-be-engineered-with-foresight/index.html',
        discuss: 'discuss/index.html',
        notfound: '404.html',
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
