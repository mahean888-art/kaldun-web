/**
 * The Engine page's seven-part pinned sequence.
 * Rail on the left, one card at a time on the right, driven by page scroll.
 */

import { el } from '../lib/dom';
import { ENGINE_SEQUENCE } from '../data/engine';
import { makeGlyph, prepareGlyphDraw } from '../visuals/glyphs';

export function renderEngineSequence(rail: HTMLElement, stage: HTMLElement): void {
  rail.replaceChildren(
    ...ENGINE_SEQUENCE.map((step, i) =>
      el(
        'button',
        {
          type: 'button',
          class: 'sequence__rail-item',
          'data-sequence-rail-item': '',
          'aria-selected': String(i === 0),
        },
        [`${step.ordinal} — ${step.title}`],
      ),
    ),
  );

  stage.replaceChildren(
    ...ENGINE_SEQUENCE.map((step, i) => {
      const glyph = el('div', { class: 'sequence__card-glyph glyph' });
      glyph.append(makeGlyph(step.glyph, step.seed));

      return el(
        'article',
        {
          class: `sequence__card${i === 0 ? ' is-active' : ''}`,
          'data-sequence-card': '',
          'aria-hidden': String(i !== 0),
        },
        [
          el('div', { class: 'sequence__card-head' }, [
            el('span', { class: 'sequence__card-ord' }, [step.ordinal]),
            el('h3', { class: 'sequence__card-title' }, [step.title]),
          ]),
          el('p', { class: 'sequence__card-body' }, [step.body]),
          el('div', { class: 'sequence__card-figure' }, [
            el(
              'dl',
              { class: 'kv' },
              step.detail.flatMap(([k, v]) => [el('dt', {}, [k]), el('dd', {}, [v])]),
            ),
            glyph,
          ]),
        ],
      );
    }),
  );

  prepareGlyphDraw(stage);
  // Cards are absolutely positioned and revealed by the sequence, so their
  // glyph strokes must not wait for an IntersectionObserver hit.
  for (const node of Array.from(stage.querySelectorAll('.glyph'))) node.classList.add('is-in');
}
