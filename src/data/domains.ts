/**
 * The five domains: where the same foundational machine matters as it
 * matures. Each carries one institutional question and one line on what the
 * Machine returns — scope, not product marketing.
 */

export type Domain = {
  ordinal: string;
  label: string;
  /** The commitment, asked the way the institution would ask it. */
  question: string;
  /** What the Machine returns. */
  returns: string;
};

export const DOMAINS: Domain[] = [
  {
    ordinal: '01',
    label: 'Capital allocation',
    question:
      'Commit, stage, hedge, or preserve optionality when the conditions of capital can change before the commitment settles?',
    returns:
      'The Machine returns distributions of outcomes, break conditions, and actions that remain sound across more than one path.',
  },
  {
    ordinal: '02',
    label: 'Insurance',
    question:
      'Which exposures, terms, and accumulations remain acceptable when the loss distribution changes?',
    returns:
      'The Machine returns a view beyond the average: concentration, tail conditions, and escalation thresholds.',
  },
  {
    ordinal: '03',
    label: 'Real assets',
    question:
      'Build, defer, resize, or redesign when demand, financing, policy, supply, and operating constraints move together?',
    returns:
      'The Machine returns project futures, leading conditions, and the value of staging a commitment.',
  },
  {
    ordinal: '04',
    label: 'Energy',
    question:
      'How should capital and capacity move when physical networks, prices, regulation, and security conditions interact?',
    returns:
      'The Machine returns system states, stress paths, and decision triggers before capital is locked.',
  },
  {
    ordinal: '05',
    label: 'National resilience',
    question:
      'Which capabilities remain reliable when dependencies fail, constraints change, or a shock travels through connected systems?',
    returns:
      'The Machine returns scenario paths, fragilities, contingencies, and a record fit for consequential review.',
  },
];
