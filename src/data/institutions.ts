/**
 * Who runs Kaldun, and in which form.
 *
 * Stated explicitly rather than gestured at: the institution, the decision it
 * owns, and which of the three surfaces it uses. Institutions are the initial
 * buyer, not the boundary of the company.
 */

export type Institution = {
  who: string;
  what: string;
  /** Console, API, or Private environment. */
  mode: string;
};

export const INSTITUTIONS: Institution[] = [
  {
    who: 'Sovereign and public institutions',
    what: 'Test how a measure propagates before it is written, and keep the record of what was believed when it was signed.',
    mode: 'Private environment',
  },
  {
    who: 'Central banks and financial regulators',
    what: 'Hold explicit, dated beliefs about conditions that supervisory decisions depend on, and score them on resolution.',
    mode: 'Private environment',
  },
  {
    who: 'Institutional investors and asset managers',
    what: 'Run allocation, staging, and downside across connected futures before capital is committed.',
    mode: 'Console · API',
  },
  {
    who: 'Energy and infrastructure operators',
    what: 'Test siting, interconnection, and capacity commitments against demand, permitting, and equipment together.',
    mode: 'Console',
  },
  {
    who: 'Industrial and semiconductor manufacturers',
    what: 'Run supply, export-control, and lead-time conditions as one chain rather than five separate risk lines.',
    mode: 'Console · API',
  },
  {
    who: 'Defence and national security organisations',
    what: 'Maintain calibrated beliefs about conditions that change slowly and matter permanently.',
    mode: 'Private environment',
  },
  {
    who: 'Corporate strategy and risk committees',
    what: 'Bring a decision, receive the futures that determine it, and keep the memo the record was made from.',
    mode: 'Console',
  },
];

export type Surface = {
  name: string;
  body: string;
  detail: Array<[string, string]>;
};

export const SURFACES: Surface[] = [
  {
    name: 'Console',
    body: 'Teams frame decisions, change assumptions, compare futures, monitor new evidence, and record outcomes.',
    detail: [
      ['USED BY', 'Strategy, investment, risk'],
      ['UNIT OF WORK', 'A decision'],
      ['OUTPUT', 'Futures, odds, dependencies, triggers'],
    ],
  },
  {
    name: 'API',
    body: 'Software can call the same Engine before taking consequential actions.',
    detail: [
      ['USED BY', 'Engineering, automated systems'],
      ['UNIT OF WORK', 'A question'],
      ['OUTPUT', 'Probabilities, dependencies, cutoff, model version'],
    ],
  },
  {
    name: 'Private environments',
    body: 'Institutions can connect confidential evidence, decisions, and outcome history inside isolated deployments.',
    detail: [
      ['USED BY', 'Public and regulated institutions'],
      ['UNIT OF WORK', 'A mandate'],
      ['OUTPUT', 'The same Engine, inside your boundary'],
    ],
  },
];
