/**
 * The five decision domains. One Engine, five places it is pointed.
 *
 * `card` copy drives the home-page carousel; the rest drives the Domains page.
 */

import type { GlyphName } from '../visuals/glyphs';

export type Domain = {
  id: string;
  name: string;
  /** Carousel description. */
  card: string;
  /** Domain headline on the Domains page. */
  headline: string;
  /** Domain description. */
  description: string;
  /** Use-case tags. */
  tags: string[];
  /** Three panels: state / futures / decision. */
  panels: { state: string; futures: string; decision: string };
  /** A specific decision, stated concretely. */
  specific: string;
  /** Decision details, rendered as a monospace object. */
  details: Array<[string, string]>;
  /** Primary action label. */
  action: string;
  glyph: GlyphName;
  seed: number;
};

export const DOMAINS: Domain[] = [
  {
    id: 'capital',
    name: 'Capital Allocation',
    card: 'Test investment size, timing, staging, and downside across the futures that determine long-term value.',
    headline: 'Capital should not depend<br>on one future.',
    description:
      'Investment cases often hide one path for demand, financing, regulation, execution, and exit. Kaldun runs those conditions together before capital is committed.',
    tags: ['Portfolio construction', 'Infrastructure investment', 'M&A', 'Treasury', 'Capital staging'],
    panels: {
      state: 'Committed capital, live pricing, permitting position, counterparty exposure, and what the base case already assumes.',
      futures:
        'Demand, financing cost, regulation, equipment lead times, and exit conditions moved together rather than one at a time.',
      decision:
        'The allocation and staging that stays sound across the plausible futures, and the triggers that would change it.',
    },
    specific:
      'Choosing how to allocate $800 million across grid storage, transmission, and on-site generation.',
    details: [
      ['COMMITMENT', '$800M'],
      ['HORIZON', 'Seven years'],
      ['OPTIONS', 'Storage / Transmission / Generation'],
      ['DEPENDENCIES', 'Demand / Permitting / Rates / Equipment'],
      ['ENGINE OUTPUT', 'Allocation / Staging / Triggers / Downside'],
    ],
    action: 'Run a capital decision',
    glyph: 'branching',
    seed: 101,
  },
  {
    id: 'market',
    name: 'Market Entry & Expansion',
    card: 'Test market, timing, partner, and entry mode against how demand, regulation, competition, and supply may move.',
    headline: 'The market will react<br>to your arrival.',
    description:
      'An entry plan is a claim about a market that has not been told yet. Kaldun runs the response: how demand forms, how incumbents price, how regulators read the move, and how supply keeps up.',
    tags: ['Market selection', 'Entry sequencing', 'Partner and channel', 'Localisation', 'Pricing entry'],
    panels: {
      state: 'Demand signals, regulatory position, incumbent behaviour, channel capacity, and current cost to serve.',
      futures:
        'Competitive response, licensing timelines, input costs, and adoption curves as one connected system.',
      decision: 'Which market, in which order, through which mode — and what would justify stopping.',
    },
    specific:
      'Choosing whether to enter two regulated markets simultaneously or sequence entry across eighteen months.',
    details: [
      ['COMMITMENT', '$140M / 18 months'],
      ['HORIZON', 'Four years'],
      ['OPTIONS', 'Simultaneous / Sequenced / Partner-led'],
      ['DEPENDENCIES', 'Licensing / Incumbent pricing / Channel / FX'],
      ['ENGINE OUTPUT', 'Order / Timing / Mode / Exit triggers'],
    ],
    action: 'Run an entry decision',
    glyph: 'lattice',
    seed: 202,
  },
  {
    id: 'product',
    name: 'Product & Technology',
    card: 'Test roadmap and architecture choices against adoption, cost curves, standards, supply, and competing technologies.',
    headline: 'A roadmap is a forecast<br>about what will matter.',
    description:
      'Every roadmap encodes beliefs about cost curves, standards, supply, and what customers will want in three years. Kaldun makes those beliefs explicit and scores them when they resolve.',
    tags: ['Roadmap sequencing', 'Architecture bets', 'Build vs buy', 'Standards exposure', 'Capacity planning'],
    panels: {
      state: 'Adoption to date, unit economics, supply position, standards in motion, and competing approaches in the field.',
      futures: 'Cost curves, component availability, standard convergence, and substitution moving together.',
      decision: 'Which commitments to make now, which to keep optional, and which evidence would reverse them.',
    },
    specific:
      'Choosing whether to commit a product line to one accelerator architecture or preserve two supply paths.',
    details: [
      ['COMMITMENT', 'Three product cycles'],
      ['HORIZON', 'Five years'],
      ['OPTIONS', 'Single path / Dual path / Deferred'],
      ['DEPENDENCIES', 'Lead times / Cost curve / Standards / Export rules'],
      ['ENGINE OUTPUT', 'Commitment / Optionality / Cost / Reversal triggers'],
    ],
    action: 'Run a technology decision',
    glyph: 'ephemeris',
    seed: 303,
  },
  {
    id: 'risk',
    name: 'Risk & Resilience',
    card: 'See which operational, financial, physical, and geopolitical risks arrive together—and which mitigations continue to hold.',
    headline: 'The risks that matter<br>rarely arrive alone.',
    description:
      'Risk registers list events separately. Reality delivers them in combination. Kaldun runs correlated arrivals and tests which mitigations still hold when several conditions fail at once.',
    tags: ['Correlated exposure', 'Supply continuity', 'Liquidity stress', 'Physical risk', 'Concentration'],
    panels: {
      state: 'Exposure by counterparty, geography, input, and facility — plus the mitigations currently assumed to work.',
      futures: 'Which failures co-arrive, in what order, and how quickly the second one compounds the first.',
      decision: 'Which mitigations to fund, which to retire, and which exposure to reduce before the correlation shows up.',
    },
    specific:
      'Testing whether a single-region manufacturing base survives a simultaneous power, logistics, and export-control shock.',
    details: [
      ['EXPOSURE', 'One region / Three inputs'],
      ['HORIZON', 'Thirty-six months'],
      ['OPTIONS', 'Dual-source / Buffer stock / Relocate'],
      ['DEPENDENCIES', 'Grid / Ports / Export rules / Insurance'],
      ['ENGINE OUTPUT', 'Correlated futures / Surviving mitigations / Cost of resilience'],
    ],
    action: 'Run a resilience decision',
    glyph: 'convergence',
    seed: 404,
  },
  {
    id: 'policy',
    name: 'Policy & Geopolitics',
    card: 'Test how rules, elections, sanctions, and conflict propagate through markets, investment, supply, and behavior.',
    headline: 'The rule change is only<br>the first-order event.',
    description:
      'A rule is written once and felt for years. Kaldun runs the propagation: who reprices, who relocates, who files, who waits — and what the second and third orders do to the original intent.',
    tags: ['Regulatory exposure', 'Sanctions and controls', 'Election outcomes', 'Trade measures', 'Policy design'],
    panels: {
      state: 'Rules in force, rules in consultation, enforcement posture, and the positions currently taken by affected parties.',
      futures: 'Compliance behaviour, market repricing, relocation, and retaliation, run as one chain.',
      decision: 'Which position to take, when to move, and which policy outcome would make the move wrong.',
    },
    specific:
      'Testing how a tightening of semiconductor export controls propagates into power demand and capital allocation.',
    details: [
      ['MEASURE', 'Export control tightening'],
      ['HORIZON', 'Twenty-four months'],
      ['ORDERS', 'Supply / Buildout / Power / Grid / Capital'],
      ['DEPENDENCIES', 'Licensing / Substitution / Retaliation / Enforcement'],
      ['ENGINE OUTPUT', 'Propagation path / Timing / Magnitude / Reversal conditions'],
    ],
    action: 'Run a policy decision',
    glyph: 'tablet',
    seed: 505,
  },
];

export const domainById = (id: string): Domain | undefined => DOMAINS.find((d) => d.id === id);
