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
    line: 'The trillions in sovereign wealth, private credit, and infrastructure, and the new banks and primitives being built beside them: each allocation run before it is made.',
  },
  {
    ordinal: '02',
    verb: 'Underwrite',
    object: 'risk',
    line: 'A risk with no loss history yet, priced from the futures it could set in motion.',
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
