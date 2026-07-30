/**
 * Bootstrap. Content in the DOM first, then behaviour, then motion — so nothing
 * measures a layout that is about to change.
 */

import './styles/index.css';

import { initHeader } from './components/header';
import { initReveal } from './lib/reveal';
import { initScrollLink } from './lib/scrollLink';
import { mountGlyphs } from './visuals/glyphs';
import { ready } from './lib/dom';

export function enhance(root: ParentNode = document, mount?: (root: ParentNode) => void): void {
  mountGlyphs(root);

  try {
    mount?.(root);
  } catch (error) {
    console.error('[kaldun] mount failed', error);
  }

  initReveal(root);
  initScrollLink(root);
}

export function bootstrap(mount?: (root: ParentNode) => void): void {
  ready(() => {
    document.documentElement.classList.add('js');
    initHeader();
    enhance(document, mount);
  });
}
