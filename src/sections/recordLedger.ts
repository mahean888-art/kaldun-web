/**
 * The Record ledger.
 *
 * Each entry shows the belief at commitment, every update since, the resolution
 * contract, and — where reality has arrived — the outcome and score. Failed
 * forecasts are in the list on purpose.
 */

import { el } from '../lib/dom';
import { RECORD, type RecordEntry, type Status } from '../data/record';
import { makeSparkline } from '../visuals/sparkline';

const STATUS_LABEL: Record<Status, string> = {
  open: 'Open',
  'resolved-yes': 'Resolved — Yes',
  'resolved-no': 'Resolved — No',
};

const STATUS_CLASS: Record<Status, string> = {
  open: 'pill--open',
  'resolved-yes': 'pill--yes',
  'resolved-no': 'pill--no',
};

function updateHistory(entry: RecordEntry): HTMLElement {
  return el(
    'div',
    { class: 'ledger__history' },
    entry.updates.map((update) =>
      el('div', { class: 'ledger__history-row' }, [
        el('span', { class: 'ledger__history-date' }, [update.date]),
        el(
          'span',
          { class: `ledger__history-value${update.probability === null ? ' is-resolution' : ''}` },
          [update.probability === null ? (update.note ?? 'Resolved') : `${update.probability}%`],
        ),
      ]),
    ),
  );
}

function entryNode(entry: RecordEntry, index: number): HTMLElement {
  const spark = el('div', { class: 'ledger__spark' });
  spark.append(
    makeSparkline(
      entry.updates.map((u) => ({
        probability: u.probability,
        resolved: u.probability === null,
      })),
      entry.status === 'open' ? 'signal' : 'bronze',
    ),
  );

  const delta = entry.current - entry.original;

  return el(
    'article',
    {
      class: 'ledger__entry',
      'data-reveal': 'rise',
      'data-record-entry': entry.id,
      'data-domain': entry.domainId,
      'data-status': entry.status,
    },
    [
      el('div', { class: 'ledger__lead' }, [
        el('span', { class: 'ledger__id' }, [`KR-${String(index + 1).padStart(4, '0')}`]),
        el('h3', { class: 'ledger__question' }, [entry.question]),
        el('div', { class: 'ledger__pills' }, [
          el('span', { class: `pill ${STATUS_CLASS[entry.status]}` }, [STATUS_LABEL[entry.status]]),
          el('span', { class: 'pill pill--pending' }, [entry.horizon]),
        ]),
      ]),

      el('div', { class: 'ledger__figures' }, [
        el('div', { class: 'ledger__figure' }, [
          el('span', { class: 'ledger__figure-label' }, ['Original']),
          el('span', { class: 'ledger__figure-value' }, [`${entry.original}%`]),
        ]),
        el('div', { class: 'ledger__figure' }, [
          el('span', { class: 'ledger__figure-label' }, ['Current']),
          el('span', { class: 'ledger__figure-value' }, [`${entry.current}%`]),
        ]),
        el('div', { class: 'ledger__figure' }, [
          el('span', { class: 'ledger__figure-label' }, ['Moved']),
          // Direction of movement is not good or bad, so it is not coloured
          // like an outcome — only the arrow carries the sign.
          el('span', { class: 'ledger__figure-value' }, [
            `${delta > 0 ? '↑' : delta < 0 ? '↓' : '·'} ${Math.abs(delta)} pts`,
          ]),
        ]),
      ]),

      el('div', { class: 'ledger__track' }, [spark, updateHistory(entry)]),

      el('div', { class: 'ledger__meta' }, [
        el('dl', { class: 'kv' }, [
          el('dt', {}, ['Committed']),
          el('dd', {}, [entry.committed]),
          el('dt', {}, ['Information']),
          el('dd', {}, [entry.information]),
          el('dt', {}, ['Resolution']),
          el('dd', {}, [entry.resolution]),
          el('dt', {}, ['Model']),
          el('dd', {}, [entry.model]),
          el('dt', {}, ['Commitment']),
          el('dd', {}, [entry.commitment]),
          ...(entry.score ? [el('dt', {}, ['Score']), el('dd', {}, [entry.score])] : []),
        ]),
        el('div', { class: 'ledger__drivers' }, [
          el('span', { class: 't-label' }, ['What moved the view']),
          el(
            'ul',
            { class: 'ledger__drivers-list' },
            entry.drivers.map((driver) => el('li', {}, [driver])),
          ),
        ]),
      ]),
    ],
  );
}

export function renderRecordLedger(root: HTMLElement): HTMLElement[] {
  const nodes = RECORD.map(entryNode);
  root.replaceChildren(...nodes);
  return nodes;
}

/** Render the compact three-entry preview used on the home page. */
export function renderRecordPreview(root: HTMLElement, limit = 3): HTMLElement[] {
  const nodes = RECORD.slice(0, limit).map(entryNode);
  root.replaceChildren(...nodes);
  return nodes;
}
