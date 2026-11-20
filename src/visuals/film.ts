/**
 * The film: one illustrated landscape of the worlds we model, in five scenes.
 *
 * As the section scrolls in, the screen opens from a narrow band to the full
 * width, then the film plays in the site's four steps: Model (opening on the
 * world, then the institution inside it), Simulate, Discover and Record. The
 * step rail beside it names each step, fills a line beside the one playing, and
 * jumps on click; the film loops.
 * The scenes themselves are CSS keyed on data-s (src/styles/r11.css).
 * Under reduced motion the screen is open and the last scene is shown still.
 */
import { prefersReducedMotion } from '../lib/prefers';

const MODEL = 'The institution, and the world it depends on: its capital, contracts, counterparties, markets and rules.';
// Scenes: [duration, caption, step]. The world and the institution are both step 01, Model.
const SCENES: Array<[number, string, number]> = [
  [6000, MODEL, 1],
  [7000, MODEL, 1],
  [9000, 'Each decision is stress-tested against past crises and the smallest shock that breaks it.', 2],
  [9000, 'It finds the change that holds: a new allocation, new terms, a new sequence.', 3],
  [9000, 'The answer and its evidence, recorded before the outcome.', 4],
];
const FIRST = [1, 3, 4, 5]; // the first scene of each step
const step = (n: number): number => SCENES[n - 1]![2];
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
    if (cap && cap.textContent !== SCENES[n - 1]![1]) {
      cap.classList.remove('is-in');
      void cap.offsetWidth;
      cap.textContent = SCENES[n - 1]![1];
      cap.classList.add('is-in');
    }
    const st = step(n);
    chips.forEach((c, k) => {
      c.classList.toggle('is-on', k + 1 === st);
      c.classList.toggle('is-done', k + 1 < st);
      c.setAttribute('aria-current', k + 1 === st ? 'step' : 'false');
    });
  };

  const tick = (): void => {
    // A step's bar fills across all of its scenes.
    const st = step(s);
    const b = chips[st - 1]?.querySelector<HTMLElement>('b');
    if (b) {
      const span = SCENES.filter((x) => x[2] === st);
      const total = span.reduce((a, x) => a + x[0], 0);
      const before = SCENES.slice(FIRST[st - 1]! - 1, s - 1).reduce((a, x) => a + x[0], 0);
      b.style.height = `${Math.min(100, ((before + performance.now() - t0) / total) * 100)}%`;
    }
    raf = requestAnimationFrame(tick);
  };

  const schedule = (): void => {
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
    chips.forEach((c, k) => {
      const b = c.querySelector<HTMLElement>('b');
      if (b) b.style.height = k + 1 < step(s) ? '100%' : '0%';
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
      setScene(FIRST[k]!);
      schedule();
    }),
  );
  play?.addEventListener('click', () => {
    paused = !paused;
    const pt = play.querySelector<HTMLElement>('[data-play-t]');
    if (pt) pt.textContent = paused ? 'Play' : 'Pause';
    play.setAttribute('aria-label', paused ? 'Play the film' : 'Pause the film');
    root.classList.toggle('is-paused', paused);
    if (!paused) started = true;
    schedule();
  });

  if (reduced) {
    root.style.setProperty('--p', '1');
    root.classList.add('is-still', 'is-open', 'is-playing');
    setScene(5);
    paused = true;
    if (play) play.hidden = true;
    return;
  }

  // The screen opens with the scroll, eased toward where the scroll is, then the film starts.
  let target = 0;
  let shown = -1;
  let frame = 0;
  const paint = (): void => {
    frame = 0;
    shown = shown < 0 ? target : shown + (target - shown) * 0.22;
    if (Math.abs(target - shown) < 0.002) shown = target;
    root.style.setProperty('--p', shown.toFixed(4));
    const open = shown >= OPEN_AT;
    root.classList.toggle('is-open', open);
    if (open) start();
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
