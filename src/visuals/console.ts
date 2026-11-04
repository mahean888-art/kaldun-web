/**
 * Where we start: the machine doing the work, in four steps.
 *
 *   Model       214 records become one model; every value shows its source,
 *               and the one estimate is admitted.
 *   Replay      a real week, hour by hour, then 78 weeks under today's policy.
 *   Look ahead  the year ahead under four conditions, 1,000 futures each.
 *   Propose     the policy rewritten as a diff, tested against all of the
 *               above, and handed to the reserve committee.
 *
 * It plays once, about seven seconds a step, when the window comes into view.
 * Choosing a step jumps there and pauses. The only motion is in each step's
 * own content (cards slide in, squares fill, the diff strikes and rewrites);
 * under reduced motion every step shows its final state.
 */

import { prefersReducedMotion } from '../lib/prefers';

const HOLD = 7000;

export function initPlayer(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('.pl__step'));
  const views = Array.from(root.querySelectorAll<HTMLElement>('.pl__view'));
  const play = root.querySelector<HTMLButtonElement>('[data-play]');
  const track = root.querySelector<HTMLElement>('[data-track]');
  const n = views.length;
  let step = 0;
  let playing = false;
  let t0 = 0;
  let raf = 0;
  let ended = false;

  const show = (i: number): void => {
    step = i;
    buttons.forEach((b, k) => {
      b.classList.toggle('is-on', k === i);
      b.classList.toggle('is-done', k < i);
      b.setAttribute('aria-current', k === i ? 'step' : 'false');
    });
    views.forEach((v, k) => {
      v.hidden = k !== i;
      v.classList.remove('is-in');
    });
    // Restart this step's own motion.
    void views[i]?.offsetWidth;
    views[i]?.classList.add('is-in');
    root.dataset['step'] = views[i]?.dataset['view'] ?? '';
  };

  const setPlaying = (on: boolean): void => {
    playing = on;
    play?.classList.toggle('is-paused', !on);
    play?.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (on && !raf) {
      t0 = performance.now() - (track ? (parseFloat(track.style.width || '0') / 100) * n * HOLD - step * HOLD : 0);
      raf = requestAnimationFrame(tick);
    }
  };

  const tick = (now: number): void => {
    raf = 0;
    if (!playing) return;
    const t = now - t0;
    const k = Math.min(n - 1, Math.floor(t / HOLD));
    if (k !== step) show(k);
    if (track) track.style.width = `${Math.min(100, (t / (HOLD * n)) * 100).toFixed(2)}%`;
    if (t >= HOLD * n) {
      ended = true;
      setPlaying(false);
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  buttons.forEach((b, i) =>
    b.addEventListener('click', () => {
      setPlaying(false);
      show(i);
      if (track) track.style.width = `${(((i + 1) / n) * 100).toFixed(2)}%`;
    }),
  );
  play?.addEventListener('click', () => {
    if (playing) return setPlaying(false);
    if (ended || step === n - 1) {
      ended = false;
      show(0);
      if (track) track.style.width = '0%';
    }
    setPlaying(true);
  });

  show(0);
  if (reduced) {
    root.classList.add('is-still');
    play?.classList.add('is-paused');
    if (track) track.style.width = '25%';
    return;
  }
  play?.classList.add('is-paused');
  const io = new IntersectionObserver(
    (e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      if (!ended && step === 0) setPlaying(true);
    },
    { threshold: 0.4 },
  );
  io.observe(root);
}
