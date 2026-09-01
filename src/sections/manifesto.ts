/**
 * The Signal Window: the manifesto advances one proposition at a time inside
 * a framed observation field, and each completed paragraph leaves behind a
 * small piece of the machine's material language — a state chip docked along
 * the frame's lower edge.
 *
 * Native scroll only. The window is position: sticky inside a tall wrapper;
 * this module reads scroll progress (rAF-throttled), sets the active
 * paragraph, and keeps the dock in step. Transforms and opacity only — no
 * layout work per frame, no scroll hijacking. Under reduced motion, or
 * without JS, the paragraphs simply stand stacked inside the frame.
 */

import { el, qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/prefers';

export type ManifestoHandle = { destroy: () => void };

export function initManifesto(host: HTMLElement): ManifestoHandle {
  const stage = host.querySelector<HTMLElement>('[data-signal-stage]');
  const dock = host.querySelector<HTMLElement>('[data-signal-dock]');
  const stateMark = host.querySelector<HTMLElement>('[data-signal-state]');
  const paras = qsa<HTMLElement>('.signal__para', host);
  if (!stage || !dock || paras.length === 0) return { destroy: () => undefined };

  if (prefersReducedMotion()) {
    host.classList.add('is-static');
    return { destroy: () => undefined };
  }

  host.classList.add('is-live');

  // The wrapper's height provides the scroll runway: one beat per paragraph,
  // plus a settling beat at the end.
  const steps = paras.length;
  host.style.setProperty('--signal-steps', String(steps + 1));

  const chips = paras.map((p) => {
    const chip = el('span', { class: 'signal__chip' }, [p.dataset['chip'] ?? '']);
    dock.append(chip);
    return chip;
  });

  let active = -1;
  const setActive = (next: number): void => {
    if (next === active) return;
    active = next;
    paras.forEach((p, i) => {
      p.classList.toggle('is-fore', i === next);
      p.classList.toggle('is-done', i < next);
    });
    chips.forEach((c, i) => c.classList.toggle('is-set', i < next || (next === steps - 1 && i === next)));
    // The final paragraph sets its own chip and completes the state.
    if (next >= steps - 1) {
      chips[steps - 1]?.classList.add('is-set');
      stateMark?.replaceChildren('State: committed');
      host.classList.add('is-complete');
    } else {
      stateMark?.replaceChildren('State: incomplete');
      host.classList.remove('is-complete');
    }
  };

  let ticking = false;
  const read = (): void => {
    ticking = false;
    const rect = host.getBoundingClientRect();
    const runway = rect.height - window.innerHeight;
    if (runway <= 0) {
      setActive(0);
      return;
    }
    const t = Math.min(1, Math.max(0, -rect.top / runway));
    setActive(Math.min(steps - 1, Math.floor(t * steps)));
  };

  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(read);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  read();

  return {
    destroy: () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    },
  };
}
