/**
 * Page composition. The prose lives in index.html; this fills in the parts
 * driven by data, starts the figures, and points every action at the
 * decision moment.
 */

import { el, qs, qsa } from './lib/dom';
import { mountMarks } from './visuals/mark';
import { initFan } from './visuals/fan';
import { initInstrument } from './visuals/instrument';
import { initGlyph } from './visuals/glyphs';
import { initRotor } from './components/rotor';
import { initFitText } from './components/fitText';
import { initDecision } from './components/decision';
import { DOMAINS } from './data/domains';
import { AREAS } from './data/areas';
import { EMAIL, RECORD_FIELDS } from './data/site';

function wireEmail(root: ParentNode): void {
  for (const node of qsa<HTMLAnchorElement>('[data-email]', root)) {
    node.href = `mailto:${EMAIL}`;
    if (!node.textContent?.trim()) node.textContent = EMAIL;
  }
}

export function mountHome(root: ParentNode = document): void {
  mountMarks(root);
  initRotor(root);
  initFitText(root);
  wireEmail(root);
  initDecision(root);

  const fan = qs<HTMLCanvasElement>('[data-fan]', root);
  if (fan) initFan(fan);

  const instrument = qs<HTMLElement>('[data-instrument]', root);
  if (instrument) initInstrument(instrument);

  const domains = qs('[data-domains]', root);
  if (domains) {
    domains.replaceChildren(
      ...DOMAINS.map((d) => {
        const glyph = el('canvas', { class: 'run__glyph' }) as unknown as HTMLCanvasElement;
        const block = el('article', { class: 'run', 'data-reveal': 'fade' }, [
          el('div', { class: 'run__meta' }, [
            el('span', { class: 'run__ord' }, [d.ordinal]),
            el('h3', { class: 'run__label' }, [d.label]),
            el('p', { class: 'run__tagline' }, [d.tagline]),
            glyph,
          ]),
          el(
            'ul',
            { class: 'run__questions' },
            d.questions.map((q) => el('li', {}, [q])),
          ),
        ]);
        // Mounted after insertion, when the canvas has a box to measure.
        queueMicrotask(() => initGlyph(glyph, Number(d.ordinal) * 733));
        return block;
      }),
    );
  }

  const spec = qs('[data-record-spec]', root);
  if (spec) {
    spec.replaceChildren(
      ...RECORD_FIELDS.map(([key, value]) =>
        el('div', { class: 'spec__row' }, [
          el('span', { class: 'spec__key' }, [key]),
          el('span', { class: 'spec__value' }, [value]),
        ]),
      ),
    );
  }

  const areas = qs('[data-areas]', root);
  if (areas) {
    areas.replaceChildren(
      ...AREAS.map((area, i) =>
        el('li', { class: 'area' }, [
          el('span', { class: 'area__ord' }, [String(i + 1).padStart(2, '0')]),
          el('span', { class: 'area__name' }, [area.name]),
          el('span', { class: 'area__q' }, [area.question]),
        ]),
      ),
    );
  }
}
