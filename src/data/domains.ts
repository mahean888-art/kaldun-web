/**
 * The five domains: where machine foresight applies. Each carries a label, a
 * headline, and one paragraph on what you can model, test, and see.
 */

export type Domain = {
  ordinal: string;
  label: string;
  /** The panel's headline. */
  question: string;
  /** The panel's paragraph. */
  returns: string;
  /** Who it is for — one quiet line beneath the paragraph, where it helps. */
  audience?: string;
};

export const DOMAINS: Domain[] = [
  {
    ordinal: '01',
    label: 'Capital allocation',
    question: 'Decide where capital goes next.',
    returns:
      'Model portfolios, balance sheets, and the markets around them. Test lending, investment, funding, and collateral decisions against changing conditions. See how each choice affects returns, liquidity, and exposure, and when to change course.',
    audience: 'For banks, asset managers, and institutions across traditional and digital finance.',
  },
  {
    ordinal: '02',
    label: 'Insurance',
    question: 'Price the risk. See the whole exposure.',
    returns:
      'Model individual risks and the dependencies that connect them. Test pricing, coverage, and limits against changing loss conditions. See how a new policy affects the wider portfolio, where losses could accumulate, and when underwriting terms should change.',
  },
  {
    ordinal: '03',
    label: 'Real assets',
    question: 'Test the project before you build.',
    returns:
      'Bring demand, financing, permits, construction, and supply into one model. Compare where to build, how much to commit, and when to proceed. See how delays or changing conditions affect the project, and which choices preserve room to adapt.',
  },
  {
    ordinal: '04',
    label: 'Energy',
    question: 'Plan capacity for a changing system.',
    returns:
      'Model demand, generation, storage, and network constraints together. Test capacity investments, operating plans, and supply contracts against changing prices, weather, and outages. See where shortages could emerge and which actions improve reliability.',
  },
  {
    ordinal: '05',
    label: 'National resilience',
    question: 'See how disruption spreads. Prepare where it matters.',
    returns:
      'Model the dependencies between critical infrastructure, supply chains, and essential services. Test how a disruption could spread, which capabilities remain available, and where intervention has the greatest effect. Compare preparedness investments and recovery plans before they are needed.',
  },
];
