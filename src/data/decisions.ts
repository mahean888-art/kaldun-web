/**
 * Use-case contrast: an isolated prediction beside connected foresight.
 *
 * One entry per domain. Each is written the way a decision memo is written —
 * a number, a horizon, a committed action — because the contrast only lands if
 * the decision is specific. These are worked examples, not customer records.
 */

export type DecisionExample = {
  domainId: string;
  tab: string;
  /** The small label above the example. */
  label: string;
  /** What an isolated prediction returns. */
  currentView: string;
  /** What the Engine returns when the conditions are run together. */
  kaldun: string;
  /** The qualifier that changes the answer. */
  qualifier: string;
  /** The committed action. */
  decision: string;
  /** Explicit futures with odds, for the right-hand pane. */
  futures: Array<{ label: string; odds: number; note?: string }>;
};

export const DECISIONS: DecisionExample[] = [
  {
    domainId: 'capital',
    tab: 'Allocation',
    label: 'A $3.2 billion facility decision',
    currentView:
      'Region A ranked first on subsidies, current energy prices, and expected labor costs.',
    kaldun:
      'When export controls, grid delays, supplier response, and subsidy durability were run together, Region B led across 54% of viable futures.',
    qualifier: 'Region A was preferable only if two policy assumptions held simultaneously.',
    decision:
      'Stage permitting and land acquisition in Region B. Preserve an option on Region A until the policy conditions resolve.',
    futures: [
      { label: 'Region B leads on delivered cost and schedule', odds: 54, note: 'Grid access dominates' },
      { label: 'Region A leads — both policy assumptions hold', odds: 23, note: 'Requires subsidy durability' },
      { label: 'Neither site clears the return threshold', odds: 15, note: 'Equipment lead times slip' },
      { label: 'Decision deferred past the funding window', odds: 8 },
    ],
  },
  {
    domainId: 'market',
    tab: 'Expansion',
    label: 'A two-market entry decision',
    currentView:
      'Both markets scored above threshold on demand, willingness to pay, and channel readiness.',
    kaldun:
      'When licensing timelines, incumbent pricing response, and channel capacity were run together, simultaneous entry cleared the return threshold in only 31% of futures.',
    qualifier: 'Sequenced entry survived because the second licence was rarely granted on the assumed date.',
    decision:
      'Enter the smaller market first. Hold the second entry behind a licensing trigger rather than a calendar date.',
    futures: [
      { label: 'Sequenced entry clears the threshold', odds: 58, note: 'Licence timing absorbed' },
      { label: 'Simultaneous entry clears the threshold', odds: 31, note: 'Requires both licences on time' },
      { label: 'Incumbent price response erases the margin', odds: 22, note: 'Overlaps other futures' },
      { label: 'Neither market is entered this cycle', odds: 11 },
    ],
  },
  {
    domainId: 'product',
    tab: 'Technology',
    label: 'An architecture commitment across three product cycles',
    currentView:
      'Single-path architecture returned the lowest projected unit cost at planned volume.',
    kaldun:
      'When lead times, export rules, standard convergence, and volume risk were run together, the dual-path plan produced a better outcome in 61% of futures despite a higher nominal cost.',
    qualifier: 'The single path won only where volume held and no supply interruption occurred.',
    decision:
      'Fund the dual path for cycle one. Collapse to a single path at the cycle-two gate if supply and standards have resolved.',
    futures: [
      { label: 'Dual path outperforms on delivered cost', odds: 61, note: 'Optionality pays for itself' },
      { label: 'Single path wins — volume and supply hold', odds: 26 },
      { label: 'Standard shifts and strands part of the roadmap', odds: 18, note: 'Overlaps other futures' },
      { label: 'Programme is rescoped before cycle two', odds: 9 },
    ],
  },
  {
    domainId: 'risk',
    tab: 'Resilience',
    label: 'A single-region manufacturing base under correlated shock',
    currentView:
      'Each risk was rated individually. No single event breached the continuity threshold.',
    kaldun:
      'When power curtailment, port disruption, and an export-control change were allowed to arrive together, continuity failed in 37% of futures — and buffer stock alone held in almost none of them.',
    qualifier: 'The mitigations that survived were the ones that did not share a dependency.',
    decision:
      'Qualify a second source outside the region before expanding buffer stock. Re-test the correlation quarterly.',
    futures: [
      { label: 'Continuity holds with a second source qualified', odds: 63 },
      { label: 'Continuity fails under correlated arrival', odds: 37, note: 'Buffer stock insufficient' },
      { label: 'Two or more mitigations fail on one dependency', odds: 24, note: 'Overlaps other futures' },
      { label: 'Relocation becomes the cheapest remaining option', odds: 12 },
    ],
  },
  {
    domainId: 'policy',
    tab: 'Policy',
    label: 'A tightening of semiconductor export controls',
    currentView:
      'The measure was assessed on its first-order effect: which shipments become licensable.',
    kaldun:
      'Run forward, the measure moved chip supply, buildout schedules, regional power demand, interconnection queues, and finally capital allocation — with the largest effect arriving three steps from the rule.',
    qualifier: 'The first-order effect was the smallest term in the chain.',
    decision:
      'Reprice the power and grid exposure now, not the shipment exposure. Set the review trigger on licence throughput.',
    futures: [
      { label: 'Buildout slips and power demand flattens regionally', odds: 47, note: 'Third-order effect' },
      { label: 'Substitution absorbs the measure within four quarters', odds: 29 },
      { label: 'Retaliation extends the chain into inputs', odds: 19, note: 'Overlaps other futures' },
      { label: 'Measure is narrowed before it binds', odds: 14 },
    ],
  },
];

export const decisionForDomain = (id: string): DecisionExample | undefined =>
  DECISIONS.find((d) => d.domainId === id);
