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
 * The markup is never re-authored here: the built document's body is used
 * verbatim, so the bundle cannot drift from the site.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT_DIR = join(ROOT, 'dist-artifact');

const PAGE = 'index.html';

const TITLE_RE = /<title>([\s\S]*?)<\/title>/;
const BODY_RE = /<body[^>]*>([\s\S]*)<\/body>/;
const MODULE_SCRIPT_RE = /<script\s+type="module"[^>]*><\/script>\s*/g;

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
  const html = await readFile(join(DIST, PAGE), 'utf8');
  const body = BODY_RE.exec(html)?.[1];
  const title = TITLE_RE.exec(html)?.[1]?.trim();
  if (!body || !title) throw new Error(`could not parse ${PAGE}`);

  const shell = body.replace(MODULE_SCRIPT_RE, '').trim();

  const cssPath = await findOne(OUT_DIR, '.css');
  const jsPath = await findOne(OUT_DIR, '.js');
  const css = await inlineFonts(await readFile(cssPath, 'utf8'));
  const js = await readFile(jsPath, 'utf8');

  const doc = `<title>${title}</title>
<style>
${css}
</style>
${shell}
<script>
${js}
</script>
`;

  const target = join(OUT_DIR, 'kaldun.html');
  await writeFile(target, doc, 'utf8');

  const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
  console.log(`kaldun.html  ${kb(Buffer.byteLength(doc))}  (css ${kb(css.length)}, js ${kb(js.length)})`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
