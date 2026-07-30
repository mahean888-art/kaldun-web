/**
 * The Kaldun Record.
 *
 * Worked examples of the record's shape: what was believed, when, on what
 * information, under which resolution rule, and what reality decided. The
 * entries below are illustrative — the site says so everywhere they appear —
 * because a track record is earned by resolution, not by presentation.
 */

export type Status = 'open' | 'resolved-yes' | 'resolved-no';

export type Update = {
  date: string;
  probability: number | null;
  /** Shown instead of a probability at resolution. */
  note?: string;
};

export type RecordEntry = {
  id: string;
  domainId: string;
  question: string;
  original: number;
  current: number;
  committed: string;
  information: string;
  resolution: string;
  model: string;
  horizon: string;
  status: Status;
  commitment: string;
  updates: Update[];
  /** Why the belief moved. One line per material update. */
  drivers: string[];
  score?: string;
};

export const RECORD: RecordEntry[] = [
  {
    id: 'kr-0412',
    domainId: 'capital',
    question: 'Permit granted before 30 June',
    original: 64,
    current: 71,
    committed: '12 March 2027 · 09:41 UTC',
    information: 'Through 12 March 2027 · 09:30 UTC',
    resolution: 'State permitting database',
    model: 'Kaldun Engine 0.8.4',
    horizon: 'Four months',
    status: 'resolved-yes',
    commitment: 'a41f…9c7e',
    updates: [
      { date: '12 Mar 2027', probability: 64 },
      { date: '04 Apr 2027', probability: 58 },
      { date: '19 May 2027', probability: 71 },
      { date: '26 Jun 2027', probability: null, note: 'Resolved — Yes' },
    ],
    drivers: [
      'Second hearing scheduled inside the statutory window.',
      'Objection period closed with two filings, both procedural.',
      'Comparable applications in the same district cleared in 71 days.',
    ],
    score: 'Brier 0.084 · better than the 50% baseline',
  },
  {
    id: 'kr-0455',
    domainId: 'policy',
    question: 'Licensing scope widened before 31 December',
    original: 38,
    current: 46,
    committed: '02 February 2027 · 14:07 UTC',
    information: 'Through 02 February 2027 · 14:00 UTC',
    resolution: 'Federal register publication',
    model: 'Kaldun Engine 0.8.4',
    horizon: 'Eleven months',
    status: 'open',
    commitment: '7b02…14da',
    updates: [
      { date: '02 Feb 2027', probability: 38 },
      { date: '17 Mar 2027', probability: 35 },
      { date: '28 Apr 2027', probability: 46 },
    ],
    drivers: [
      'Consultation opened on two of the four covered categories.',
      'Enforcement actions rose in the preceding quarter.',
    ],
  },
  {
    id: 'kr-0388',
    domainId: 'risk',
    question: 'Two or more mitigations fail on a shared dependency within twelve months',
    original: 22,
    current: 18,
    committed: '19 November 2026 · 08:12 UTC',
    information: 'Through 19 November 2026 · 08:00 UTC',
    resolution: 'Customer incident log, adjudicated by contract',
    model: 'Kaldun Engine 0.8.1',
    horizon: 'Twelve months',
    status: 'resolved-no',
    commitment: 'c93d…5f10',
    updates: [
      { date: '19 Nov 2026', probability: 22 },
      { date: '21 Feb 2027', probability: 27 },
      { date: '30 Jun 2027', probability: 18 },
      { date: '19 Nov 2027', probability: null, note: 'Resolved — No' },
    ],
    drivers: [
      'Second source qualified two quarters ahead of plan.',
      'Shared power dependency removed from the primary line.',
    ],
    score: 'Brier 0.041 · better than the 50% baseline',
  },
  {
    id: 'kr-0501',
    domainId: 'product',
    question: 'Component lead time exceeds 40 weeks at any point before Q4',
    original: 57,
    current: 49,
    committed: '08 January 2027 · 11:20 UTC',
    information: 'Through 08 January 2027 · 11:00 UTC',
    resolution: 'Supplier-published lead time, weekly capture',
    model: 'Kaldun Engine 0.8.4',
    horizon: 'Nine months',
    status: 'open',
    commitment: '2e77…8b3c',
    updates: [
      { date: '08 Jan 2027', probability: 57 },
      { date: '26 Feb 2027', probability: 61 },
      { date: '14 Apr 2027', probability: 49 },
    ],
    drivers: [
      'Second fab qualified for the constrained component.',
      'Order book lengthened, then flattened across two captures.',
    ],
  },
  {
    id: 'kr-0344',
    domainId: 'market',
    question: 'Operating licence granted in the second market before 30 September',
    original: 45,
    current: 33,
    committed: '30 September 2026 · 16:55 UTC',
    information: 'Through 30 September 2026 · 16:45 UTC',
    resolution: 'Regulator public register',
    model: 'Kaldun Engine 0.8.0',
    horizon: 'Twelve months',
    status: 'open',
    commitment: 'f118…20a9',
    updates: [
      { date: '30 Sep 2026', probability: 45 },
      { date: '11 Jan 2027', probability: 40 },
      { date: '22 May 2027', probability: 33 },
    ],
    drivers: [
      'Regulator paused new applications for one quarter.',
      'Two comparable applicants withdrew before decision.',
    ],
  },
];

export const RECORD_FILTERS: Array<{ id: string; label: string; options: string[] }> = [
  { id: 'domain', label: 'Domain', options: ['All', 'Capital', 'Market', 'Product', 'Risk', 'Policy'] },
  { id: 'horizon', label: 'Horizon', options: ['All', 'Under 6 months', '6–12 months', 'Over 12 months'] },
  { id: 'status', label: 'Status', options: ['All', 'Open', 'Resolved yes', 'Resolved no'] },
  { id: 'probability', label: 'Probability', options: ['All', 'Under 25%', '25–50%', '50–75%', 'Over 75%'] },
  { id: 'model', label: 'Model version', options: ['All', '0.8.0', '0.8.1', '0.8.4'] },
  { id: 'resolution', label: 'Resolution type', options: ['All', 'Public register', 'Database capture', 'Adjudicated'] },
];

export const RECORD_OBJECT: Array<[string, string]> = [
  ['QUESTION', 'The claim, written so that it can only resolve one way'],
  ['CURRENT PROBABILITY', 'The live belief'],
  ['ORIGINAL PROBABILITY', 'The belief at commitment, never overwritten'],
  ['COMMITTED', 'Timestamp of the first published belief'],
  ['INFORMATION CUTOFF', 'What the Engine could see when it committed'],
  ['UPDATE HISTORY', 'Every version, in order, with what moved it'],
  ['RESOLUTION CONTRACT', 'The source and rule that will decide the outcome'],
  ['OUTCOME', 'What reality returned'],
  ['SCORE', 'Calibration against the outcome'],
  ['COMPARISON BASELINE', 'What a naive forecast would have scored'],
  ['COMMITMENT', 'Hash proving the record predates the outcome'],
];
