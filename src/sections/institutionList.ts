/**
 * Explicit form factors: who runs Kaldun, on which decision, through which
 * surface. No logo wall, no implied customers — just the shape of the buyer.
 */

import { el } from '../lib/dom';
import { INSTITUTIONS, SURFACES } from '../data/institutions';

export function renderInstitutions(root: HTMLElement): void {
  const rows = INSTITUTIONS.map((institution, i) =>
    el('li', { class: 'institution', 'data-reveal': 'fade' }, [
      el('span', { class: 'institution__ord' }, [String(i + 1).padStart(2, '0')]),
      el('h3', { class: 'institution__who' }, [institution.who]),
      el('p', { class: 'institution__what' }, [institution.what]),
      el('span', { class: 'institution__mode' }, [institution.mode]),
    ]),
  );
  root.replaceChildren(...rows);
}

export function renderSurfaces(root: HTMLElement): void {
  const cards = SURFACES.map((surface, i) =>
    el('article', { class: 'surface-card ticked', 'data-reveal': 'rise' }, [
      el('span', { class: 't-label t-label--bronze' }, [String(i + 1).padStart(2, '0')]),
      el('h3', { class: 'surface-card__title' }, [surface.name]),
      el('p', { class: 'surface-card__body' }, [surface.body]),
      el(
        'dl',
        { class: 'kv' },
        surface.detail.flatMap(([k, v]) => [el('dt', {}, [k]), el('dd', {}, [v])]),
      ),
    ]),
  );
  root.replaceChildren(...cards);
}
