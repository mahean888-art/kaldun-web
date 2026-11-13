#!/usr/bin/env node
/**
 * Fold the demo build into one self-contained file: dist-demo/demo.html.
 * CSS, JS and fonts are inlined, so it opens from disk with no network.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist-demo');

const assets = join(OUT, 'assets');
const files = await readdir(assets);
const js = await readFile(join(assets, files.find((f) => f.endsWith('.js'))), 'utf8');
let css = await readFile(join(assets, files.find((f) => f.endsWith('.css'))), 'utf8');
for (const [, full, base] of [...css.matchAll(/url\(([^)]*?([\w-]+\.woff2))\)/g)]) {
  let bytes;
  try { bytes = await readFile(join(OUT, 'fonts', base)); } catch { bytes = await readFile(join(ROOT, 'public', 'fonts', base)); }
  css = css.split(`url(${full})`).join(`url(data:font/woff2;base64,${bytes.toString('base64')})`);
}
let html = await readFile(join(OUT, 'demo', 'index.html'), 'utf8');
html = html
  .replace(/<script type="module"[^>]*><\/script>/, '')
  .replace(/<link rel="stylesheet"[^>]*>/, '')
  .replace(/<link rel="icon"[^>]*>/, '')
  .replace('</head>', `<style>${css}</style>\n<script type="module">${js.replace(/<\/script/g, '<\\/script')}</script>\n</head>`);
await writeFile(join(OUT, 'demo.html'), html);
console.log(`dist-demo/demo.html  ${(html.length / 1024).toFixed(0)} kB`);
