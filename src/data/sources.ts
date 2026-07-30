/**
 * External sources.
 *
 * Every number shown on this site as a fact about the world is listed here with
 * its publisher and a link. Anything Kaldun itself produces is labelled
 * illustrative wherever it appears. The two are never blended.
 */

export type Source = {
  id: string;
  publisher: string;
  title: string;
  url: string;
};

export const SOURCES: Record<string, Source> = {
  iea: {
    id: 'iea',
    publisher: 'IEA',
    title: 'Energy and AI — World Energy Outlook Special Report',
    url: 'https://www.iea.org/reports/energy-and-ai/executive-summary',
  },
  ieaDemand: {
    id: 'ieaDemand',
    publisher: 'IEA',
    title: 'Energy and AI — Energy demand from AI',
    url: 'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai',
  },
  lbnl: {
    id: 'lbnl',
    publisher: 'Berkeley Lab',
    title: 'Queued Up — power plants seeking transmission interconnection',
    url: 'https://emp.lbl.gov/queues',
  },
  metaculus: {
    id: 'metaculus',
    publisher: 'Metaculus',
    title: 'Will data centres consume more than 10% of global electricity usage for the year 2030?',
    url: 'https://www.metaculus.com/questions/15610/data-centres-10-of-global-electricity/',
  },
};

export type Evidence = {
  /** What was observed. */
  claim: string;
  /** The measured figure, formatted for display. */
  figure: string;
  /** Which direction this pushes the question. */
  direction: 'up' | 'down' | 'flat';
  source: Source;
};

/**
 * The evidence set behind the worked example on the home page and Engine page.
 * All three rows are published, external and linked.
 */
export const DEMO_EVIDENCE: Evidence[] = [
  {
    claim: 'Global data-centre electricity consumption, 2024 → 2030 base case',
    figure: '415 → ~945 TWh',
    direction: 'up',
    source: SOURCES.iea as Source,
  },
  {
    claim: 'Data centres as a share of global electricity consumption in 2030',
    figure: 'just under 3%',
    direction: 'down',
    source: SOURCES.iea as Source,
  },
  {
    claim: 'US data centres as a share of US electricity demand growth to 2030',
    figure: 'nearly half',
    direction: 'up',
    source: SOURCES.ieaDemand as Source,
  },
  {
    claim: 'Generation and storage actively seeking US transmission interconnection',
    figure: '> 2,000 GW',
    direction: 'down',
    source: SOURCES.lbnl as Source,
  },
  {
    claim: 'Median interconnection request to commercial operation, recent projects',
    figure: '> 5 years',
    direction: 'down',
    source: SOURCES.lbnl as Source,
  },
];
