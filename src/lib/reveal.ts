/**
 * Enter reveals.
 *
 * One IntersectionObserver adds `.is-in` the first time an element crosses into
 * view; CSS owns the transition. Elements marked `data-reveal-repeat` keep
 * toggling. Everything is a no-op under prefers-reduced-motion because the CSS
 * already renders the resting state.
 */

import { qsa } from './dom';
import { prefersReducedMotion } from './prefers';

let observer: IntersectionObserver | null = null;

function ensureObserver(): IntersectionObserver {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const node = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          node.classList.add('is-in');
          if (!('revealRepeat' in node.dataset)) observer?.unobserve(node);
        } else if ('revealRepeat' in node.dataset) {
          node.classList.remove('is-in');
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );
  return observer;
}

/**
 * Split a headline marked `data-lines` into masked rows. Author the breaks with
 * `<br>` so the copy stays readable in the HTML source and degrades gracefully.
 */
function buildLines(node: HTMLElement): void {
  if (node.dataset.linesBuilt === 'true') return;
  const raw = node.innerHTML.split(/<br\s*\/?>/i);
  const rows = raw.map((part) => part.trim()).filter((part) => part.length > 0);
  if (rows.length === 0) return;
  node.innerHTML = rows
    .map((row, i) => `<span class="line"><span style="--i:${i}">${row}</span></span>`)
    .join('');
  node.classList.add('lines');
  node.dataset.linesBuilt = 'true';
}

export function initReveal(root: ParentNode = document): void {
  for (const node of qsa<HTMLElement>('[data-lines]', root)) buildLines(node);

  const targets = qsa<HTMLElement>('[data-reveal], [data-stagger], .lines, .pillar, .glyph', root);
  const screens = qsa<HTMLElement>('[data-screen]', root);

  if (prefersReducedMotion()) {
    for (const node of targets) node.classList.add('is-in');
    for (const s of screens) s.classList.add('is-on');
    return;
  }

  // Screens power on once, as they enter.
  const power = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-on');
        power.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  for (const s of screens) {
    const r = s.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) s.classList.add('is-on');
    else power.observe(s);
  }

  const io = ensureObserver();
  for (const node of targets) {
    // Anything already on screen at load reveals immediately, no flash.
    const rect = node.getBoundingClientRect();
    // Anything inside the first viewport reveals immediately: the observer's
    // bottom inset would otherwise leave hero content hidden at scroll zero.
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      node.classList.add('is-in');
      continue;
    }
    io.observe(node);
  }
}

/** Drop the observer so replaced nodes are not held onto. */
export function resetReveal(): void {
  observer?.disconnect();
  observer = null;
}

/** Reveal freshly inserted content. */
export function observeReveal(nodes: HTMLElement[]): void {
  if (prefersReducedMotion()) {
    for (const node of nodes) node.classList.add('is-in');
    return;
  }
  const io = ensureObserver();
  for (const node of nodes) io.observe(node);
}
