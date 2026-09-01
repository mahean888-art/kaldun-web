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
  /** Tuning for the domain's diagrammatic material. */
  motif: {
    /** 0 = weight concentrated on a lead path … 1 = even spread. */
    spread: number;
    /** How visible the peripheral tail trace is, 0..1. */
    tail: number;
    /** How far the lead path carries into time, 0..1. */
    reach: number;
    seed: number;
  };
};

export const DOMAINS: Domain[] = [
  {
    ordinal: '01',
    label: 'Capital allocation',
    question:
      'Commit, stage, hedge, or preserve optionality when the conditions of capital can change before the commitment settles?',
    returns:
      'The Machine returns distributions of outcomes, break conditions, and actions that remain sound across more than one path.',
    motif: { spread: 0.35, tail: 0.3, reach: 0.6, seed: 1654 },
  },
  {
    ordinal: '02',
    label: 'Insurance',
    question:
      'Which exposures, terms, and accumulations remain acceptable when the loss distribution changes?',
    returns:
      'The Machine returns a view beyond the average: concentration, tail conditions, and escalation thresholds.',
    motif: { spread: 0.5, tail: 1, reach: 0.45, seed: 1755 },
  },
  {
    ordinal: '03',
    label: 'Real assets',
    question:
      'Build, defer, resize, or redesign when demand, financing, policy, supply, and operating constraints move together?',
    returns:
      'The Machine returns project futures, leading conditions, and the value of staging a commitment.',
    motif: { spread: 0.25, tail: 0.25, reach: 1, seed: 1869 },
  },
  {
    ordinal: '04',
    label: 'Energy',
    question:
      'How should capital and capacity move when physical networks, prices, regulation, and security conditions interact?',
    returns:
      'The Machine returns system states, stress paths, and decision triggers before capital is locked.',
    motif: { spread: 0.75, tail: 0.5, reach: 0.55, seed: 1882 },
  },
  {
    ordinal: '05',
    label: 'National resilience',
    question:
      'Which capabilities remain reliable when dependencies fail, constraints change, or a shock travels through connected systems?',
    returns:
      'The Machine returns scenario paths, fragilities, contingencies, and a record fit for consequential review.',
    motif: { spread: 0.6, tail: 0.85, reach: 0.5, seed: 1962 },
  },
];
