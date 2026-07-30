/**
 * Numeric helpers shared by motion and the generated visuals.
 */

export const clamp = (v: number, lo = 0, hi = 1): number => (v < lo ? lo : v > hi ? hi : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const invLerp = (a: number, b: number, v: number): number =>
  a === b ? 0 : clamp((v - a) / (b - a));

export const mapRange = (
  v: number,
  inA: number,
  inB: number,
  outA: number,
  outB: number,
): number => lerp(outA, outB, invLerp(inA, inB, v));

export const smoothstep = (t: number): number => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t), 3);

export const easeInOutCubic = (t: number): number => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/**
 * Deterministic pseudo-random generator (mulberry32). The generated visuals
 * must look identical on every load and in every screenshot, so nothing here
 * uses Math.random.
 */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Round to a fixed number of decimals, returned as a number. */
export const round = (v: number, places = 2): number => {
  const f = 10 ** places;
  return Math.round(v * f) / f;
};
