/**
 * Shared bootstrap.
 *
 * `enhance` is the single pass that turns static markup into the live page:
 * glyphs, behaviour, then motion — in that order, so nothing measures a layout
 * that is about to change. `bootstrap` is what a page entry calls; `enhance`
 * and `teardown` are exported so the single-file bundle can re-run the pass
 * when it swaps routes.
 */

import './styles/index.css';

import { initHeader } from './components/header';
import { initCarousels } from './components/carousel';
import { initAllTabs } from './components/tabs';
import { initSequences } from './components/stickySequence';
import { initCounters } from './components/counters';
import { initReveal, resetReveal } from './lib/reveal';
import { initScrollLink, resetScrollLink } from './lib/scrollLink';
import { mountGlyphs } from './visuals/glyphs';
import { ready } from './lib/dom';

/** Run the enhancement pass over a freshly rendered document or subtree. */
export function enhance(root: ParentNode = document, mount?: (root: ParentNode) => void): void {
  mountGlyphs(root);

  try {
    mount?.(root);
  } catch (error) {
    console.error('[kaldun] page mount failed', error);
  }

  initCarousels(root);
  initAllTabs(root);
  initSequences(root);
  initCounters(root);
  initReveal(root);
  initScrollLink(root);
}

/** Release observers and tracked nodes before replacing page content. */
export function teardown(): void {
  resetReveal();
  resetScrollLink();
}

export function bootstrap(mount?: (root: ParentNode) => void): void {
  ready(() => {
    document.documentElement.classList.add('js');
    initHeader();
    enhance(document, mount);
  });
}
