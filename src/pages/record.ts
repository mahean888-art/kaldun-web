/** Record page composition. */

import { bootstrap } from '../main';
import { el, qs } from '../lib/dom';
import { renderRecordLedger } from '../sections/recordLedger';
import { initRecordFilters } from '../sections/recordFilters';
import { RECORD_OBJECT } from '../data/record';

bootstrap(() => {
  const ledgerHost = qs('[data-record-ledger]');
  const recordRoot = qs('[data-record]');

  if (ledgerHost && recordRoot) {
    const entries = renderRecordLedger(ledgerHost);
    initRecordFilters(recordRoot, entries);
  }

  const object = qs('[data-record-object]');
  if (object) {
    object.replaceChildren(
      ...RECORD_OBJECT.map(([key, value]) =>
        el('div', { class: 'specimen__row' }, [
          el('span', { class: 'specimen__key' }, [key]),
          el('span', { class: 'specimen__value' }, [value]),
        ]),
      ),
    );
  }
});
