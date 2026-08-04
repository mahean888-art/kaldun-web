/**
 * Contact points, in one place.
 *
 * Every "bring us a decision" and every fellowship action opens the same
 * scheduling link; everything else goes to the single address.
 */

export const EMAIL = 'hello@ulmolabs.com';

/** Scheduling link used by both primary actions. */
export const CALENDLY = 'https://calendly.com/mahean888/30min';

/** The cost of the failure, stated in four lines and attached to the argument. */
export const STATEMENTS: string[] = [
  'Fluent is not calibrated.',
  'Events do not stay in their category.',
  'Confidence is not a record.',
  'Analyst review does not scale.',
];

export const THESIS_SHOWS: string[] = [
  'what state it holds',
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
