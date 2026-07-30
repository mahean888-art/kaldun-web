/**
 * Contact points, in one place.
 *
 * Every "bring us a decision" and every fellowship action opens the same
 * scheduling link; everything else goes to the single address.
 */

export const EMAIL = 'hello@kaldun.ai';

/** Scheduling link used by both primary actions. */
export const CALENDLY = 'https://calendly.com/kaldun/decision';

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
  ['COMMITTED', 'Timestamp of the first published belief'],
  ['INFORMATION', 'What the Engine could see when it committed'],
  ['RESOLUTION', 'The named source and rule that will decide it'],
  ['MODEL', 'The Engine version that produced it'],
  ['UPDATES', 'Every revision since, in order, with what moved it'],
  ['OUTCOME', 'What reality returned'],
  ['SCORE', 'Calibration against that outcome, and against a baseline'],
  ['COMMITMENT', 'The hash that proves the record predates the outcome'],
];

export const COMMITMENT_REASONS: string[] = [
  'Prove the forecast existed before the outcome.',
  'Prevent the original probability from being silently changed.',
  'Preserve every update as a new version.',
  'Allow the record to be verified independently.',
  'Make it impossible to show only the forecasts that worked.',
];
