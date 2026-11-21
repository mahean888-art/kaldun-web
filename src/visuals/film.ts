/**
 * The Obsidian Instrument Chamber: four plates showing how a Foresight Machine
 * reaches an answer (Model, Simulate, Intervene, Record).
 *
 * Plays automatically when in view, pauses when off-screen, and responds
 * immediately when any step in the rail or Play/Pause is clicked. Under reduced
 * motion, auto-advance is disabled while manual step inspection stays active.
 */
import { prefersReducedMotion } from '../lib/prefers';

type StepMeta = {
  duration: number;
  plate: string;
  specKey: string;
  specVal: string;
};

const STEPS: StepMeta[] = [
  {
    duration: 6500,
    plate: 'PLATE 01 / 04 · MODEL',
    specKey: 'State space',
    specVal: 'Capital, contracts, counterparties, rails, and rules',
  },
  {
    duration: 6500,
    plate: 'PLATE 02 / 04 · SIMULATE',
    specKey: 'Adversary',
    specVal: 'Past crises and the minimal shock that breaks par',
  },
  {
    duration: 6500,
    plate: 'PLATE 03 / 04 · INTERVENE',
    specKey: 'Search space',
    specVal: 'Allocation, contract terms, and execution sequence',
  },
  {
    duration: 6500,
    plate: 'PLATE 04 / 04 · RECORD',
    specKey: 'Attestation',
    specVal: 'Pre-outcome hash recorded, scored after the event',
  },
];

export function initFilm(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-go]'));
  const plates = Array.from(root.querySelectorAll<HTMLImageElement>('[data-plate]'));
  const plateLabel = root.querySelector<HTMLElement>('[data-film-plate]');
  const stateLabel = root.querySelector<HTMLElement>('[data-film-state] span');
  const specKey = root.querySelector<HTMLElement>('[data-film-sk]');
  const specVal = root.querySelector<HTMLElement>('[data-film-sv]');
  const play = root.querySelector<HTMLButtonElement>('[data-play]');

  let current = 1;
  let timer = 0;
  let raf = 0;
  let t0 = 0;
  let paused = reduced;
  let inView = false;

  const syncPlayUI = (): void => {
    const pt = play?.querySelector<HTMLElement>('[data-play-t]');
    if (pt) pt.textContent = paused ? 'Play' : 'Pause';
    play?.setAttribute('aria-label', paused ? 'Play the sequence' : 'Pause the sequence');
    if (stateLabel) stateLabel.textContent = paused ? 'Paused' : 'Active';
    root.classList.toggle('is-paused', paused);
  };

  const setStep = (n: number): void => {
    current = n;
    root.dataset['s'] = String(n);
    const meta = STEPS[n - 1]!;
    if (plateLabel) plateLabel.textContent = meta.plate;
    if (specKey) specKey.textContent = meta.specKey;
    if (specVal) specVal.textContent = meta.specVal;
    plates.forEach((img) => {
      img.classList.toggle('is-on', Number(img.dataset['plate']) === n);
    });
    chips.forEach((btn, i) => {
      const idx = i + 1;
      btn.classList.toggle('is-on', idx === n);
      btn.classList.toggle('is-done', idx < n);
      btn.setAttribute('aria-current', idx === n ? 'step' : 'false');
      const bar = btn.querySelector<HTMLElement>('b');
      if (bar) bar.style.height = idx < n ? '100%' : idx === n && paused ? '100%' : '0%';
    });
  };

  const stopClock = (): void => {
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
  };

  const tick = (): void => {
    const bar = chips[current - 1]?.querySelector<HTMLElement>('b');
    const dur = STEPS[current - 1]!.duration;
    if (bar) {
      const pct = Math.min(100, ((performance.now() - t0) / dur) * 100);
      bar.style.height = `${pct}%`;
    }
    raf = requestAnimationFrame(tick);
  };

  const schedule = (): void => {
    stopClock();
    if (paused || !inView) return;
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
    timer = window.setTimeout(() => {
      setStep(current === STEPS.length ? 1 : current + 1);
      schedule();
    }, STEPS[current - 1]!.duration);
  };

  chips.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      setStep(i + 1);
      schedule();
    });
  });

  play?.addEventListener('click', () => {
    paused = !paused;
    syncPlayUI();
    setStep(current);
    schedule();
  });

  setStep(1);
  syncPlayUI();
  root.classList.add('is-open', 'is-playing');

  if (reduced) {
    root.classList.add('is-still');
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView) schedule();
      else stopClock();
    },
    { threshold: 0.25 },
  );
  io.observe(root);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopClock();
    else if (inView) schedule();
  });
}
