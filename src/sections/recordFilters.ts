/**
 * Record filters.
 *
 * The controls actually filter the ledger — domain, horizon, status,
 * probability, model version, resolution type — and report how many entries
 * remain. Failed forecasts are never filtered out by default.
 */

import { el, qs } from '../lib/dom';
import { RECORD, RECORD_FILTERS, type RecordEntry } from '../data/record';

type State = Record<string, string>;

const matchers: Record<string, (entry: RecordEntry, value: string) => boolean> = {
  domain: (entry, value) => entry.domainId === value.toLowerCase(),
  horizon: (entry, value) => {
    const months = Number(entry.horizon.match(/\d+/)?.[0] ?? '0') || wordMonths(entry.horizon);
    if (value === 'Under 6 months') return months < 6;
    if (value === '6–12 months') return months >= 6 && months <= 12;
    return months > 12;
  },
  status: (entry, value) => {
    if (value === 'Open') return entry.status === 'open';
    if (value === 'Resolved yes') return entry.status === 'resolved-yes';
    return entry.status === 'resolved-no';
  },
  probability: (entry, value) => {
    const p = entry.current;
    if (value === 'Under 25%') return p < 25;
    if (value === '25–50%') return p >= 25 && p < 50;
    if (value === '50–75%') return p >= 50 && p < 75;
    return p >= 75;
  },
  model: (entry, value) => entry.model.endsWith(value),
  resolution: (entry, value) => {
    const r = entry.resolution.toLowerCase();
    if (value === 'Public register') return r.includes('register');
    if (value === 'Database capture') return r.includes('database') || r.includes('capture');
    return r.includes('adjudicated');
  },
};

function wordMonths(horizon: string): number {
  const words: Record<string, number> = {
    four: 4,
    seven: 7,
    nine: 9,
    eleven: 11,
    twelve: 12,
    thirty: 30,
  };
  const first = horizon.toLowerCase().split(' ')[0] ?? '';
  return words[first] ?? 0;
}

export function initRecordFilters(root: HTMLElement, entries: HTMLElement[]): void {
  const host = qs<HTMLElement>('[data-filters]', root);
  const count = qs<HTMLElement>('[data-filters-count]', root);
  const empty = qs<HTMLElement>('[data-filters-empty]', root);
  if (!host) return;

  const state: State = {};

  const apply = (): void => {
    let visible = 0;
    RECORD.forEach((entry, i) => {
      const node = entries[i];
      if (!node) return;
      const ok = Object.entries(state).every(([key, value]) => {
        if (!value || value === 'All') return true;
        return matchers[key]?.(entry, value) ?? true;
      });
      node.hidden = !ok;
      if (ok) visible += 1;
    });
    if (count) count.textContent = `${visible} of ${RECORD.length} shown`;
    if (empty) empty.hidden = visible > 0;
  };

  const controls = RECORD_FILTERS.map((filter) => {
    const select = el('select', { class: 'filter__select', 'aria-label': filter.label });
    for (const option of filter.options) {
      select.append(el('option', { value: option }, [option]));
    }
    state[filter.id] = 'All';
    select.addEventListener('change', () => {
      state[filter.id] = select.value;
      apply();
    });

    return el('div', { class: 'filter' }, [
      el('span', { class: 'filter__label' }, [filter.label]),
      select,
    ]);
  });

  host.replaceChildren(...controls);
  apply();
}
