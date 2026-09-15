/**
 * The five domains: where foresight goes to work. Each carries who it is
 * for, a heading, and one paragraph on what you can compare and see.
 */

export type Domain = {
  ordinal: string;
  label: string;
  /** Who it is for — the line above the heading. */
  audience: string;
  /** The panel's heading. */
  question: string;
  /** The panel's paragraph. */
  returns: string;
};

export const DOMAINS: Domain[] = [
  {
    ordinal: '01',
    label: 'Capital allocation',
    audience: 'Banks / Asset managers / Digital-asset institutions',
    question: 'Before capital becomes exposure.',
    returns:
      'Compare a loan, investment, or funding strategy in the context of the whole balance sheet. See how it changes returns, liquidity, and exposure, and when to resize, reprice, hedge, or walk away.',
  },
  {
    ordinal: '02',
    label: 'Insurance',
    audience: 'Insurers / Reinsurers / Specialty underwriters',
    question: 'One policy can change the whole portfolio.',
    returns:
      'Assess a risk alongside everything already insured. Test pricing, coverage, and limits against connected losses. See how the next policy changes concentration, capital at risk, and the need for reinsurance.',
  },
  {
    ordinal: '03',
    label: 'Real assets',
    audience: 'Developers / Owners / Infrastructure investors',
    question: 'Test the project beyond the base case.',
    returns:
      'Test a development or acquisition against demand, financing, permitting, and construction timelines. See how a delay or change in one assumption affects cash flow, and compare the options to build, phase, refinance, or wait.',
  },
  {
    ordinal: '04',
    label: 'Energy',
    audience: 'Utilities / Energy operators / Large power users',
    question: 'Plan for the next constraint.',
    returns:
      'Compare investments and operating plans under changing demand, weather, prices, and outages. See where capacity becomes constrained, and whether generation, storage, transmission, or a different operating plan best addresses it.',
  },
  {
    ordinal: '05',
    label: 'National resilience',
    audience: 'Governments / Infrastructure operators / Emergency planners',
    question: 'See how failure spreads. Find where to intervene.',
    returns:
      'Trace how a port closure, power outage, or supply shortage moves through essential services. Compare reserves, redundancies, and recovery plans to see which interventions contain the damage and preserve essential services.',
  },
];
