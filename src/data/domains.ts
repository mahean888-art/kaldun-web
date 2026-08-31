/**
 * Decisions you can run.
 *
 * Five domains, three questions each. Every question is runnable — it contains
 * a decision, a shock or assumption, and a horizon, phrased the way the owner
 * of the decision would say it out loud.
 */

export type Domain = {
  ordinal: string;
  label: string;
  /** One line on why decisions outrun certainty here. */
  tagline: string;
  questions: string[];
  /** What a run in this domain hands back, before the ink is dry. */
  outcome: string;
};

export const DOMAINS: Domain[] = [
  {
    ordinal: '01',
    label: 'Capital allocation',
    tagline: 'Money pledged before the world that repays it exists.',
    questions: [
      'We’re underwriting a $1.8B data-center portfolio at 6.2% financing. Under which power, demand and rate paths does it clear — and at what price does it survive most of them?',
      'If the Fed cuts 150bp over twelve months, which combinations of deposit behavior, spreads and refinancing windows become plausible — and which of our three allocation options holds across them?',
      'Our book assumes AI capex keeps compounding. What sequence of evidence would tell us it’s breaking — early enough to act?',
    ],
    outcome:
      'The paths where the deal clears, the price at which it survives most of them, and a sealed claim the Record will grade.',
  },
  {
    ordinal: '02',
    label: 'Market entry',
    tagline: 'Crossing into a jurisdiction is a bet on how it behaves.',
    questions: [
      'Entering Japan assumes approval inside nine months and a stable yen corridor. How do the futures re-weight if either slips?',
      'A subsidized competitor lands at 30% under our price. Which responses hold share across the widest range of demand paths?',
      'Which of these four expansion markets stays attractive across rate, currency and policy futures — not just in the base case?',
    ],
    outcome:
      'The futures in which the market stays worth entering — not just the base case — and the assumptions doing the most work.',
  },
  {
    ordinal: '03',
    label: 'Product & technology',
    tagline: 'Roadmaps are forecasts wearing Gantt charts.',
    questions: [
      'Backing this silicon roadmap bets on packaging capacity and export rules holding. Run both the other way: where does it break, and when would we know?',
      'If inference costs fall another 10× in twenty-four months, which of our bets get stronger, which get commoditized, and in what order?',
      'Ship the platform in March, or wait for the standard to settle? Which choice survives more futures of the standards fight?',
    ],
    outcome:
      'Where the roadmap breaks first, the order in which bets strengthen or commoditize, and the earliest evidence of each.',
  },
  {
    ordinal: '04',
    label: 'Risk & resilience',
    tagline: 'The expensive failures are sequences, not events.',
    questions: [
      'Port capacity falls 35% for ninety days. What sequence of inventory, pricing, substitution and policy response follows — and which preparations blunt it?',
      'Which three concentrations in our supplier network drive most of the modeled downside?',
      'A major counterparty fails on a Friday. What do the next two weeks look like across funding, collateral and customer behavior — and what should already be in place?',
    ],
    outcome:
      'The sequences behind the modeled downside, and which preparations blunt the most of them.',
  },
  {
    ordinal: '05',
    label: 'Policy & geopolitics',
    tagline: 'Rules change the board while the game is being played.',
    questions: [
      'Export controls tighten one more notch. Where do flows, prices and capacity actually migrate over eighteen months?',
      'Which escalation paths matter to our operations, what are their leading indicators, and which contingencies stay useful across most of them?',
      'A new tariff schedule lands mid-year. Which pricing, sourcing and siting responses are robust before the final numbers are known?',
    ],
    outcome:
      'Where flows and prices migrate under each rule change, and the contingencies that stay useful across most paths.',
  },
];
