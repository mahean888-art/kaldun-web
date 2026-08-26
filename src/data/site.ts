/**
 * Contact points and the page's data, in one place.
 */

export const EMAIL = 'hello@kaldun.ai';

/** Scheduling link, offered inside the decision moment — never on first click. */
export const CALENDLY = 'https://calendly.com/mahean888/30min';

/** What a sealed commitment carries, and how the seal is made. */
export const RECORD_FIELDS: Array<[string, string]> = [
  ['CLAIM', 'Written so it can only resolve one way'],
  ['PROBABILITY', 'A number or a distribution, never overwritten'],
  ['HORIZON', 'When the claim must resolve'],
  ['RESOLUTION RULE', 'The named source that will decide it'],
  ['EVIDENCE SNAPSHOT', 'What the machine could see at commitment'],
  ['MODEL VERSION', 'Which state of Kaldun made the claim'],
  ['SEAL', 'SHA-256 over the canonical bundle, published at commitment'],
  ['ANCHOR', 'RFC 3161 timestamp, plus a daily batch anchor of the Merkle root'],
];
