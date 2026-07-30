/**
 * Update-history sparkline.
 *
 * A belief that moved, drawn as it moved: one polyline, a dot per committed
 * version, and a terminal mark when reality resolved it.
 */

import { svg } from '../lib/dom';
import { clamp } from '../lib/math';

export type SparkPoint = {
  probability: number | null;
  resolved?: boolean;
};

const W = 220;
const H = 44;
const PAD = 5;

export function makeSparkline(points: SparkPoint[], tone: 'signal' | 'bronze' = 'signal'): SVGElement {
  const numeric = points.filter((p) => p.probability !== null);
  if (numeric.length === 0) return svg('svg', { viewBox: `0 0 ${W} ${H}` });

  const stroke = tone === 'bronze' ? 'var(--bronze)' : 'var(--signal-hi)';
  const step = numeric.length > 1 ? (W - PAD * 2) / (numeric.length - 1) : 0;

  const coords = numeric.map((p, i) => {
    const v = clamp((p.probability ?? 0) / 100);
    return [PAD + i * step, H - PAD - v * (H - PAD * 2)] as const;
  });

  const children: SVGElement[] = [];

  // Baseline at 50%, the thing a probability is judged against. Solid, because
  // the viewBox is stretched horizontally and a dash pattern would stretch too.
  children.push(
    svg('path', {
      d: `M0 ${H / 2}H${W}`,
      stroke: 'var(--edge)',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    }),
  );

  children.push(
    svg('path', {
      d: `M${coords.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`,
      stroke,
      'stroke-width': 1.4,
      fill: 'none',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
      'vector-effect': 'non-scaling-stroke',
    }),
  );

  coords.forEach(([x, y], i) => {
    const first = i === 0;
    children.push(
      svg('circle', {
        cx: x.toFixed(1),
        cy: y.toFixed(1),
        r: first ? 2.6 : 2,
        fill: first ? 'var(--void)' : stroke,
        stroke,
        'stroke-width': 1.2,
      }),
    );
  });

  const last = points[points.length - 1];
  const tip = coords[coords.length - 1];
  if (last?.resolved && tip) {
    children.push(
      svg('path', {
        d: `M${(tip[0] + 6).toFixed(1)} ${(tip[1] - 5).toFixed(1)}v10`,
        stroke: 'var(--verdigris)',
        'stroke-width': 2,
      }),
    );
  }

  return svg(
    'svg',
    {
      viewBox: `0 0 ${W} ${H}`,
      fill: 'none',
      'aria-hidden': 'true',
      focusable: 'false',
      preserveAspectRatio: 'none',
      style: 'width:100%;height:44px;overflow:visible',
    },
    children,
  );
}
