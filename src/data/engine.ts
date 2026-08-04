/**
 * The Engine, stated publicly.
 * Know the state. Run it forward. Learn from reality.
 */

import type { StackItem } from '../sections/stack';

export const MOVEMENTS: StackItem[] = [
  {
    id: 'state',
    ordinal: '01',
    glyph: 'state',
    tags: ['Evidence', 'Conditions', 'Relationships', 'Uncertainty', 'Revision'],
    label: 'Know the state',
    title: 'Know the state.',
    body: 'Ulmo holds a live picture of what appears true, what is uncertain, and what is moving. New evidence changes the picture — it is not filed beside it.',
    rows: [
      ['INPUT', 'Evidence, as it arrives'],
      ['HELD', 'Conditions, relationships, uncertainty'],
      ['REVISED', 'Continuously'],
    ],
  },
  {
    id: 'forward',
    ordinal: '02',
    glyph: 'forward',
    tags: ['Actions', 'Shocks', 'Assumptions', 'Transitions', 'Reach'],
    label: 'Run it forward',
    title: 'Run it forward.',
    body: 'The Engine tests how the state changes under actions, shocks and assumptions. What it learns is the transition: what an event moved, and how far the effect travelled.',
    rows: [
      ['INPUT', 'Actions, shocks, assumptions'],
      ['HELD', 'Transitions between states'],
      ['SCOPE', 'Across categories, not within one'],
    ],
  },
  {
    id: 'explicit',
    ordinal: '03',
    glyph: 'explicit',
    tags: ['Outcomes', 'Odds', 'Dependencies', 'Triggers'],
    label: 'Make futures explicit',
    title: 'Make the futures explicit.',
    body: 'It returns the futures that change the decision: the outcomes, the odds of each, and the evidence that would move them.',
    rows: [
      ['RETURNS', 'Outcomes, odds, dependencies'],
      ['ALSO', 'What would change the view'],
      ['DISCARDS', 'Nothing — every branch is kept'],
    ],
  },
  {
    id: 'learn',
    ordinal: '04',
    glyph: 'learn',
    tags: ['Resolution', 'Scoring', 'Calibration', 'Horizon'],
    label: 'Learn from reality',
    title: 'Learn from reality.',
    body: 'Every forecast is written with the rule that will decide it. When the outcome arrives it is scored, and the Engine is recalibrated. Time is the supervision signal.',
    rows: [
      ['INPUT', 'Resolved outcomes'],
      ['MEASURED', 'By domain and horizon'],
      ['REVISED', 'On resolution'],
    ],
  },
];
