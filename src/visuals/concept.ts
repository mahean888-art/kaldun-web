/**
 * Engine concept figures, Pramaana-stack style: one dashed geometric glyph in
 * the centre of a faintly gridded field, with the movement's working terms
 * floating around it as labelled tags. The glyph names the movement; the tags
 * name what it holds.
 */

import { dpr, prefersReducedMotion } from '../lib/prefers';
import { onFrame, onResize, type Frame } from '../lib/ticker';

export type ConceptName = 'state' | 'forward' | 'explicit' | 'learn';
export type ConceptHandle = { destroy: () => void };

const INK = '16, 16, 16';
const CRIMSON = '185, 31, 46';
const FRAME_MS = 40;

/** Tag positions, as fractions of the figure box, used in order. */
const SLOTS: Array<[number, number]> = [
  [0.13, 0.16],
  [0.74, 0.1],
  [0.06, 0.66],
  [0.78, 0.58],
  [0.32, 0.86],
  [0.64, 0.84],
];

export function initConcept(host: HTMLElement, name: ConceptName, tags: string[]): ConceptHandle {
  const canvas = host.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return { destroy: () => undefined };

  // Floating tags: plain elements, animated by CSS so the canvas stays cheap.
  const spawned: HTMLElement[] = [];
  tags.slice(0, SLOTS.length).forEach((tag, i) => {
    const slot = SLOTS[i];
    if (!slot) return;
    const el = document.createElement('span');
    el.className = 'fig-tag';
    // Right-half tags anchor from the right so a long label grows inward and
    // can never push past the figure — or widen the page on a narrow screen.
    if (slot[0] > 0.5) el.style.right = `${((1 - slot[0]) * 100).toFixed(1)}%`;
    else el.style.left = `${(slot[0] * 100).toFixed(1)}%`;
    el.style.top = `${(slot[1] * 100).toFixed(1)}%`;
    el.style.animationDelay = `${(i * 0.9).toFixed(2)}s`;
    el.textContent = tag;
    host.appendChild(el);
    spawned.push(el);
  });

  const reduced = prefersReducedMotion();
  let w = 0;
  let h = 0;

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8) return;
    const ratio = dpr(2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const dashed = (alpha = 0.55, width = 1): void => {
    ctx.strokeStyle = `rgba(${INK}, ${alpha})`;
    ctx.lineWidth = width;
    ctx.setLineDash([4, 5]);
  };

  let elapsed = 0;

  const draw = (frame: Frame): void => {
    if (w < 8) return;
    elapsed += frame.dt;
    if (!reduced && elapsed < FRAME_MS) return;
    elapsed = 0;

    const t = reduced ? 0 : frame.time;
    const spin = t * 0.00009;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.3;

    ctx.clearRect(0, 0, w, h);

    if (name === 'state') {
      // A wireframe sphere: the world, held.
      dashed(0.6);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      dashed(0.35);
      for (const k of [0.32, 0.72]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, R, R * k, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * k, R, spin * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (name === 'forward') {
      // A cone opening rightward from the present.
      const x0 = cx - R * 1.05;
      dashed(0.6);
      ctx.beginPath();
      ctx.moveTo(x0, cy);
      ctx.lineTo(cx + R, cy - R * 0.72);
      ctx.moveTo(x0, cy);
      ctx.lineTo(cx + R, cy + R * 0.72);
      ctx.stroke();
      dashed(0.3);
      for (const k of [-0.36, 0, 0.36]) {
        ctx.beginPath();
        ctx.moveTo(x0, cy);
        ctx.lineTo(cx + R, cy + R * k);
        ctx.stroke();
      }
      dashed(0.45);
      ctx.beginPath();
      ctx.ellipse(cx + R, cy, R * 0.14, R * 0.74, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (name === 'explicit') {
      // Rays with terminal weights: the futures, stated.
      const x0 = cx - R * 1.05;
      const weights = [0.3, 0.9, 0.5, 0.22, 0.62];
      weights.forEach((bw, i) => {
        const a = (i / (weights.length - 1) - 0.5) * 1.15;
        const ex = x0 + Math.cos(a) * R * 2.1;
        const ey = cy + Math.sin(a) * R * 1.35;
        dashed(0.25 + bw * 0.4);
        ctx.beginPath();
        ctx.moveTo(x0, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.setLineDash([]);
        const s = 3 + bw * 8;
        ctx.fillStyle = i === 1 ? `rgba(${CRIMSON}, 0.85)` : `rgba(${INK}, ${0.3 + bw * 0.4})`;
        ctx.fillRect(ex - s / 2, ey - s / 2, s, s);
      });
    } else {
      // The loop: forecast, resolve, learn, again.
      dashed(0.6);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 3; i++) {
        const a = spin + (i / 3) * Math.PI * 2;
        const px = cx + Math.cos(a) * R * 0.85;
        const py = cy + Math.sin(a) * R * 0.85;
        ctx.strokeStyle = `rgba(${INK}, 0.7)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(a + 2.2) * 7, py + Math.sin(a + 2.2) * 7);
        ctx.lineTo(px, py);
        ctx.lineTo(px + Math.cos(a + 0.9) * 7, py + Math.sin(a + 0.9) * 7);
        ctx.stroke();
      }
    }

    // The present, at the heart of every movement.
    ctx.setLineDash([]);
    const beat = reduced ? 1 : 0.75 + Math.sin(t * 0.0016) * 0.25;
    ctx.fillStyle = `rgba(${CRIMSON}, ${(0.6 + 0.4 * beat).toFixed(3)})`;
    const anchor = name === 'forward' || name === 'explicit' ? cx - R * 1.05 : cx;
    ctx.fillRect(anchor - 3, cy - 3, 6, 6);
  };

  resize();
  const stopResize = onResize(resize);
  let stopFrame: (() => void) | null = null;

  if (reduced) {
    draw({ dt: FRAME_MS, time: 0, scrollY: 0, velocity: 0, vh: window.innerHeight, vw: window.innerWidth });
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !stopFrame) stopFrame = onFrame(draw);
        else if (!visible && stopFrame) {
          stopFrame();
          stopFrame = null;
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);
  }

  return {
    destroy: () => {
      stopFrame?.();
      stopResize();
      for (const el of spawned) el.remove();
    },
  };
}
