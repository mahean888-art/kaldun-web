/**
 * The Machine, shown by a run. Two specimen runs behind a quiet switch; the
 * selected one is typeset as a document — stage names down a grey margin,
 * the machine's output in ink. Selection by click and by keyboard, the same
 * way the domains index works.
 */

import { el } from '../lib/dom';
import type { Run } from '../data/runs';

type Options = { root: HTMLElement; items: Run[] };

function stage(name: string, body: Array<Node | string>): HTMLElement {
  return el('div', { class: 'run__stage' }, [
    el('span', { class: 'run__stagename' }, [name]),
    el('div', { class: 'run__body' }, body),
  ]);
}

function render(run: Run): HTMLElement[] {
  const wmax = Math.max(...run.paths.map((p) => p.w));
  const paths = el(
    'ul',
    { class: 'run__paths' },
    run.paths.map((p) =>
      el(
        'li',
        { class: p.tail ? 'run__path run__path--tail' : 'run__path', style: `--w:${p.w};--wmax:${wmax}` },
        [
          el('span', { class: 'run__w' }, [p.w.toFixed(2)]),
          el('span', { class: 'run__bar', 'aria-hidden': 'true' }, [el('i')]),
          el('span', { class: 'run__text' }, [p.text]),
          el('span', { class: 'run__tail' }, [p.tail ? 'tail' : '']),
        ],
      ),
    ),
  );

  return [
    stage('Run', [el('span', { class: 'run__id' }, [`No. ${run.number}`]), ` · ${run.label}`]),
    stage('Decision', [el('p', { class: 'run__decision' }, [run.decision])]),
    stage('State', [el('p', {}, [run.state])]),
    stage('Intervention', [
      el(
        'div',
        { class: 'run__options' },
        run.options.map((o) =>
          el('p', { class: 'run__opt' }, [el('span', { class: 'run__key' }, [o.key]), el('span', {}, [o.text])]),
        ),
      ),
    ]),
    stage('Futures', [el('p', { class: 'run__caption' }, [`Weighted paths under ${run.under}.`]), paths]),
    stage('What survives', [el('p', { class: 'two-tone' }, [el('em', {}, [run.survives.em]), ` ${run.survives.rest}`])]),
    stage('Resolution', [
      el('p', {}, [
        `Claim committed ${run.resolution.committed} · resolves ${run.resolution.resolves} · hash `,
        el('span', { class: 'run__hash' }, [run.resolution.hash]),
        ' · ',
        el('a', { href: '#record' }, ['the Record →']),
      ]),
    ]),
  ];
}

export function initRunPanel({ root, items }: Options): void {
  if (items.length === 0) return;

  const tabs = items.map((item, i) =>
    el(
      'button',
      {
        type: 'button',
        class: 'run__tab',
        role: 'tab',
        id: `run-tab-${item.id}`,
        'aria-controls': 'run-doc',
        'aria-selected': String(i === 0),
        tabindex: i === 0 ? '0' : '-1',
      },
      [item.label],
    ),
  );

  const top = el('div', { class: 'run__top' }, [
    el('div', { class: 'run__switch', role: 'tablist', 'aria-label': 'Specimen runs' }, tabs),
    el('p', { class: 'run__note' }, ['Specimen run · figures illustrative']),
  ]);
  const doc = el(
    'div',
    { class: 'run__doc', id: 'run-doc', role: 'tabpanel', 'aria-labelledby': `run-tab-${items[0]!.id}` },
    render(items[0]!),
  );
  root.append(top, doc);

  let active = 0;
  const select = (i: number, focus = false): void => {
    active = i;
    const item = items[i]!;
    tabs.forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === i));
      tab.tabIndex = k === i ? 0 : -1;
    });
    doc.setAttribute('aria-labelledby', `run-tab-${item.id}`);
    doc.classList.remove('is-in');
    doc.replaceChildren(...render(item));
    requestAnimationFrame(() => doc.classList.add('is-in'));
    if (focus) tabs[i]?.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
      if (delta === 0) return;
      event.preventDefault();
      select((active + delta + items.length) % items.length, true);
    });
  });

  doc.classList.add('is-in');
}
