/**
 * Colossal-inspired architectural halftone-dot orbital ring for 03 · Mission.
 * Pure deterministic algorithmic halftone dot geometry on warm alabaster paper:
 * zero blur, zero raster imagery, imperceptibly calm precision rotation.
 */
import { prefersReducedMotion } from '../lib/prefers';

export function initColossalHalo(root: ParentNode = document): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-colossal-halo]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = prefersReducedMotion();
  let W = 520;
  let H = 520;
  let dpr = 1;
  let visible = false;
  let raf = 0;
  const t0 = performance.now();

  const resize = (): void => {
    const r = canvas.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };

  const draw = (t: number): void => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5;
    const cy = H * 0.5;
    const outerR = Math.min(W, H) * 0.44;
    const step = Math.max(9.5, Math.min(W, H) / 44);
    const phase = t * 0.14;

    // Two nodal inflection centers orbiting gently along the ring (echoing Colossal's halftone torus)
    const nodeA = phase;
    const nodeB = phase + Math.PI * 0.85;

    for (let y = step * 0.5; y < H; y += step) {
      for (let x = step * 0.5; x < W; x += step) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Dual interlocked orbital tracks with harmonic thickness modulation
        const r1 = outerR * (0.82 + 0.08 * Math.sin(angle * 2 - phase));
        const r2 = outerR * (0.64 + 0.06 * Math.cos(angle * 3 + phase * 0.7));
        const d1 = Math.abs(dist - r1);
        const d2 = Math.abs(dist - r2);

        const band1 = Math.max(0, 1 - d1 / (outerR * 0.24));
        const band2 = Math.max(0, 1 - d2 / (outerR * 0.14)) * 0.65;

        // Subtle crescent opening like Colossal's signature broken halftone ring
        const gapAngle = Math.atan2(Math.sin(angle - phase * 0.5 - 2.35), Math.cos(angle - phase * 0.5 - 2.35));
        const gapFade = Math.min(1, Math.max(0.18, Math.abs(gapAngle) / 1.15));

        // Nodal swell near the two inflection points
        const angA = Math.abs(Math.atan2(Math.sin(angle - nodeA), Math.cos(angle - nodeA)));
        const angB = Math.abs(Math.atan2(Math.sin(angle - nodeB), Math.cos(angle - nodeB)));
        const nodal = Math.exp(-angA * angA * 7.5) * 0.45 + Math.exp(-angB * angB * 9.0) * 0.35;

        const density = Math.min(1, (Math.max(band1, band2) + nodal * band1) * gapFade);
        if (density < 0.14) continue;

        const dotR = density * (step * 0.41);
        const isAmberNode = nodal > 0.34 && band1 > 0.52;
        ctx.fillStyle = isAmberNode ? 'rgba(243, 146, 0, 0.46)' : 'rgba(176, 168, 152, 0.54)';
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const loop = (now: number): void => {
    if (!visible || document.hidden) {
      raf = 0;
      return;
    }
    draw((now - t0) / 1000);
    if (!reduced) raf = requestAnimationFrame(loop);
    else raf = 0;
  };

  const wake = (): void => {
    resize();
    draw(reduced ? 0.6 : (performance.now() - t0) / 1000);
    if (!reduced && !raf && visible && !document.hidden) {
      raf = requestAnimationFrame(loop);
    }
  };

  new ResizeObserver(wake).observe(canvas);
  const io = new IntersectionObserver(
    (es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { threshold: 0.05 },
  );
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) wake();
  });

  wake();
}
