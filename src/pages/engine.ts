/** Engine page composition. */

import { bootstrap } from '../main';
import { qs } from '../lib/dom';
import { renderEngineSequence } from '../sections/engineSequence';
import { renderEngineDemo } from '../sections/engineDemo';
import { renderSurfaces } from '../sections/institutionList';

bootstrap(() => {
  const rail = qs('[data-sequence-rail]');
  const stage = qs('[data-sequence-stage]');
  if (rail && stage) renderEngineSequence(rail, stage);

  const demo = qs('[data-engine-demo]');
  if (demo) renderEngineDemo(demo);

  const surfaces = qs('[data-surfaces]');
  if (surfaces) renderSurfaces(surfaces);
});
