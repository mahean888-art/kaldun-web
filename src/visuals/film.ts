/**
 * The film: one illustrated landscape of four worlds, in five scenes.
 *
 * As the section scrolls in, the screen opens from a narrow band to the full
 * width, then the film plays: the world, then Model, Simulate, Discover and
 * Record. The chapter bar shows where it is and jumps on click; the film loops.
 * The scenes themselves are CSS keyed on data-s (src/styles/r11.css).
 * Under reduced motion the screen is open and the last scene is shown still.
 */
import { prefersReducedMotion } from '../lib/prefers';

const SCENES: Array<[number, string]> = [
  [7000, 'An institution, and the world it depends on: its capital, contracts, counterparties, markets, and rules.'],
  [8000, 'The world, built once, and the institution inside it, built from its own records.'],
  [9000, 'Each decision is tried against past events and a thousand futures.'],
  [9000, 'It optimizes within today’s terms, then searches for terms no one has listed.'],
  [10000, 'Every answer is written down before the outcome, then scored. Each outcome makes the model more faithful.'],
];
const OPEN_AT = 0.86;

export function initFilm(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const track = root.closest<HTMLElement>('[data-film-track]');
  const cap = root.querySelector<HTMLElement>('[data-cap]');
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-go]'));
  const play = root.querySelector<HTMLButtonElement>('[data-play]');
  const desktop = window.matchMedia('(min-width: 1024px) and (min-height: 700px)');

  let s = 1;
  let timer = 0;
  let started = false;
  let paused = false;
  let t0 = 0;
  let raf = 0;

  const setScene = (n: number): void => {
    s = n;
    root.dataset['s'] = String(n);
    if (cap) {
      cap.classList.remove('is-in');
      void cap.offsetWidth;
      cap.textContent = SCENES[n - 1]![1];
      cap.classList.add('is-in');
    }
    chips.forEach((c, k) => {
      c.classList.toggle('is-on', k + 1 === n);
      c.classList.toggle('is-done', k + 1 < n);
      c.setAttribute('aria-current', k + 1 === n ? 'step' : 'false');
    });
  };

  const tick = (): void => {
    const b = chips[s - 1]?.querySelector<HTMLElement>('b');
    if (b) b.style.width = `${Math.min(100, ((performance.now() - t0) / SCENES[s - 1]![0]) * 100)}%`;
    raf = requestAnimationFrame(tick);
  };

  const schedule = (): void => {
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
    chips.forEach((c, k) => {
      const b = c.querySelector<HTMLElement>('b');
      if (b) b.style.width = k + 1 < s ? '100%' : '0%';
    });
    if (paused) return;
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
    timer = window.setTimeout(() => {
      const n = s === SCENES.length ? 1 : s + 1;
      setScene(n);
      schedule();
    }, SCENES[s - 1]![0]);
  };

  const start = (): void => {
    if (started) return;
    started = true;
    root.classList.add('is-playing');
    setScene(1);
    schedule();
  };

  chips.forEach((c, k) =>
    c.addEventListener('click', () => {
      started = true;
      root.classList.add('is-playing');
      setScene(k + 1);
      schedule();
    }),
  );
  play?.addEventListener('click', () => {
    paused = !paused;
    play.textContent = paused ? 'Play' : 'Pause';
    play.setAttribute('aria-label', paused ? 'Play the film' : 'Pause the film');
    root.classList.toggle('is-paused', paused);
    if (!paused) started = true;
    schedule();
  });

  if (reduced) {
    root.style.setProperty('--p', '1');
    root.classList.add('is-still');
    setScene(5);
    paused = true;
    if (play) play.hidden = true;
    return;
  }

  // The screen opens with the scroll, then the film starts.
  const onScroll = (): void => {
    if (!track || !desktop.matches) {
      root.style.setProperty('--p', '1');
      return;
    }
    const r = track.getBoundingClientRect();
    const run = Math.max(1, track.offsetHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, -r.top / (run * 0.6)));
    root.style.setProperty('--p', p.toFixed(4));
    if (p >= OPEN_AT) start();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Phones and short screens: play when the film is in view.
  const io = new IntersectionObserver(
    (es) => {
      if (!desktop.matches && es.some((e) => e.isIntersecting)) start();
    },
    { threshold: 0.5 },
  );
  io.observe(root);

  // Stop the clock when the film leaves the screen; pick up where it was.
  const vis = new IntersectionObserver((es) => {
    if (!started || paused) return;
    if (es.some((e) => e.isIntersecting)) schedule();
    else {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    }
  });
  vis.observe(root);
}
