/**
 * Decisions you can run: fifteen questions from five domains, each one a
 * decision, an assumption, and a horizon — phrased the way the owner of the
 * decision would say it out loud, and attributed to the desk that owns it.
 */

export type RunnableQuestion = {
  domain: string;
  role: string;
  text: string;
};

export const QUESTIONS: RunnableQuestion[] = [
  {
    domain: 'Capital allocation',
    role: 'Infrastructure fund CIO',
    text: 'We’re underwriting a $1.8B data-center portfolio at 6.2% financing. Under which power, demand and rate paths does it clear — and at what price does it survive most of them?',
  },
  {
    domain: 'Capital allocation',
    role: 'Bank treasurer',
    text: 'If the Fed cuts 150bp over twelve months, which combinations of deposit behavior, spreads and refinancing windows become plausible — and which of our three allocation options holds across them?',
  },
  {
    domain: 'Capital allocation',
    role: 'Macro portfolio manager',
    text: 'Our thesis assumes AI capex keeps compounding. What sequence of evidence would tell us it’s breaking — early enough to act?',
  },
  {
    domain: 'Market entry',
    role: 'Chief strategy officer',
    text: 'Entering Japan assumes approval inside nine months and a stable yen corridor. How do the futures re-weight if either slips?',
  },
  {
    domain: 'Market entry',
    role: 'Regional CEO',
    text: 'A subsidized competitor lands at 30% under our price. Which responses hold share across the widest range of demand paths?',
  },
  {
    domain: 'Market entry',
    role: 'Head of corporate development',
    text: 'Which of these four expansion markets stays attractive across rate, currency and policy futures — not just in the base case?',
  },
  {
    domain: 'Product & technology',
    role: 'Silicon program lead',
    text: 'Committing to this roadmap bets on packaging capacity and export rules holding. Run both the other way: where does it break, and when would we know?',
  },
  {
    domain: 'Product & technology',
    role: 'Head of product',
    text: 'If inference costs fall another 10× in twenty-four months, which of our bets get stronger, which get commoditized, and in what order?',
  },
  {
    domain: 'Product & technology',
    role: 'Chief technology officer',
    text: 'Ship the platform in March, or wait for the standard to settle? Which choice survives more futures of the standards fight?',
  },
  {
    domain: 'Risk & resilience',
    role: 'Chief supply chain officer',
    text: 'Port capacity falls 35% for ninety days. What sequence of inventory, pricing, substitution and policy response follows — and which pre-commitments blunt it?',
  },
  {
    domain: 'Risk & resilience',
    role: 'Chief risk officer',
    text: 'Which three concentrations in our supplier network drive most of the modeled downside?',
  },
  {
    domain: 'Risk & resilience',
    role: 'Treasury & funding desk',
    text: 'A major counterparty fails on a Friday. What do the next two weeks look like across funding, collateral and customer behavior — and what should already be in place?',
  },
  {
    domain: 'Policy & geopolitics',
    role: 'Head of geopolitical risk',
    text: 'Export controls tighten one more notch. Where do flows, prices and capacity actually migrate over eighteen months?',
  },
  {
    domain: 'Policy & geopolitics',
    role: 'Defense strategic planner',
    text: 'Which escalation paths matter to our operations, what are their leading indicators, and which contingencies stay useful across most of them?',
  },
  {
    domain: 'Policy & geopolitics',
    role: 'CFO, global manufacturer',
    text: 'A new tariff schedule lands mid-year. Which pricing, sourcing and siting responses are robust before the final numbers are known?',
  },
];
