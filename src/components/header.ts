/**
 * Header behaviour: condense on scroll, reading-progress ruling, mobile drawer.
 * The markup lives in each HTML document, so navigation works without JS.
 */

import { qs, qsa } from '../lib/dom';
import { clamp } from '../lib/math';
import { onFrame, type Frame } from '../lib/ticker';

export function initHeader(): void {
  const header = qs<HTMLElement>('[data-header]');
  if (!header) return;

  const toggle = qs<HTMLButtonElement>('[data-drawer-toggle]');
  const drawer = qs<HTMLElement>('[data-drawer]');

  let open = false;

  const setDrawer = (next: boolean): void => {
    open = next;
    drawer?.classList.toggle('is-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  };

  toggle?.addEventListener('click', () => setDrawer(!open));

  for (const link of qsa<HTMLAnchorElement>('a', drawer ?? undefined)) {
    link.addEventListener('click', () => setDrawer(false));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      setDrawer(false);
      toggle?.focus();
    }
  });

  // Close the drawer if the viewport grows into the desktop nav.
  const desktop = window.matchMedia('(min-width: 1000px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches && open) setDrawer(false);
  });

  let stuck = false;
  let lastRead = -1;

  onFrame((frame: Frame) => {
    const nextStuck = frame.scrollY > 12;
    if (nextStuck !== stuck) {
      stuck = nextStuck;
      header.classList.toggle('is-stuck', stuck);
    }

    const doc = document.documentElement;
    const span = Math.max(doc.scrollHeight - frame.vh, 1);
    const read = Math.round(clamp(frame.scrollY / span) * 500) / 500;
    if (read !== lastRead) {
      lastRead = read;
      header.style.setProperty('--read', String(read));
    }
  });
}
