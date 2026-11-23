/**
 * How it works: four steps above one pinned stage. On desktop the stage stays
 * on screen while the section scrolls; the scroll position picks the step, and
 * a click on a step scrolls to it. The stage is drawn at 1200 × 600 and scaled
 * to the width and height available. On phones the steps simply stack.
 */
import { prefersReducedMotion } from '../lib/prefers';

const W = 1200;
const H = 600;

export function initHow(root: HTMLElement): void {
  const pin = root.querySelector<HTMLElement>('.hx__pin');
  const fitBox = root.querySelector<HTMLElement>('.hx__fit');
  const stage = root.querySelector<HTMLElement>('.hx__stage');
  const rail = root.querySelector<HTMLElement>('.hx__rail');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hx-go]'));
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-hx]'));
  if (!pin || !fitBox || !stage || !rail || !slides.length) return;
  const reduced = prefersReducedMotion();
  const desktop = window.matchMedia('(min-width: 1024px) and (min-height: 640px)');

  let cur = 1;
  const show = (n: number): void => {
    if (n === cur) return;
    cur = n;
    tabs.forEach((t, k) => {
      const on = k + 1 === n;
      t.classList.toggle('is-on', on);
      if (on) t.setAttribute('aria-current', 'step');
      else t.removeAttribute('aria-current');
    });
    slides.forEach((s, k) => s.classList.toggle('is-on', k + 1 === n));
  };

  const pinTop = (): number => parseFloat(getComputedStyle(pin).top) || 0;

  const fit = (): void => {
    if (!desktop.matches) {
      stage.style.transform = '';
      stage.style.left = '';
      fitBox.style.height = '';
      return;
    }
    const availH = window.innerHeight - pinTop() - rail.offsetHeight - 18 - 24;
    const k = Math.min(fitBox.clientWidth / W, availH / H);
    stage.style.transform = `scale(${k})`;
    stage.style.left = `${Math.max(0, (fitBox.clientWidth - W * k) / 2)}px`;
    fitBox.style.height = `${H * k}px`;
  };

  const range = (): [number, number] => {
    const top = root.getBoundingClientRect().top + window.scrollY;
    return [top, Math.max(1, root.offsetHeight - pin.offsetHeight)];
  };

  let raf = 0;
  const onScroll = (): void => {
    raf = 0;
    if (!desktop.matches) return;
    const [top, run] = range();
    const p = Math.min(0.999, Math.max(0, (window.scrollY + pinTop() - top) / run));
    show(Math.floor(p * slides.length) + 1);
  };
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(onScroll);
  }, { passive: true });

  tabs.forEach((t, k) =>
    t.addEventListener('click', () => {
      if (!desktop.matches) return show(k + 1);
      const [top, run] = range();
      window.scrollTo({ top: top - pinTop() + run * ((k + 0.5) / slides.length), behavior: reduced ? 'auto' : 'smooth' });
    }),
  );

  const all = (): void => {
    fit();
    onScroll();
  };
  window.addEventListener('resize', all);
  document.fonts?.ready.then(all);
  all();
}
