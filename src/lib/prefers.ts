/**
 * Environment preferences. Read once, kept live.
 */

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let reduced = reducedQuery.matches;
const listeners = new Set<(v: boolean) => void>();

reducedQuery.addEventListener('change', (event) => {
  reduced = event.matches;
  for (const fn of listeners) fn(reduced);
});

export const prefersReducedMotion = (): boolean => reduced;

export function onReducedMotionChange(fn: (v: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Coarse pointer — used to skip hover-only affordances and heavy canvases. */
export const isCoarsePointer = (): boolean =>
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/** Device pixel ratio, capped so large canvases stay cheap. */
export const dpr = (cap = 2): number => Math.min(window.devicePixelRatio || 1, cap);
