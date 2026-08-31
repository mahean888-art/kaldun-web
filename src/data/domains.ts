/**
 * The five domains of machine foresight, and what runs in each.
 *
 * Each domain gets a plain description in the machine's grammar — state,
 * action, futures — and its use cases: noun-led, concrete, the way the desk
 * that owns the decision would file them.
 */

export type Domain = {
  ordinal: string;
  label: string;
  /** Two lines on why decisions outrun certainty here. */
  description: string;
  cases: string[];
};

export const DOMAINS: Domain[] = [
  {
    ordinal: '01',
    label: 'Capital & treasury',
    description:
      'Decisions that are already code. Treasury rules, mandates and tokenized funds act the moment a threshold trips — at machine speed, on yesterday’s assumptions.',
    cases: [
      'Run a treasury or rebalancing rule against rate and liquidity futures before it runs live money.',
      'Test a financing or an allocation against the demand, rate and refinancing paths it must survive.',
      'Find the early evidence that the assumption behind a position is breaking.',
    ],
  },
  {
    ordinal: '02',
    label: 'Insurance',
    description:
      'A policy is a priced future. Underwriting, reserving and reinsurance stand or fall on how well tomorrow’s losses were imagined today.',
    cases: [
      'Run a book of catastrophe cover against climate and exposure futures before renewal terms are set.',
      'Test reserves against the loss paths a new liability theory or a changing climate opens.',
      'Price a risk class with no loss history by running the worlds that would produce one.',
    ],
  },
  {
    ordinal: '03',
    label: 'Real assets',
    description:
      'Power, land, infrastructure: capital that cannot move once placed, in a world that keeps moving.',
    cases: [
      'Site a data center against power, water, transmission and demand futures — before the land is bought.',
      'Run a twenty-year power purchase against fuel, policy and grid paths.',
      'Test a port, pipeline or plant against the trade flows that must exist for it to pay.',
    ],
  },
  {
    ordinal: '04',
    label: 'Defense & national resilience',
    description:
      'Adversaries, alliances and supply chains answer back. The state that runs the futures first holds the initiative.',
    cases: [
      'Keep escalation paths under watch, with their leading indicators and the contingencies that hold across most of them.',
      'Run a procurement bet against the industrial-base and technology futures it assumes.',
      'Sequence a supply shock — what follows a strait closing or a fab going dark, and what should already be in place.',
    ],
  },
  {
    ordinal: '05',
    label: 'Policy & geopolitics',
    description:
      'Rules change the board while the game is being played. A tariff line or an export control redraws flows for a decade.',
    cases: [
      'Run a rule change through to where flows, prices and capacity actually migrate.',
      'Test a policy package against the responses of the actors it binds.',
      'Hold a position across the widest range of regulatory and competitive futures.',
    ],
  },
];
