/**
 * Text that lights up as it is read: each word starts dim and comes to full
 * strength as the block scrolls up the screen. Under reduced motion, or without
 * script, the text is simply at full strength.
 */
import { prefersReducedMotion } from './prefers';

export function initLightUp(): void {
  const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-lightup]'));
  if (!blocks.length || prefersReducedMotion()) return;
  const sets: Array<{ el: HTMLElement; words: HTMLElement[] }> = [];
  for (const el of blocks) {
    const words: HTMLElement[] = [];
    const walk = (node: Node): void => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = (child.textContent ?? '').split(/(\s+)/);
          const frag = document.createDocumentFragment();
          for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) frag.append(part);
            else {
              const w = document.createElement('span');
              w.className = 'lu';
              w.textContent = part;
              words.push(w);
              frag.append(w);
            }
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
      }
    };
    walk(el);
    el.classList.add('is-lightup');
    sets.push({ el, words });
  }
  let raf = 0;
  const paint = (): void => {
    raf = 0;
    const vh = window.innerHeight;
    for (const { el, words } of sets) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      // 0 when the block's top reaches 88% of the screen, 1 when its bottom reaches 55%.
      const p = (vh * 0.88 - r.top) / (r.height + vh * 0.33);
      const lit = Math.max(0, Math.min(1, p)) * words.length;
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }
  };
  const later = (): void => {
    if (!raf) raf = requestAnimationFrame(paint);
  };
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('resize', later);
  paint();
}
