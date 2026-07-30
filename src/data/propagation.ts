/**
 * The connected world.
 *
 * Six steps of one real chain, and three settings of the upstream condition.
 * The point of the module is the reversal at step five: when buildout slows, the
 * interconnection queue it was competing in gets shorter. A chain of isolated
 * forecasts would have moved every step in the same direction.
 *
 * The magnitudes are illustrative and labelled as such in the UI. The structure
 * — and the direction of each link — is the claim.
 */

export type Lever = 'tighten' | 'hold' | 'ease';

export type PropagationNode = {
  id: string;
  /** Step name, shown in caps. */
  label: string;
  /** The stated outcome whose probability moves. */
  outcome: string;
  /** Probability under each setting of the upstream condition. */
  values: Record<Lever, number>;
  /** Order of the effect, counted from the rule. */
  order: string;
  /** Set on the step whose direction reverses. */
  reversal?: boolean;
};

export const LEVERS: Array<{ id: Lever; label: string; caption: string }> = [
  { id: 'tighten', label: 'Controls tighten', caption: 'Licensing scope widens within twelve months.' },
  { id: 'hold', label: 'Unchanged', caption: 'Current licensing scope and enforcement persist.' },
  { id: 'ease', label: 'Controls ease', caption: 'Licensing scope narrows or exemptions broaden.' },
];

export const PROPAGATION: PropagationNode[] = [
  {
    id: 'supply',
    label: 'Chip supply',
    outcome: 'Accelerator deliveries fall short of plan through 2027',
    values: { tighten: 71, hold: 42, ease: 24 },
    order: 'First order',
  },
  {
    id: 'buildout',
    label: 'Data-centre buildout',
    outcome: 'Campus energisation slips by two quarters or more',
    values: { tighten: 64, hold: 39, ease: 27 },
    order: 'Second order',
  },
  {
    id: 'power',
    label: 'Power demand',
    outcome: 'Regional peak demand growth lands below the utility plan',
    values: { tighten: 58, hold: 31, ease: 19 },
    order: 'Third order',
  },
  {
    id: 'grid',
    label: 'Grid constraints',
    outcome: 'Interconnection award for a competing project slips past 2029',
    values: { tighten: 44, hold: 52, ease: 63 },
    order: 'Fourth order',
    reversal: true,
  },
  {
    id: 'capital',
    label: 'Capital allocation',
    outcome: 'Committed capital is reallocated away from the region',
    values: { tighten: 55, hold: 28, ease: 17 },
    order: 'Fifth order',
  },
];

export const REVERSAL_NOTE =
  'Note the reversal at grid constraints. A slower buildout relieves the queue it was competing in, so the fourth-order probability falls while everything upstream of it rises. Forecasting each step alone would have moved all five in the same direction.';
