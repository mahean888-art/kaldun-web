/**
 * Shared bootstrap. Every page calls this first, then adds its own modules.
 */

import './styles/index.css';

import { initHeader } from './components/header';
import { initCarousels } from './components/carousel';
import { initAllTabs } from './components/tabs';
import { initSequences } from './components/stickySequence';
import { initCounters } from './components/counters';
import { initReveal } from './lib/reveal';
import { initScrollLink } from './lib/scrollLink';
import { mountGlyphs } from './visuals/glyphs';
import { ready } from './lib/dom';

/**
 * Order: content in the DOM first (glyphs), then behaviour, then motion, so
 * nothing measures a layout that is about to change.
 */
export function bootstrap(pageInit?: () => void): void {
  ready(() => {
    document.documentElement.classList.add('js');

    mountGlyphs();
    initHeader();

    try {
      pageInit?.();
    } catch (error) {
      console.error('[kaldun] page init failed', error);
    }

    initCarousels();
    initAllTabs();
    initSequences();
    initCounters();
    initReveal();
    initScrollLink();
  });
}
