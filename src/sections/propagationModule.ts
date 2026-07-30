/**
 * "Change one condition. See what follows."
 *
 * Five understandable causal steps, not a node graph. Setting the upstream
 * condition moves every downstream probability at once — including the one that
 * moves the other way.
 */

import { el, qs, svg } from '../lib/dom';
import { LEVERS, PROPAGATION, REVERSAL_NOTE, type Lever } from '../data/propagation';

function arrow(): HTMLElement {
  const wrap = el('div', { class: 'chain__arrow', 'aria-hidden': 'true' });
  wrap.append(
    svg('svg', { viewBox: '0 0 12 34', fill: 'none' }, [
      svg('path', {
        d: 'M6 0v26',
        stroke: 'currentColor',
        'stroke-width': 1,
        'stroke-dasharray': '2 3',
      }),
      svg('path', {
        d: 'M2 22l4 5 4-5',
        stroke: 'currentColor',
        'stroke-width': 1,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    ]),
  );
  return wrap;
}

export function initPropagationModule(root: HTMLElement): void {
  const chain = qs<HTMLElement>('[data-chain]', root);
  const controls = qs<HTMLElement>('[data-chain-controls]', root);
  const caption = qs<HTMLElement>('[data-chain-caption]', root);
  if (!chain || !controls) return;

  let current: Lever = 'hold';

  // --- controls ---------------------------------------------------------
  const buttons = LEVERS.map((lever) => {
    const btn = el(
      'button',
      {
        type: 'button',
        class: 'lever',
        'data-lever': lever.id,
        'aria-pressed': String(lever.id === current),
      },
      [lever.label],
    );
    btn.addEventListener('click', () => setLever(lever.id));
    return btn;
  });
  controls.replaceChildren(...buttons);

  // --- chain rows -------------------------------------------------------
  type Row = {
    node: HTMLElement;
    value: HTMLElement;
    delta: HTMLElement;
    fill: HTMLElement;
  };

  const rows: Row[] = PROPAGATION.map((step, i) => {
    const value = el('span', { class: 'chain__value' }, [`${step.values[current]}%`]);
    const delta = el('span', { class: 'chain__delta' }, ['']);
    const fill = el('span', { class: 'chain__fill' });

    const node = el('li', { class: `chain__step${step.reversal ? ' chain__step--reversal' : ''}` }, [
      el('div', { class: 'chain__head' }, [
        el('span', { class: 'chain__order' }, [step.order]),
        el('span', { class: 'chain__name' }, [step.label]),
      ]),
      el('p', { class: 'chain__outcome' }, [step.outcome]),
      el('div', { class: 'chain__readout' }, [value, delta]),
      el('div', { class: 'chain__bar' }, [fill]),
    ]);

    if (i > 0) node.prepend(arrow());
    return { node, value, delta, fill };
  });

  chain.replaceChildren(...rows.map((r) => r.node));

  // --- update -----------------------------------------------------------
  function paint(animated: boolean): void {
    PROPAGATION.forEach((step, i) => {
      const row = rows[i];
      if (!row) return;
      const next = step.values[current];
      const base = step.values.hold;
      const diff = next - base;

      row.value.textContent = `${next}%`;
      row.fill.style.width = `${next}%`;
      row.fill.classList.toggle('is-reversal', Boolean(step.reversal) && diff !== 0);

      if (diff === 0) {
        row.delta.textContent = 'base';
        row.delta.dataset.dir = 'flat';
      } else {
        row.delta.textContent = `${diff > 0 ? '+' : '−'}${Math.abs(diff)} pts`;
        row.delta.dataset.dir = diff > 0 ? 'up' : 'down';
      }

      if (animated) {
        row.node.classList.remove('is-moving');
        // Force a reflow so the class re-triggers on repeat clicks.
        void row.node.offsetWidth;
        row.node.style.setProperty('--stagger', `${i * 70}ms`);
        row.node.classList.add('is-moving');
      }
    });

    for (const btn of buttons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lever === current));
    }

    const lever = LEVERS.find((l) => l.id === current);
    if (caption && lever) caption.textContent = lever.caption;
  }

  function setLever(next: Lever): void {
    if (next === current) return;
    current = next;
    paint(true);
  }

  paint(false);

  const note = qs<HTMLElement>('[data-chain-note]', root);
  if (note) note.textContent = REVERSAL_NOTE;
}
