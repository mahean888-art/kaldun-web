/**
 * Scroll-linked progress.
 *
 * Any element carrying `data-scroll` gets a `--p` custom property between 0 and
 * 1 describing how far it has travelled through the viewport. CSS then does the
 * animating, so the main thread only writes one property per element per frame.
 *
 *   data-scroll="cover"   0 when the element's top hits the bottom of the
 *                         viewport, 1 when its bottom leaves the top.
 *   data-scroll="enter"   0 when the top enters, 1 when the top reaches 35% vh.
 *   data-scroll="pin"     progress through a tall pinned band (default).
 *
 * Elements are only tracked while near the viewport, so a long page stays cheap.
 */

import { clamp } from './math';
import { onFrame, onResize, type Frame } from './ticker';

type Mode = 'cover' | 'enter' | 'pin';

type Tracked = {
  node: HTMLElement;
  mode: Mode;
  top: number;
  height: number;
  last: number;
  active: boolean;
  onProgress?: ((p: number) => void) | undefined;
};

const tracked: Tracked[] = [];
let measured = false;

function measure(): void {
  const docTop = window.scrollY || document.documentElement.scrollTop || 0;
  for (const item of tracked) {
    const rect = item.node.getBoundingClientRect();
    item.top = rect.top + docTop;
    item.height = rect.height;
  }
  measured = true;
}

function progressFor(item: Tracked, f: Frame): number {
  const { top, height, mode } = item;
  const y = f.scrollY;
  if (mode === 'enter') {
    const start = top - f.vh;
    const end = top - f.vh * 0.35;
    return clamp((y - start) / Math.max(end - start, 1));
  }
  if (mode === 'pin') {
    const span = Math.max(height - f.vh, 1);
    return clamp((y - top) / span);
  }
  // cover
  const start = top - f.vh;
  const end = top + height;
  return clamp((y - start) / Math.max(end - start, 1));
}

function tick(f: Frame): void {
  if (!measured) measure();
  for (const item of tracked) {
    const viewTop = item.top - f.scrollY;
    const near = viewTop < f.vh * 1.6 && viewTop + item.height > -f.vh * 0.6;
    if (!near) {
      if (item.active) item.active = false;
      continue;
    }
    item.active = true;
    const p = progressFor(item, f);
    // Two decimals is below perceptual threshold and avoids redundant writes.
    const rounded = Math.round(p * 200) / 200;
    if (rounded !== item.last) {
      item.last = rounded;
      item.node.style.setProperty('--p', String(rounded));
      item.onProgress?.(p);
    }
  }
}

/** Track one element manually (used by components that need the number in JS). */
export function trackScroll(
  node: HTMLElement,
  mode: Mode = 'cover',
  onProgress?: (p: number) => void,
): void {
  tracked.push({ node, mode, top: 0, height: 0, last: -1, active: false, onProgress });
  measured = false;
}

/** Wire up every `[data-scroll]` element on the page. */
export function initScrollLink(root: ParentNode = document): void {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-scroll]'));
  const valid: Mode[] = ['cover', 'enter', 'pin'];
  for (const node of nodes) {
    const declared = node.dataset.scroll as Mode | undefined;
    const mode = declared && valid.includes(declared) ? declared : 'cover';
    trackScroll(node, mode);
  }
  if (tracked.length === 0) return;

  onFrame(tick);
  onResize(() => {
    measured = false;
  });

  // Late layout shifts (fonts, images) invalidate cached offsets.
  if (document.fonts) {
    void document.fonts.ready.then(() => {
      measured = false;
    });
  }
  window.addEventListener('load', () => {
    measured = false;
  });
}

/** Invalidate cached offsets — call after inserting or resizing content. */
export function invalidateScrollLink(): void {
  measured = false;
}
