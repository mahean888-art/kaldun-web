/**
 * The Engine, demonstrated on a real question.
 *
 * The question is a live public forecasting question. The evidence rows are
 * published figures from the IEA and Berkeley Lab, each linked. The futures pane
 * shows the *shape* of Engine output — explicit outcomes, odds, dependencies,
 * and what would change the view — and is labelled illustrative, because Kaldun
 * has not published a resolved forecast on this question.
 *
 * Nothing here is invented and presented as measured. That distinction is the
 * whole product.
 */

import { el } from '../lib/dom';
import { DEMO_EVIDENCE, SOURCES } from '../data/sources';

type Future = {
  label: string;
  odds: number;
  depends: string;
};

const FUTURES: Future[] = [
  {
    label: 'Data-centre demand grows near the base case; the 10% threshold is not reached',
    odds: 58,
    depends: 'Efficiency gains hold; buildout stays inside grid capacity',
  },
  {
    label: 'Buildout outruns the base case but grid access binds before 2030',
    odds: 24,
    depends: 'Interconnection queues stay above five years',
  },
  {
    label: 'Accelerated-server growth exceeds 30% a year and the threshold is reached',
    odds: 12,
    depends: 'Power procured outside the queue at scale',
  },
  {
    label: 'Demand growth stalls on capital or supply constraints',
    odds: 6,
    depends: 'Financing or accelerator supply interrupted for over a year',
  },
];

const WOULD_MOVE: string[] = [
  'Two consecutive quarters of accelerated-server shipments above plan',
  'A change in median interconnection duration of more than nine months',
  'Any measure that moves large loads outside the queue',
];

function evidenceRows(): HTMLElement[] {
  return DEMO_EVIDENCE.map((item) => {
    const dir = item.direction === 'up' ? '↑' : item.direction === 'down' ? '↓' : '→';
    return el('div', { class: 'evidence' }, [
      el('span', { class: 'evidence__dir', 'data-dir': item.direction, 'aria-hidden': 'true' }, [dir]),
      el('span', { class: 'evidence__claim' }, [item.claim]),
      el('span', { class: 'evidence__figure' }, [item.figure]),
      el('a', {
        class: 'evidence__source',
        href: item.source.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        text: item.source.publisher,
      }),
    ]);
  });
}

function futureRows(): HTMLElement[] {
  return FUTURES.map((future) => {
    const fill = el('span', { class: 'meter__fill' });
    fill.style.setProperty('--v', String(future.odds));
    return el('div', { class: 'future' }, [
      el('span', { class: 'future__label' }, [future.label]),
      el('span', { class: 'future__odds' }, [`${future.odds}%`]),
      el('div', { class: 'future__meter meter' }, [fill]),
      el('span', { class: 'future__note' }, [`Depends on — ${future.depends}`]),
    ]);
  });
}

export function renderEngineDemo(root: HTMLElement): void {
  const metaculus = SOURCES.metaculus;

  const console_ = el('div', { class: 'console', 'data-reveal': 'rise' }, [
    el('div', { class: 'console__bar' }, [
      el('span', { class: 'console__dot' }),
      el('span', {}, ['Kaldun Console']),
      el('span', { class: 'console__bar-sep' }, ['/']),
      el('span', {}, ['Question 15610']),
      el('span', { class: 'console__bar-right' }, ['State updated continuously']),
    ]),

    el('div', { class: 'console__question' }, [
      el('span', { class: 't-label' }, ['Question']),
      el('h3', { class: 'console__question-text' }, [
        'Will data centres consume more than 10% of global electricity usage in 2030?',
      ]),
      el('div', { class: 'console__question-meta' }, [
        el('span', {}, ['Horizon — to 31 December 2030']),
        el('span', { class: 'console__bar-sep' }, ['·']),
        el('span', {}, ['Resolution — published global electricity statistics']),
        el('span', { class: 'console__bar-sep' }, ['·']),
        ...(metaculus
          ? [
              el('a', {
                class: 'evidence__source',
                href: metaculus.url,
                target: '_blank',
                rel: 'noopener noreferrer',
                text: 'Public question on Metaculus',
              }),
            ]
          : []),
      ]),
    ]),

    el('div', { class: 'console__body console__body--split' }, [
      el('div', { class: 'console__pane' }, [
        el('div', { class: 'console__pane-title' }, [
          el('span', {}, ['Know the state']),
          el('span', { class: 'footnote' }, ['Sourced']),
        ]),
        el('div', { class: 'evidence-list' }, evidenceRows()),
      ]),

      el('div', { class: 'console__pane' }, [
        el('div', { class: 'console__pane-title' }, [
          el('span', {}, ['Make the futures explicit']),
          el('span', { class: 'footnote' }, ['Illustrative']),
        ]),
        el('div', { class: 'futures-list' }, futureRows()),
        el('div', { class: 'console__moves' }, [
          el('span', { class: 't-label' }, ['What would change the view']),
          el(
            'ul',
            { class: 'console__moves-list' },
            WOULD_MOVE.map((item) => el('li', {}, [item])),
          ),
        ]),
      ]),
    ]),

    el('div', { class: 'console__foot' }, [
      el('span', {}, ['Futures sum above 100% where they overlap']),
      el('span', { class: 'console__bar-sep' }, ['·']),
      el('span', {}, ['Kaldun Engine 0.8.4']),
      el('span', { class: 'console__bar-right' }, ['Committed before resolution']),
    ]),
  ]);

  const note = el('p', { class: 'footnote console__disclosure' }, [
    'Question and framing taken from the public forecasting question linked above. Evidence rows are published external figures and are linked to their sources. The probabilities and dependencies shown demonstrate the form of Engine output; they are not a published Kaldun forecast.',
  ]);

  root.replaceChildren(console_, note);

  // Fill the meters once the console is on screen.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.disconnect();
        console_.classList.add('is-in');
      }
    },
    { threshold: 0.25 },
  );
  io.observe(console_);
}
