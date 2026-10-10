/**
 * Where foresight meets action: five decisions a shared model supports, each
 * with the question it should help answer.
 */

export type Action = {
  ordinal: string;
  verb: string;
  object: string;
  line: string;
};

export const ACTIONS: Action[] = [
  { ordinal: '01', verb: 'Allocate', object: 'capital', line: 'Which commitment remains viable when its funding, costs, or timing change?' },
  { ordinal: '02', verb: 'Underwrite', object: 'risk', line: 'Under what terms does a hard-to-price specialty risk become worth carrying?' },
  { ordinal: '03', verb: 'Hedge', object: 'exposure', line: 'Which protection still works when losses arrive together?' },
  { ordinal: '04', verb: 'Procure', object: 'supply', line: 'Which arrangement can meet demand when capacity or delivery is disrupted?' },
  { ordinal: '05', verb: 'Strengthen', object: 'resilience', line: 'Where could an intervention contain a failure before it spreads?' },
];
