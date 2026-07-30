/**
 * The Engine, stated publicly.
 * Know the state. Run it forward. Learn from reality.
 */

import type { GlyphName } from '../visuals/glyphs';

export type EngineStep = {
  id: string;
  ordinal: string;
  title: string;
  body: string;
  glyph: GlyphName;
  seed: number;
  /** Monospace detail rows shown beside the step. */
  detail: Array<[string, string]>;
};

/** The four public movements of the Engine, used on the home page. */
export const ENGINE_MOVEMENTS: EngineStep[] = [
  {
    id: 'state',
    ordinal: '01',
    title: 'Know the state',
    body: 'Kaldun records evidence as it becomes available and maintains a live picture of what appears true, what remains uncertain, and what is changing.',
    glyph: 'ziggurat',
    seed: 11,
    detail: [
      ['INPUT', 'Evidence, as it arrives'],
      ['HELD', 'What appears true / uncertain / moving'],
      ['REVISED', 'Continuously'],
    ],
  },
  {
    id: 'forward',
    ordinal: '02',
    title: 'Run it forward',
    body: 'The Engine tests how the current state may change under different actions, shocks, and assumptions.',
    glyph: 'branching',
    seed: 22,
    detail: [
      ['INPUT', 'Actions, shocks, assumptions'],
      ['HELD', 'Transitions between states'],
      ['REVISED', 'Per decision'],
    ],
  },
  {
    id: 'explicit',
    ordinal: '03',
    title: 'Make the futures explicit',
    body: 'It returns the futures that matter, the odds of each, how they depend on one another, and what evidence would change the view.',
    glyph: 'convergence',
    seed: 33,
    detail: [
      ['OUTPUT', 'Futures, odds, dependencies'],
      ['ALSO', 'What would change the view'],
      ['FORM', 'Explicit, inspectable'],
    ],
  },
  {
    id: 'learn',
    ordinal: '04',
    title: 'Learn from reality',
    body: 'When the outcome becomes known, Kaldun scores the forecast and improves the Engine.',
    glyph: 'saros',
    seed: 44,
    detail: [
      ['INPUT', 'Resolved outcomes'],
      ['HELD', 'Calibration by domain and horizon'],
      ['REVISED', 'On resolution'],
    ],
  },
];

/** The seven-part sequence on the Engine page. */
export const ENGINE_SEQUENCE: EngineStep[] = [
  {
    id: 'current-state',
    ordinal: '01',
    title: 'The current state',
    body: 'What appears true, what is uncertain, and what is in motion. The state is held as a learned representation, not as a document store, so a new piece of evidence changes the picture rather than being filed beside it.',
    glyph: 'ziggurat',
    seed: 101,
    detail: [
      ['HOLDS', 'Entities, conditions, relationships'],
      ['UNCERTAINTY', 'Explicit per condition'],
      ['UPDATED BY', 'Evidence'],
    ],
  },
  {
    id: 'transitions',
    ordinal: '02',
    title: 'State transitions',
    body: 'How actions, evidence, time, and outside shocks change the world. A transition is the unit the Engine actually learns: not that an event happened, but what it moved.',
    glyph: 'lattice',
    seed: 202,
    detail: [
      ['DRIVEN BY', 'Actions, evidence, time, shocks'],
      ['LEARNED', 'From resolved sequences'],
      ['SCOPE', 'Across categories'],
    ],
  },
  {
    id: 'futures',
    ordinal: '03',
    title: 'Possible futures',
    body: 'Explicit outcomes, probabilities, dependencies, and consequences. The Engine returns the small number of futures that change the decision, and says what each one depends on.',
    glyph: 'branching',
    seed: 303,
    detail: [
      ['RETURNS', 'Outcomes, odds, dependencies'],
      ['ORDERED BY', 'Effect on the decision'],
      ['DISCARDS', 'Nothing — every branch is kept'],
    ],
  },
  {
    id: 'updating',
    ordinal: '04',
    title: 'Continuous updating',
    body: 'New evidence changes the current state, and every forecast that depends on it is recomputed. The view is not refreshed on a schedule; it moves when the world does.',
    glyph: 'ephemeris',
    seed: 404,
    detail: [
      ['INGESTION', 'Continuous'],
      ['STATE UPDATE', 'Continuous'],
      ['RECOMPUTE', 'Continuous'],
    ],
  },
  {
    id: 'resolution',
    ordinal: '05',
    title: 'Resolution',
    body: 'Reality supplies the label. Every eligible forecast is written with the source and rule that will decide it, so resolution is a lookup rather than an argument.',
    glyph: 'tablet',
    seed: 505,
    detail: [
      ['DEFINED AT', 'Commitment'],
      ['SOURCE', 'Named, in advance'],
      ['DISPUTES', 'Adjudicated by contract'],
    ],
  },
  {
    id: 'calibration',
    ordinal: '06',
    title: 'Calibration',
    body: 'The Engine learns where it is reliable and where it is not — by domain, by horizon, by question type — and reports that honestly alongside the forecast.',
    glyph: 'saros',
    seed: 606,
    detail: [
      ['MEASURED', 'By domain and horizon'],
      ['COMPARED', 'Against baselines'],
      ['PUBLISHED', 'With the forecast'],
    ],
  },
  {
    id: 'deployment',
    ordinal: '07',
    title: 'Deployment',
    body: 'Console, API, and private environments. One Engine, reached three ways, with the same record behind each of them.',
    glyph: 'gnomon',
    seed: 707,
    detail: [
      ['CONSOLE', 'Teams'],
      ['API', 'Software'],
      ['PRIVATE', 'Institutions'],
    ],
  },
];

/** Short declarative lines used across the Engine page. */
export const ENGINE_LINES = [
  'Language models help Kaldun read.<br>The Engine helps Kaldun anticipate.',
  'The state is learned.<br>The futures are explicit.',
  'Every forecast begins<br>with a rule for judging it.',
  'A model that never resolves<br>never learns whether it was right.',
];

/** The continuous-updating pair. */
export const UPDATE_MODES: Array<{ label: string; body: string; detail: string }> = [
  {
    label: 'Updated continuously',
    body: 'Evidence changes the live state as it arrives.',
    detail: 'Ingestion, state update, and forecast recomputation run continuously.',
  },
  {
    label: 'Trained on resolution',
    body: 'Reality provides the label when the outcome becomes known.',
    detail: 'Resolved outcomes enter controlled training and calibration cycles.',
  },
];
