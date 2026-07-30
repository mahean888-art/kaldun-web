/**
 * Per-page mounts.
 *
 * Each function fills in the data-driven modules for one route. They are kept
 * together, and kept independent of `bootstrap`, so the same functions serve
 * both the multi-page build and the single-file bundle.
 *
 * Every lookup is guarded, so a mount run against a document that does not
 * contain its hosts is a no-op rather than an error.
 */

import { el, qs } from './lib/dom';
import { initProbabilityField, type FieldHandle } from './visuals/probabilityField';
import { renderEngineMovements } from './sections/engineMovements';
import { renderEngineDemo } from './sections/engineDemo';
import { renderEngineSequence } from './sections/engineSequence';
import { initPropagationModule } from './sections/propagationModule';
import { renderDomainCarousel } from './sections/domainCarousel';
import { initDomainView } from './sections/domainView';
import { renderDecisionModule } from './sections/decisionModule';
import { renderRecordLedger, renderRecordPreview } from './sections/recordLedger';
import { initRecordFilters } from './sections/recordFilters';
import { renderInstitutions, renderSurfaces } from './sections/institutionList';
import { renderMarquee } from './sections/marquee';
import { BACKGROUNDS_LONG, BACKGROUNDS_SHORT, FELLOWS_WORK_ON, PROVIDES } from './data/fellowship';
import { RECORD_OBJECT } from './data/record';

/** The hero canvas owns an animation loop, so it is disposable. */
let field: FieldHandle | null = null;

export function disposeMounts(): void {
  field?.destroy();
  field = null;
}

export function mountHome(root: ParentNode = document): void {
  const canvas = qs<HTMLCanvasElement>('[data-probability-field]', root);
  if (canvas) field = initProbabilityField(canvas);

  const movements = qs('[data-engine-movements]', root);
  if (movements) renderEngineMovements(movements);

  const demo = qs('[data-engine-demo]', root);
  if (demo) renderEngineDemo(demo);

  const propagation = qs('[data-propagation]', root);
  if (propagation) initPropagationModule(propagation);

  const carousel = qs('[data-carousel-viewport]', root);
  if (carousel) renderDomainCarousel(carousel);

  const decisions = qs('[data-decision-module]', root);
  if (decisions) renderDecisionModule(decisions);

  const record = qs('[data-record-preview]', root);
  if (record) renderRecordPreview(record, 3);

  const surfaces = qs('[data-surfaces]', root);
  if (surfaces) renderSurfaces(surfaces);

  const institutions = qs('[data-institutions]', root);
  if (institutions) renderInstitutions(institutions);

  const backgrounds = qs('[data-backgrounds-short]', root);
  if (backgrounds) {
    backgrounds.replaceChildren(
      ...BACKGROUNDS_SHORT.map((item) => el('span', { class: 'chip' }, [item])),
    );
  }

  const marquee = qs('[data-marquee]', root);
  if (marquee) renderMarquee(marquee);
}

export function mountEngine(root: ParentNode = document): void {
  const rail = qs('[data-sequence-rail]', root);
  const stage = qs('[data-sequence-stage]', root);
  if (rail && stage) renderEngineSequence(rail, stage);

  const demo = qs('[data-engine-demo]', root);
  if (demo) renderEngineDemo(demo);

  const surfaces = qs('[data-surfaces]', root);
  if (surfaces) renderSurfaces(surfaces);
}

export function mountDomains(root: ParentNode = document, domainId?: string): void {
  const view = qs('[data-domain-view]', root);
  if (view) {
    // Under the single-file router the hash belongs to the route, so the
    // domain selector is told which domain to open instead of reading it.
    initDomainView(
      view,
      domainId === undefined ? {} : { syncHash: false, initialId: domainId },
    );
  }

  const decisions = qs('[data-decision-module]', root);
  if (decisions) renderDecisionModule(decisions);
}

export function mountRecord(root: ParentNode = document): void {
  const ledgerHost = qs('[data-record-ledger]', root);
  const recordRoot = qs('[data-record]', root);
  if (ledgerHost && recordRoot) {
    const entries = renderRecordLedger(ledgerHost);
    initRecordFilters(recordRoot, entries);
  }

  const object = qs('[data-record-object]', root);
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
}

export function mountProject(root: ParentNode = document): void {
  const backgrounds = qs('[data-backgrounds-long]', root);
  if (backgrounds) {
    backgrounds.replaceChildren(
      ...BACKGROUNDS_LONG.map((item) =>
        el('div', { class: 'background', 'data-reveal': 'fade' }, [item]),
      ),
    );
  }

  const worksOn = qs('[data-works-on]', root);
  if (worksOn) {
    worksOn.replaceChildren(
      ...FELLOWS_WORK_ON.map((item) => el('span', { class: 'chip chip--bronze' }, [item])),
    );
  }

  const provides = qs('[data-provides]', root);
  if (provides) {
    provides.replaceChildren(
      ...PROVIDES.map((item) =>
        el('div', { class: 'provide', 'data-reveal': 'fade' }, [
          el('span', { class: 'provide__label' }, [item.label]),
          el('p', { class: 'provide__body' }, [item.body]),
        ]),
      ),
    );
  }
}

export type RouteId = 'home' | 'engine' | 'domains' | 'record' | 'project';

export const MOUNTS: Record<RouteId, (root?: ParentNode) => void> = {
  home: mountHome,
  engine: mountEngine,
  domains: mountDomains,
  record: mountRecord,
  project: mountProject,
};
