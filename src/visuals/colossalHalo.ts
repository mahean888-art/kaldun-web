/**
 * Colossal-inspired architectural halftone-dot orbital ring for 03 · Mission.
 * Pure monochrome warm-stone halftone geometry on alabaster paper:
 * zero stray accent blobs, zero blur, calm orbital drift.
 */
import { prefersReducedMotion } from '../lib/prefers';

export function initColossalHalo(root: ParentNode = document): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-colossal-halo]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = prefersReducedMotion();
  let W = 500;
  let H = 500;
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
    const step = Math.max(8.5, Math.min(W, H) / 48);
    const phase = t * 0.09;

    for (let y = step * 0.5; y < H; y += step) {
      for (let x = step * 0.5; x < W; x += step) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Smooth architectural torus ring with gentle thickness swell
        const ringR = outerR * (0.76 + 0.045 * Math.sin(angle * 2 - phase));
        const halfWidth = outerR * (0.21 + 0.05 * Math.cos(angle - phase * 0.6));
        const radial = Math.max(0, 1 - Math.abs(dist - ringR) / halfWidth);
        if (radial <= 0) continue;

        // Clean broken-ring aperture on the lower-right, echoing Colossal's halftone ring
        const gapAngle = Math.atan2(
          Math.sin(angle - phase * 0.35 - 0.55),
          Math.cos(angle - phase * 0.35 - 0.55),
        );
        const gapFade = Math.min(1, Math.max(0.08, (Math.abs(gapAngle) - 0.18) / 0.85));

        const density = Math.pow(radial, 1.15) * gapFade;
        if (density < 0.12) continue;

        const dotR = density * (step * 0.40);
        // Pure monochrome warm architectural stone (never muddies headline ink)
        const alpha = (0.14 + density * 0.36).toFixed(3);
        ctx.fillStyle = `rgba(154, 146, 132, ${alpha})`;
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
    draw(reduced ? 0.5 : (performance.now() - t0) / 1000);
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
