/**
 * Two specimen runs: what the machine actually returns for one decision,
 * typeset as the document it produces. Figures are illustrative; the shape
 * is exact — state, intervention, weighted futures, what survives, and a
 * claim committed before the outcome is known.
 */

export type RunPath = { w: number; text: string; tail?: boolean };

export type Run = {
  id: string;
  label: string;
  number: string;
  decision: string;
  state: string;
  options: { key: string; text: string }[];
  /** Which option the futures are run under. */
  under: string;
  paths: RunPath[];
  /** The surviving option, then the sentence that says so. */
  survives: { em: string; rest: string };
  resolution: { committed: string; resolves: string; hash: string };
};

export const RUNS: Run[] = [
  {
    id: 'capital',
    label: 'Capital allocation',
    number: '00001654',
    decision:
      'Commit £180M to a 120 MW data-centre campus now, or stage it, while the grid connection date is still uncertain.',
    state:
      'Connection offered for Q3 2028, two later dates possible. Pre-let covers 40 of 120 MW. Construction cost index up 9% in twelve months. Power terms unsigned. 24 evidence items, 1 disputed assumption: the connection date.',
    options: [
      { key: 'A', text: 'Commit the full campus now.' },
      { key: 'B', text: 'Build 40 MW and option the rest.' },
      { key: 'C', text: 'Defer twelve months.' },
    ],
    under: 'A',
    paths: [
      { w: 0.38, text: 'Connection on time, tenants sign; campus full by 2029.' },
      { w: 0.27, text: 'Connection slips a year; 40 MW earns, 80 MW waits.' },
      { w: 0.19, text: 'Costs overrun 15% or more; financing reprices.' },
      { w: 0.11, text: 'Second tenant fails; 40 MW stranded to 2030.', tail: true },
      { w: 0.05, text: 'Connection slips two years.', tail: true },
    ],
    survives: { em: 'B holds in four of five paths.', rest: 'A holds in two.' },
    resolution: { committed: '31 Aug 2026', resolves: 'at connection, Q3 2028', hash: '8fa1…c9e4' },
  },
  {
    id: 'specialty',
    label: 'Specialty risk',
    number: '00001671',
    decision:
      'Renew a $250M aggregate cyber treaty at current terms, tighten it, or decline, as the book\u2019s accumulation shifts.',
    state:
      '1,140 insureds; 31% share one cloud provider. Ransomware frequency down 12%, severity up 40%. Two regulatory regimes changing in-year. 17 evidence items, 1 disputed assumption: provider concentration.',
    options: [
      { key: 'A', text: 'Renew as is.' },
      { key: 'B', text: 'Renew with a 12-hour-outage sublimit.' },
      { key: 'C', text: 'Decline.' },
    ],
    under: 'A',
    paths: [
      { w: 0.44, text: 'Ordinary year; loss ratio 61%.' },
      { w: 0.26, text: 'A single-provider outage over six hours reaches 31% of the book.' },
      { w: 0.17, text: 'Severity trend continues; loss ratio 84%.' },
      { w: 0.09, text: 'Systemic event; aggregate exhausted.', tail: true },
      { w: 0.04, text: 'Retroactive regulatory change.', tail: true },
    ],
    survives: { em: 'B holds in four of five paths.', rest: 'A holds in two.' },
    resolution: { committed: '2 Sep 2026', resolves: 'at treaty year-end', hash: '3c7d…a1f2' },
  },
];
