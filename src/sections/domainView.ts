/**
 * Domains page: a left navigation list and one selected domain.
 *
 * The selection is reflected in the URL hash so a domain can be linked to
 * directly — the carousel on the home page links straight into it.
 */

import { el, qs } from '../lib/dom';
import { DOMAINS, type Domain } from '../data/domains';
import { makeGlyph, prepareGlyphDraw } from '../visuals/glyphs';
import { decisionForDomain } from '../data/decisions';

function triptych(domain: Domain): HTMLElement {
  const cells: Array<[string, string, 'ziggurat' | 'branching' | 'convergence']> = [
    ['State', domain.panels.state, 'ziggurat'],
    ['Futures', domain.panels.futures, 'branching'],
    ['Decision', domain.panels.decision, 'convergence'],
  ];

  return el(
    'div',
    { class: 'panel-triptych' },
    cells.map(([title, body, glyphName]) => {
      const glyph = el('div', { class: 'panel-triptych__glyph glyph' });
      glyph.append(makeGlyph(glyphName, domain.seed));
      return el('div', { class: 'panel-triptych__cell' }, [
        glyph,
        el('span', { class: 'panel-triptych__title' }, [title]),
        el('p', { class: 'panel-triptych__body' }, [body]),
      ]);
    }),
  );
}

function panel(domain: Domain, index: number): HTMLElement {
  const decision = decisionForDomain(domain.id);

  const headline = el('h2', { class: 'domain-panel__headline' });
  headline.innerHTML = domain.headline;
  headline.dataset.lines = '';

  return el(
    'section',
    {
      class: 'domain-panel',
      id: `panel-${domain.id}`,
      'data-domain-panel': domain.id,
      'aria-labelledby': `nav-${domain.id}`,
      hidden: index !== 0,
    },
    [
      headline,
      el('p', { class: 'domain-panel__desc' }, [domain.description]),
      el('div', { class: 'stack stack--sm' }, [
        el('span', { class: 't-label' }, ['Use cases']),
        el(
          'div',
          { class: 'chips' },
          domain.tags.map((tag) => el('span', { class: 'chip' }, [tag])),
        ),
      ]),
      triptych(domain),
      el('div', { class: 'specific-decision ticked' }, [
        el('span', { class: 't-label t-label--bronze' }, ['A specific decision']),
        el('p', { class: 'specific-decision__statement' }, [domain.specific]),
        el(
          'dl',
          { class: 'kv' },
          domain.details.flatMap(([k, v]) => [el('dt', {}, [k]), el('dd', {}, [v])]),
        ),
        ...(decision
          ? [
              el('div', { class: 'callout' }, [
                el('p', { class: 't-small' }, [decision.qualifier]),
              ]),
            ]
          : []),
        el(
          'a',
          {
            class: 'btn btn--bronze',
            href: `mailto:decisions@kaldun.com?subject=${encodeURIComponent(domain.action)}`,
          },
          [domain.action, el('span', { class: 'btn__arrow', 'aria-hidden': 'true' }, ['→'])],
        ),
      ]),
    ],
  );
}

export function initDomainView(root: HTMLElement): void {
  const nav = qs<HTMLElement>('[data-domain-nav]', root);
  const host = qs<HTMLElement>('[data-domain-panels]', root);
  if (!nav || !host) return;

  const panels = DOMAINS.map(panel);
  host.replaceChildren(...panels);

  const buttons = DOMAINS.map((domain, i) =>
    el(
      'button',
      {
        type: 'button',
        class: 'domain-nav__item',
        id: `nav-${domain.id}`,
        'data-domain-nav-item': domain.id,
        'aria-current': String(i === 0),
        'aria-controls': `panel-${domain.id}`,
      },
      [
        el('span', { class: 'domain-nav__ord' }, [String(i + 1).padStart(2, '0')]),
        el('span', { class: 'domain-nav__name' }, [domain.name]),
      ],
    ),
  );
  nav.replaceChildren(...buttons);

  const select = (id: string, pushHash = true): void => {
    const index = DOMAINS.findIndex((d) => d.id === id);
    if (index < 0) return;

    panels.forEach((node, i) => {
      node.hidden = i !== index;
    });
    buttons.forEach((btn, i) => btn.setAttribute('aria-current', String(i === index)));

    const active = panels[index];
    if (active) {
      // Re-run the masked-line reveal for the newly shown headline.
      for (const line of Array.from(active.querySelectorAll('.lines'))) {
        line.classList.remove('is-in');
        void (line as HTMLElement).offsetWidth;
        line.classList.add('is-in');
      }
      for (const node of Array.from(active.querySelectorAll('.glyph'))) node.classList.add('is-in');
    }

    if (pushHash && window.location.hash.slice(1) !== id) {
      history.replaceState(null, '', `#${id}`);
    }
  };

  buttons.forEach((btn, i) => {
    const domain = DOMAINS[i];
    if (!domain) return;
    btn.addEventListener('click', () => select(domain.id));
  });

  prepareGlyphDraw(host);

  const fromHash = window.location.hash.slice(1);
  select(DOMAINS.some((d) => d.id === fromHash) ? fromHash : (DOMAINS[0]?.id ?? ''), false);

  window.addEventListener('hashchange', () => {
    const next = window.location.hash.slice(1);
    if (DOMAINS.some((d) => d.id === next)) select(next, false);
  });
}
