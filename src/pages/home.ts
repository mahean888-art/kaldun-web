/**
 * Home page composition.
 * The prose lives in index.html; this file mounts the data-driven modules.
 */

import { bootstrap } from '../main';
import { el, qs } from '../lib/dom';
import { initProbabilityField } from '../visuals/probabilityField';
import { renderEngineMovements } from '../sections/engineMovements';
import { renderEngineDemo } from '../sections/engineDemo';
import { initPropagationModule } from '../sections/propagationModule';
import { renderDomainCarousel } from '../sections/domainCarousel';
import { renderDecisionModule } from '../sections/decisionModule';
import { renderRecordPreview } from '../sections/recordLedger';
import { renderInstitutions, renderSurfaces } from '../sections/institutionList';
import { renderMarquee } from '../sections/marquee';
import { BACKGROUNDS_SHORT } from '../data/fellowship';

bootstrap(() => {
  const field = qs<HTMLCanvasElement>('[data-probability-field]');
  if (field) initProbabilityField(field);

  const movements = qs('[data-engine-movements]');
  if (movements) renderEngineMovements(movements);

  const demo = qs('[data-engine-demo]');
  if (demo) renderEngineDemo(demo);

  const propagation = qs('[data-propagation]');
  if (propagation) initPropagationModule(propagation);

  const carousel = qs('[data-carousel-viewport]');
  if (carousel) renderDomainCarousel(carousel);

  const decisions = qs('[data-decision-module]');
  if (decisions) renderDecisionModule(decisions);

  const record = qs('[data-record-preview]');
  if (record) renderRecordPreview(record, 3);

  const surfaces = qs('[data-surfaces]');
  if (surfaces) renderSurfaces(surfaces);

  const institutions = qs('[data-institutions]');
  if (institutions) renderInstitutions(institutions);

  const backgrounds = qs('[data-backgrounds-short]');
  if (backgrounds) {
    backgrounds.replaceChildren(
      ...BACKGROUNDS_SHORT.map((item) => el('span', { class: 'chip' }, [item])),
    );
  }

  const marquee = qs('[data-marquee]');
  if (marquee) renderMarquee(marquee);
});
