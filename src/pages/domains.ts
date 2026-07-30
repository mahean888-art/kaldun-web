/** Domains page composition. */

import { bootstrap } from '../main';
import { qs } from '../lib/dom';
import { initDomainView } from '../sections/domainView';
import { renderDecisionModule } from '../sections/decisionModule';

bootstrap(() => {
  const view = qs('[data-domain-view]');
  if (view) initDomainView(view);

  const decisions = qs('[data-decision-module]');
  if (decisions) renderDecisionModule(decisions);
});
