/**
 * Decision domains.
 *
 * One Engine, five places it is pointed. Each domain names the institutions that
 * own that decision, so the buyer is explicit rather than implied.
 */

import type { StackItem } from '../sections/stack';

export type Domain = StackItem & {
  /** Who owns this class of decision. */
  who: string;
};

export const DOMAINS: Domain[] = [
  {
    id: 'capital',
    ordinal: '01',
    figure: 'allocation',
    figureSeed: 101,
    label: 'Capital allocation',
    title: 'Capital should not depend on one future.',
    body: 'Investment cases usually hide a single path for demand, financing, regulation, execution and exit. Kaldun runs those conditions together, before capital is committed, and returns the allocation and staging that hold across the plausible futures.',
    note: 'Institutional investors, asset managers, infrastructure and energy operators, corporate treasuries.',
    who: 'Institutional investors · Asset managers · Infrastructure operators · Treasury',
    rows: [
      ['DECIDES', 'Size, timing, staging, downside'],
      ['DEPENDS ON', 'Demand, permitting, rates, equipment'],
      ['RETURNS', 'Allocation, staging, triggers, downside'],
    ],
    chips: ['Portfolio construction', 'Infrastructure investment', 'M&A', 'Capital staging', 'Treasury'],
  },
  {
    id: 'market',
    ordinal: '02',
    figure: 'wavefront',
    figureSeed: 202,
    label: 'Market entry & expansion',
    title: 'The market will react to your arrival.',
    body: 'An entry plan is a claim about a market that has not been told yet. Kaldun runs the response: how demand forms, how incumbents reprice, how regulators read the move, and whether supply keeps up — then returns the order and timing that survive it.',
    note: 'Operators entering regulated markets, expansion and corporate development teams.',
    who: 'Corporate development · Expansion teams · Regulated-market operators',
    rows: [
      ['DECIDES', 'Market, order, timing, mode'],
      ['DEPENDS ON', 'Licensing, incumbents, channel, FX'],
      ['RETURNS', 'Sequence, entry mode, stop conditions'],
    ],
    chips: ['Market selection', 'Entry sequencing', 'Partner and channel', 'Pricing entry', 'Localisation'],
  },
  {
    id: 'technology',
    ordinal: '03',
    figure: 'curves',
    figureSeed: 303,
    label: 'Product & technology',
    title: 'A roadmap is a forecast about what will matter.',
    body: 'Every roadmap encodes beliefs about cost curves, standards, supply and what customers will want in three years. Kaldun makes those beliefs explicit, tests the roadmap against them, and scores the beliefs when they resolve.',
    note: 'Semiconductor and industrial manufacturers, platform and infrastructure engineering.',
    who: 'Industrial & semiconductor manufacturers · Platform engineering',
    rows: [
      ['DECIDES', 'Commitments now, options later'],
      ['DEPENDS ON', 'Lead times, cost curves, standards, export rules'],
      ['RETURNS', 'Commitment, optionality, reversal triggers'],
    ],
    chips: ['Roadmap sequencing', 'Architecture bets', 'Build vs buy', 'Capacity planning', 'Standards exposure'],
  },
  {
    id: 'resilience',
    ordinal: '04',
    figure: 'correlation',
    figureSeed: 404,
    label: 'Risk & resilience',
    title: 'The risks that matter rarely arrive alone.',
    body: 'Risk registers list events separately; reality delivers them in combination. Kaldun runs correlated arrivals and tests which mitigations still hold when several conditions fail at once — and which of them quietly share a dependency.',
    note: 'Risk committees, supervisory and prudential functions, continuity and operations.',
    who: 'Risk committees · Supervisory functions · Continuity & operations',
    rows: [
      ['DECIDES', 'Which exposure to reduce, which mitigation to fund'],
      ['DEPENDS ON', 'Grid, logistics, counterparties, controls'],
      ['RETURNS', 'Correlated futures, surviving mitigations, cost of resilience'],
    ],
    chips: ['Correlated exposure', 'Supply continuity', 'Liquidity stress', 'Physical risk', 'Concentration'],
  },
  {
    id: 'policy',
    ordinal: '05',
    figure: 'cascade',
    figureSeed: 505,
    label: 'Policy & geopolitics',
    title: 'The rule change is only the first-order event.',
    body: 'A rule is written once and felt for years. Kaldun runs the propagation — who reprices, who relocates, who files, who waits — and shows where the largest effect actually lands, which is rarely on the party the rule names.',
    note: 'Sovereign and public institutions, central banks and financial regulators, national security organisations.',
    who: 'Sovereign & public institutions · Central banks & regulators · National security',
    rows: [
      ['DECIDES', 'Which position, and when to move'],
      ['DEPENDS ON', 'Licensing, substitution, retaliation, enforcement'],
      ['RETURNS', 'Propagation path, timing, magnitude, reversal conditions'],
    ],
    chips: ['Regulatory exposure', 'Sanctions and controls', 'Election outcomes', 'Trade measures', 'Policy design'],
  },
];
