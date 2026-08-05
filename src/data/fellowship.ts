/**
 * Project 1654 — a recruiting and invention programme, not an academic centre.
 * Named for the year Ibn Khaldun completed the Muqaddimah.
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
    body: 'People whose work can be scored. Where you trained matters less than whether your systems make claims that resolve.',
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
    body: 'A funded term, allocated compute, access to Ulmo’s evidence and resolved-outcome history, and engineering support. Fellows who should stay are offered a role.',
  },
];
