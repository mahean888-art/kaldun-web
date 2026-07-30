/**
 * Contact points, in one place.
 *
 * Every "bring us a decision" and every fellowship action opens the same
 * scheduling link; everything else goes to the single address.
 */

export const EMAIL = 'hello@kaldun.ai';

/** Scheduling link used by both primary actions. */
export const CALENDLY = 'https://calendly.com/mahean888/30min';

export const PILLARS: Array<{ ordinal: string; title: string; body: string }> = [
  {
    ordinal: '01',
    title: 'Fluent is not calibrated',
    body: 'A model can produce a confident sentence about 2030 and give you no way to act on it. A decision needs a number that has been tested against outcomes, not a paragraph that reads well.',
  },
  {
    ordinal: '02',
    title: 'Events do not stay in their category',
    body: 'A regulation becomes a financing event. Financing changes supply. Supply changes price. Forecast each step alone and every one of them moves the same way — which is almost never what happens.',
  },
  {
    ordinal: '03',
    title: 'Confidence is not a record',
    body: 'A percentage with no timestamp, no information boundary and no resolution rule cannot be scored. Without a record there is no way to know whether the system was ever right.',
  },
  {
    ordinal: '04',
    title: 'Analyst review does not scale',
    body: 'When a team has to reconstruct the reasoning before it will trust the answer, the work has not been removed. It has been moved, and it now arrives later.',
  },
];

export const THESIS_SHOWS: string[] = [
  'what state it holds',
  'which assumptions it made',
  'which futures follow',
  'the odds of each',
  'what evidence would change them',
  'how it scored last time',
];

export const RECORD_FIELDS: Array<[string, string]> = [
  ['QUESTION', 'The claim, written so it can only resolve one way'],
  ['PROBABILITY', 'The belief at commitment, never overwritten'],
  ['COMMITTED', 'Timestamp, and what the Engine could see'],
  ['RESOLUTION', 'The named source and rule that will decide it'],
  ['OUTCOME', 'What reality returned'],
  ['SCORE', 'Calibration against that outcome, and against a baseline'],
];
