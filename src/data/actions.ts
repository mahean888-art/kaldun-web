/**
 * What the machine is pointed at: five actions, in the words the launch
 * essay itself uses. The hero's changing verb steps through the same five.
 */

export type Action = {
  ordinal: string;
  verb: string;
  object: string;
  line: string;
};

export const ACTIONS: Action[] = [
  {
    ordinal: '01',
    verb: 'Allocate',
    object: 'capital',
    line: 'A loan, a position, a fund, sized against the whole balance sheet and the futures it has to survive.',
  },
  {
    ordinal: '02',
    verb: 'Underwrite',
    object: 'risk',
    line: 'A policy priced against everything already insured and the losses that arrive together.',
  },
  {
    ordinal: '03',
    verb: 'Hedge',
    object: 'exposure',
    line: 'A position held against rates, prices, weather, and the moves that come at once.',
  },
  {
    ordinal: '04',
    verb: 'Procure',
    object: 'supply',
    line: 'Capacity, energy, inputs, bought against demand, outages, and the next constraint.',
  },
  {
    ordinal: '05',
    verb: 'Intervene',
    object: 'a system',
    line: 'A port, a grid, a market: where failure spreads, and where to act so it is contained.',
  },
];
