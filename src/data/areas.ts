/**
 * Project 1654 — research areas, each phrased as the question it exists to
 * answer. A list of nouns is a syllabus; a list of questions is a lab.
 */

export type Area = { name: string; question: string };

export const AREAS: Area[] = [
  { name: 'State estimation', question: 'what is true right now, and with what uncertainty?' },
  { name: 'Temporal world models', question: 'how does state evolve, and how does it evolve under intervention?' },
  { name: 'State-space & dynamical systems', question: 'what structure do transitions actually have?' },
  { name: 'Drivers & identification', question: 'what moves what, and when are we entitled to say so?' },
  { name: 'Simulation & multi-agent systems', question: 'which futures only appear when behavior is modeled?' },
  { name: 'Temporal point processes', question: 'when do discrete events arrive, and what do arrivals reveal?' },
  { name: 'Probabilistic forecasting & calibration', question: 'do the distributions mean what they say?' },
  { name: 'Scoring rules & evaluation through time', question: 'how should time grade a belief?' },
  { name: 'Decision-making under uncertainty', question: 'which choices survive the widest set of futures?' },
  { name: 'Belief revision & continual learning', question: 'how does a system update without forgetting?' },
];
