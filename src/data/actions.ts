/**
 * Where foresight meets action: five actions, each with one concrete decision
 * behind it.
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
    line: 'A sovereign fund deciding whether to back a data\u2011center campus before its grid connection is secured.',
  },
  {
    ordinal: '02',
    verb: 'Underwrite',
    object: 'risk',
    line: 'An insurer deciding whether a satellite constellation with no loss history can be covered, and on what terms.',
  },
  {
    ordinal: '03',
    verb: 'Hedge',
    object: 'exposure',
    line: 'A refiner deciding how much of next winter\u2019s fuel to fix now and how much to leave open.',
  },
  {
    ordinal: '04',
    verb: 'Procure',
    object: 'supply',
    line: 'A manufacturer deciding whether to pay for a second supplier before the first one fails.',
  },
  {
    ordinal: '05',
    verb: 'Intervene',
    object: 'in a system',
    line: 'A central bank deciding whether to backstop deposits before a run reaches the next bank.',
  },
];
