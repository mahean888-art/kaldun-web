#!/usr/bin/env node
/**
 * Assemble the self-contained single-file build.
 *
 * Inputs (both produced by `npm run build:all`):
 *   dist/                 the real multi-page site — the markup comes from here
 *   dist-artifact/        one JS + one CSS bundle for the hash-router entry
 *
 * Output:
 *   dist-artifact/kaldun.html   one file, no external requests: CSS, JS and the
 *                               five woff2 faces are all inlined
 *
 * The markup is never re-authored here. Each page's <main> is lifted verbatim
 * out of the built document, so the bundle cannot drift from the site.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT_DIR = join(ROOT, 'dist-artifact');

const PAGES = [
  { id: 'home', file: 'index.html' },
  { id: 'engine', file: 'engine.html' },
  { id: 'domains', file: 'domains.html' },
  { id: 'record', file: 'record.html' },
  { id: 'project', file: 'project-10191.html' },
];

const MAIN_RE = /<main[\s\S]*<\/main>/;
const TITLE_RE = /<title>([\s\S]*?)<\/title>/;
const BODY_RE = /<body[^>]*>([\s\S]*)<\/body>/;
const MODULE_SCRIPT_RE = /<script\s+type="module"[^>]*><\/script>\s*/g;

/** Embed JSON in a <script> without letting a literal end-tag escape it. */
const safeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

async function inlineFonts(css) {
  const names = [...css.matchAll(/url\(([^)]*?([\w-]+\.woff2))\)/g)];
  let out = css;
  for (const [, full, base] of names) {
    const bytes = await readFile(join(DIST, 'fonts', base));
    const data = `data:font/woff2;base64,${bytes.toString('base64')}`;
    out = out.split(`url(${full})`).join(`url(${data})`);
  }
  return out;
}

async function findOne(dir, ext) {
  const files = await readdir(dir);
  const hit = files.find((name) => name.endsWith(ext));
  if (!hit) throw new Error(`no ${ext} file in ${dir} — run the builds first`);
  return join(dir, hit);
}

const main = async () => {
  const pages = [];
  let shell = null;

  for (const { id, file } of PAGES) {
    const html = await readFile(join(DIST, file), 'utf8');
    const body = BODY_RE.exec(html)?.[1];
    const mainBlock = MAIN_RE.exec(html)?.[0];
    const title = TITLE_RE.exec(html)?.[1]?.trim();
    if (!body || !mainBlock || !title) throw new Error(`could not parse ${file}`);

    pages.push({ id, title, main: mainBlock });

    if (id === 'home') {
      // The chrome is identical on every route, so the home document supplies
      // it once and only <main> is swapped.
      shell = body
        .replace(MAIN_RE, '<div id="main" data-route-host></div>')
        .replace(MODULE_SCRIPT_RE, '')
        .trim();
    }
  }

  const cssPath = await findOne(OUT_DIR, '.css');
  const jsPath = await findOne(OUT_DIR, '.js');
  const css = await inlineFonts(await readFile(cssPath, 'utf8'));
  const js = await readFile(jsPath, 'utf8');

  const doc = `<title>Kaldun — machine foresight</title>
<style>
${css}
</style>
${shell}
<script>window.__KALDUN_PAGES__ = ${safeJson(pages)};</script>
<script>
${js}
</script>
`;

  const target = join(OUT_DIR, 'kaldun.html');
  await writeFile(target, doc, 'utf8');

  const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
  console.log(`kaldun.html  ${kb(Buffer.byteLength(doc))}  (css ${kb(css.length)}, js ${kb(js.length)})`);
  console.log(`routes: ${pages.map((p) => '#/' + p.id).join(' ')}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
