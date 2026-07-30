/**
 * Project 10191 — a recruiting and invention programme, not an academic centre.
 */

export type Block = {
  label: string;
  body: string;
  /** The keywords that matter, listed plainly. */
  items?: string[];
};

export const BLOCKS: Block[] = [
  {
    label: 'Who we are looking for',
    body: 'People who build systems that make measurable claims about what happens next. Where you trained matters less than whether your work can be scored.',
    items: [
      'Time-series and sequence modelling',
      'State-space and dynamical systems',
      'Superforecasting and forecast aggregation',
      'Reinforcement learning from verifiable rewards',
      'Probabilistic programming and Bayesian inference',
      'Causal and counterfactual modelling',
      'Sequential decision-making',
      'Prediction markets and event modelling',
    ],
  },
  {
    label: 'What fellows work on',
    body: 'The Engine itself, not a paper about it: estimating the live state of a domain, generating the futures that follow, calibrating them, and building the resolution systems that decide who was right.',
  },
  {
    label: 'What fellows receive',
    body: 'Funding for the duration, compute allocated rather than queued for, access to Kaldun\u2019s evidence and resolved-outcome history, engineering support, and real decisions with real resolution dates. Fellows who should stay are offered a role.',
  },
];
