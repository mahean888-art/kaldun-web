/**
 * The Engine, stated publicly.
 * Know the state. Run it forward. Learn from reality.
 */

import type { StackItem } from '../sections/stack';

export const MOVEMENTS: StackItem[] = [
  {
    id: 'state',
    ordinal: '01',
    figure: 'state',
    label: 'Know the state',
    title: 'Know the state.',
    body: 'Kaldun records evidence as it becomes available and maintains a live picture of what appears true, what remains uncertain, and what is moving. The state is a learned representation, not a document store, so new evidence changes the picture rather than being filed beside it.',
    rows: [
      ['INPUT', 'Evidence, as it arrives'],
      ['HELD', 'Conditions, relationships, uncertainty'],
      ['REVISED', 'Continuously'],
    ],
  },
  {
    id: 'forward',
    ordinal: '02',
    figure: 'forward',
    label: 'Run it forward',
    title: 'Run it forward.',
    body: 'The Engine tests how the current state changes under actions, shocks and assumptions. The unit it learns is the transition — not that an event happened, but what that event moved, and how far the effect travelled.',
    rows: [
      ['INPUT', 'Actions, shocks, assumptions'],
      ['HELD', 'Transitions between states'],
      ['SCOPE', 'Across categories, not within one'],
    ],
  },
  {
    id: 'explicit',
    ordinal: '03',
    figure: 'explicit',
    label: 'Make futures explicit',
    title: 'Make the futures explicit.',
    body: 'It returns the small number of futures that change the decision: the outcomes, the odds of each, what they depend on, and the evidence that would move them. Latent inside, explicit outside.',
    rows: [
      ['RETURNS', 'Outcomes, odds, dependencies'],
      ['ALSO', 'What would change the view'],
      ['DISCARDS', 'Nothing — every branch is kept'],
    ],
  },
  {
    id: 'learn',
    ordinal: '04',
    figure: 'learn',
    label: 'Learn from reality',
    title: 'Learn from reality.',
    body: 'Every eligible forecast is written with the source and rule that will decide it. When the outcome arrives, the forecast is scored and the Engine is calibrated — by domain, by horizon, by question type. Time is the supervision signal, and it cannot be backfilled.',
    rows: [
      ['INPUT', 'Resolved outcomes'],
      ['MEASURED', 'By domain and horizon'],
      ['REVISED', 'On resolution'],
    ],
  },
];
