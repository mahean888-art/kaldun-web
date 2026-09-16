/**
 * The Record's four bands. Structure only — no identifiers, no hashes, no
 * statuses. Where real records exist, an inspector may show their values;
 * nothing here is invented to look like one.
 */

export type Band = {
  ordinal: string;
  name: string;
  claim: string;
  body: string;
};

export const RECORD_BANDS: Band[] = [
  {
    ordinal: '01',
    name: 'State',
    claim: 'The world represented.',
    body: 'The model version, evidence, assumptions, and system state used for the run.',
  },
  {
    ordinal: '02',
    name: 'Decision',
    claim: 'The choices examined.',
    body: 'The objective, actions considered, constraints, and projected consequences.',
  },
  {
    ordinal: '03',
    name: 'Commitment',
    claim: 'A claim fixed in time.',
    body: 'The cryptographic commitment, time attestation, and information needed to verify the preserved contents.',
  },
  {
    ordinal: '04',
    name: 'Continuity',
    claim: 'New evidence. Original intact.',
    body: 'Subsequent evidence, outcomes, evaluations, and model revisions linked to the original record.',
  },
];
