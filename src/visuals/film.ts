/**
 * How it works: four steps beside four plates. The steps stay on screen; a
 * plate changes only when its step is chosen (click, or arrow keys in the
 * tab list). As the section scrolls in, the frame opens from a narrow band to
 * full width; the first plate then draws itself in. Each plate draws again
 * whenever it is chosen. Under reduced motion everything is shown at once.
 */
import { prefersReducedMotion } from '../lib/prefers';

const OPEN_AT = 0.86;

export function initFilm(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const track = root.closest<HTMLElement>('[data-film-track]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-go]'));
  const plates = Array.from(root.querySelectorAll<HTMLElement>('[data-pl]'));
  const desktop = window.matchMedia('(min-width: 1024px) and (min-height: 700px)');

  const show = (n: number, focus = false): void => {
    tabs.forEach((t, k) => {
      const on = k + 1 === n;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    plates.forEach((p, k) => {
      const on = k + 1 === n;
      p.classList.toggle('is-on', on);
      if (on) p.removeAttribute('aria-hidden');
      else p.setAttribute('aria-hidden', 'true');
    });
  };

  tabs.forEach((t, k) => {
    t.addEventListener('click', () => show(k + 1));
    t.addEventListener('keydown', (e) => {
      const i = k + 1;
      let n = 0;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i % tabs.length) + 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = ((i + tabs.length - 2) % tabs.length) + 1;
      else if (e.key === 'Home') n = 1;
      else if (e.key === 'End') n = tabs.length;
      if (!n) return;
      e.preventDefault();
      show(n, true);
    });
  });
  show(1);

  if (reduced) {
    root.style.setProperty('--p', '1');
    root.classList.add('is-still', 'is-open');
    return;
  }

  // The frame opens with the scroll, eased toward where the scroll is.
  let target = 0;
  let shown = -1;
  let frame = 0;
  const paint = (): void => {
    frame = 0;
    shown = shown < 0 ? target : shown + (target - shown) * 0.22;
    if (Math.abs(target - shown) < 0.002) shown = target;
    root.style.setProperty('--p', shown.toFixed(4));
    if (shown >= OPEN_AT) root.classList.add('is-open');
    if (shown !== target) frame = requestAnimationFrame(paint);
  };
  const onScroll = (): void => {
    if (!track || !desktop.matches) {
      target = 1;
    } else {
      const r = track.getBoundingClientRect();
      const run = Math.max(1, track.offsetHeight - window.innerHeight);
      target = Math.min(1, Math.max(0, -r.top / (run * 0.6)));
    }
    if (!frame) frame = requestAnimationFrame(paint);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Phones and short screens: open when the plates are in view.
  const io = new IntersectionObserver(
    (es) => {
      if (!desktop.matches && es.some((e) => e.isIntersecting)) root.classList.add('is-open');
    },
    { threshold: 0.35 },
  );
  io.observe(root);
}
