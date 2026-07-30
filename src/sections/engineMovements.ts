/**
 * The Engine's four public movements, as a row of framed cards.
 * No component names, no model stack — the public explanation only.
 */

import { el } from '../lib/dom';
import { ENGINE_MOVEMENTS } from '../data/engine';
import { makeGlyph, prepareGlyphDraw } from '../visuals/glyphs';

export function renderEngineMovements(root: HTMLElement): void {
  const cards = ENGINE_MOVEMENTS.map((step) => {
    const glyph = el('div', { class: 'glyph movement__glyph' });
    glyph.append(makeGlyph(step.glyph, step.seed));

    return el('article', { class: 'movement', 'data-reveal': 'rise' }, [
      el('div', { class: 'movement__head' }, [
        el('span', { class: 'movement__ord' }, [step.ordinal]),
        glyph,
      ]),
      el('h3', { class: 'movement__title' }, [step.title]),
      el('p', { class: 'movement__body' }, [step.body]),
      el(
        'dl',
        { class: 'kv movement__detail' },
        step.detail.flatMap(([k, v]) => [el('dt', {}, [k]), el('dd', {}, [v])]),
      ),
    ]);
  });

  root.replaceChildren(...cards);
  prepareGlyphDraw(root);
}
