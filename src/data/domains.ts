/**
 * Decision domains.
 *
 * One Engine, five places it is pointed. Each domain names the institutions that
 * own that decision, so the buyer is explicit rather than implied.
 */

import type { StackItem } from '../sections/stack';

export const DOMAINS: StackItem[] = [
  {
    id: 'capital',
    ordinal: '01',
    figure: 'strata',
    figureSeed: 101,
    label: 'Capital allocation',
    title: 'Capital should not depend on one future.',
    body: 'An investment case usually hides a single path for demand, financing, regulation and exit. Kaldun runs those conditions together and returns the allocation and staging that hold across the plausible futures.',
    note: 'Institutional investors, asset managers, infrastructure and energy operators, corporate treasuries.',
    rows: [
      ['DECIDES', 'Size, timing, staging, downside'],
      ['DEPENDS ON', 'Demand, permitting, rates, equipment'],
      ['RETURNS', 'Allocation, staging, triggers, downside'],
    ],
    chips: ['Portfolio construction', 'Infrastructure investment', 'M&A', 'Capital staging'],
  },
  {
    id: 'market',
    ordinal: '02',
    figure: 'wavefront',
    figureSeed: 202,
    label: 'Market entry & expansion',
    title: 'The market will react to your arrival.',
    body: 'An entry plan is a claim about a market that has not been told yet. Kaldun runs the response — demand, incumbents, regulators, supply — and returns the order and timing that survive it.',
    note: 'Operators entering regulated markets, expansion and corporate development teams.',
    rows: [
      ['DECIDES', 'Market, order, timing, mode'],
      ['DEPENDS ON', 'Licensing, incumbents, channel, FX'],
      ['RETURNS', 'Sequence, entry mode, stop conditions'],
    ],
    chips: ['Market selection', 'Entry sequencing', 'Partner and channel', 'Pricing entry'],
  },
  {
    id: 'technology',
    ordinal: '03',
    figure: 'aperture',
    figureSeed: 303,
    label: 'Product & technology',
    title: 'A roadmap is a forecast about what will matter.',
    body: 'Every roadmap encodes beliefs about cost curves, standards and supply. Kaldun makes those beliefs explicit, tests the roadmap against them, and scores them when they resolve.',
    note: 'Semiconductor and industrial manufacturers, platform and infrastructure engineering.',
    rows: [
      ['DECIDES', 'Commitments now, options later'],
      ['DEPENDS ON', 'Lead times, cost curves, standards'],
      ['RETURNS', 'Commitment, optionality, reversal triggers'],
    ],
    chips: ['Roadmap sequencing', 'Architecture bets', 'Build vs buy', 'Capacity planning'],
  },
  {
    id: 'resilience',
    ordinal: '04',
    figure: 'dissolve',
    figureSeed: 404,
    label: 'Risk & resilience',
    title: 'The risks that matter rarely arrive alone.',
    body: 'Risk registers list events separately; reality delivers them in combination. Kaldun runs correlated arrivals and shows which mitigations still hold when several conditions fail at once.',
    note: 'Risk committees, supervisory and prudential functions, continuity and operations.',
    rows: [
      ['DECIDES', 'Which exposure to reduce, which mitigation to fund'],
      ['DEPENDS ON', 'Grid, logistics, counterparties, controls'],
      ['RETURNS', 'Correlated futures, surviving mitigations'],
    ],
    chips: ['Correlated exposure', 'Supply continuity', 'Liquidity stress', 'Concentration'],
  },
  {
    id: 'policy',
    ordinal: '05',
    figure: 'descent',
    figureSeed: 505,
    label: 'Policy & geopolitics',
    title: 'The rule change is only the first-order event.',
    body: 'A rule is written once and felt for years. Kaldun runs the propagation — who reprices, who relocates, who waits — and shows where the largest effect actually lands.',
    note: 'Sovereign and public institutions, central banks and financial regulators, national security organisations.',
    rows: [
      ['DECIDES', 'Which position, and when to move'],
      ['DEPENDS ON', 'Licensing, substitution, retaliation'],
      ['RETURNS', 'Propagation path, timing, magnitude'],
    ],
    chips: ['Regulatory exposure', 'Sanctions and controls', 'Trade measures', 'Policy design'],
  },
];
