/**
 * Where we start: the decision workspace.
 *
 * A treasury team asks a question; the machine works through four steps in
 * the open (Model, Replay, Look ahead, Discover) and the answer builds beside
 * the work. The Model tab shows the model itself, with recent changes in the
 * answer column.
 *
 * Decision 1 plays once, about fifteen seconds, when the window is 40% in view.
 * Only the running (or chosen) step is expanded; finished steps collapse to
 * their heading. Any click on a step, decision or tab stops the run and shows
 * the finished state. Decisions 2–4 open finished, like saved work. Under
 * reduced motion decision 1 is shown finished at once.
 */

import { prefersReducedMotion } from '../lib/prefers';

type Timer = ReturnType<typeof setTimeout>;

// When each step of decision 1 starts and finishes, in milliseconds.
const RUN: Array<[number, number]> = [[400, 3400], [3800, 6800], [7200, 10600], [11000, 14400]];
const ANSWER_AT = 14600;

export function initWorkspace(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const decs = Array.from(root.querySelectorAll<HTMLButtonElement>('.ws-dec'));
  const pick = root.querySelector<HTMLSelectElement>('[data-pick]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.ws-tabs [role="tab"]'));
  const centers = Array.from(root.querySelectorAll<HTMLElement>('.ws-d'));
  const answers = Array.from(root.querySelectorAll<HTMLElement>('.ws-a[data-a]'));
  const modelView = root.querySelector<HTMLElement>('[data-model-view]');
  const modelAside = root.querySelector<HTMLElement>('[data-a-model]');
  const first = decs[0]?.dataset['dec'] ?? '';
  const firstStatus = decs[0]?.querySelector<HTMLElement>('[data-status]');
  const statusText = firstStatus?.textContent ?? '';
  let current = first;
  let tab: 'decision' | 'model' = 'decision';
  let timers: Timer[] = [];
  let running = false;
  let played = false;

  const stepsOf = (id: string): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(`.ws-d[data-d="${id}"] .ws-step`));

  /** Expand one step; collapse the rest to their heading. */
  const expand = (id: string, i: number): void => {
    stepsOf(id).forEach((s, k) => {
      const on = k === i;
      s.classList.toggle('is-open', on);
      s.querySelector('.ws-step__head')?.setAttribute('aria-expanded', String(on));
    });
  };

  /** The step to show expanded when a decision opens finished: the last done, or the running one. */
  const defaultStep = (id: string): number => {
    const st = stepsOf(id);
    const run = st.findIndex((s) => s.dataset['state'] === 'running');
    if (run >= 0) return Math.max(0, run - 1);
    return st.length - 1;
  };

  const finish = (): void => {
    timers.forEach(clearTimeout);
    timers = [];
    running = false;
    stepsOf(first).forEach((s) => (s.dataset['state'] = 'done'));
    const a = root.querySelector<HTMLElement>(`.ws-a[data-a="${first}"]`);
    a?.querySelector<HTMLElement>('[data-run]')?.setAttribute('hidden', '');
    a?.querySelector<HTMLElement>('[data-final]')?.removeAttribute('hidden');
    a?.classList.remove('is-running');
    if (firstStatus) firstStatus.textContent = statusText;
    root.classList.remove('is-running');
  };

  const open = (id: string, step?: number): void => {
    current = id;
    decs.forEach((d) => {
      const on = d.dataset['dec'] === id;
      d.classList.toggle('is-on', on);
      d.setAttribute('aria-pressed', String(on));
    });
    if (pick) pick.value = id;
    centers.forEach((c) => (c.hidden = tab !== 'decision' || c.dataset['d'] !== id));
    answers.forEach((a) => (a.hidden = tab !== 'decision' || a.dataset['a'] !== id));
    if (modelView) modelView.hidden = tab !== 'model';
    if (modelAside) modelAside.hidden = tab !== 'model';
    expand(id, step ?? defaultStep(id));
  };

  const interrupt = (): void => {
    if (running || !played) finish();
    played = true;
  };

  /** Decision 1, once: steps run in order, the answer builds beside them. */
  const play = (): void => {
    if (played) return;
    played = true;
    running = true;
    root.classList.add('is-running');
    const steps = stepsOf(first);
    const a = root.querySelector<HTMLElement>(`.ws-a[data-a="${first}"]`)!;
    const run = a.querySelector<HTMLElement>('[data-run]');
    const final = a.querySelector<HTMLElement>('[data-final]');
    const bar = a.querySelector<HTMLElement>('[data-bar]');
    const so = a.querySelector<HTMLElement>('[data-so]');
    const lines = (root.dataset['progress'] ? JSON.parse(root.dataset['progress']) : []) as string[];
    steps.forEach((s) => (s.dataset['state'] = 'waiting'));
    expand(first, -1);
    run?.removeAttribute('hidden');
    final?.setAttribute('hidden', '');
    a.classList.add('is-running');
    if (bar) bar.style.width = '0%';
    if (so) so.textContent = lines[0] ?? '';
    if (firstStatus) firstStatus.textContent = 'Running';
    const at = (ms: number, f: () => void): void => {
      timers.push(setTimeout(f, ms));
    };
    RUN.forEach(([start, end], i) => {
      at(start, () => {
        steps[i]!.dataset['state'] = 'running';
        expand(first, i);
      });
      at(end, () => {
        steps[i]!.dataset['state'] = 'done';
        if (bar) bar.style.width = `${(i + 1) * 25}%`;
        if (so && lines[i + 1]) so.textContent = lines[i + 1]!;
      });
    });
    at(ANSWER_AT, () => {
      a.classList.add('is-fading');
      finish();
      timers.push(setTimeout(() => a.classList.remove('is-fading'), 450));
    });
  };

  // --- input --------------------------------------------------------------------------
  decs.forEach((d) =>
    d.addEventListener('click', () => {
      interrupt();
      if (tab !== 'decision') setTab('decision');
      open(d.dataset['dec']!);
    }),
  );
  pick?.addEventListener('change', () => {
    interrupt();
    if (tab !== 'decision') setTab('decision');
    open(pick.value);
  });
  root.querySelectorAll<HTMLElement>('.ws-d').forEach((c) => {
    c.querySelectorAll<HTMLButtonElement>('.ws-step__head').forEach((h, i) =>
      h.addEventListener('click', () => {
        interrupt();
        expand(c.dataset['d']!, i);
      }),
    );
  });
  const setTab = (t: 'decision' | 'model'): void => {
    tab = t;
    tabs.forEach((b) => {
      const on = b.dataset['tab'] === t;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    root.querySelector('#ws-center-panel')?.setAttribute('aria-labelledby', t === 'model' ? 'ws-t-model' : 'ws-t-dec');
    open(current);
  };
  tabs.forEach((b) =>
    b.addEventListener('click', () => {
      interrupt();
      setTab(b.dataset['tab'] as 'decision' | 'model');
    }),
  );
  root.querySelector('.ws-tabs')?.addEventListener('keydown', (ev) => {
    const k = (ev as KeyboardEvent).key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight') return;
    const i = tabs.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const n = tabs[(i + 1) % tabs.length]!;
    n.focus();
    n.click();
    ev.preventDefault();
  });

  open(first);
  if (reduced) {
    played = true;
    return;
  }
  // Show the waiting state until the run begins, so the first sight is the work starting.
  const steps = stepsOf(first);
  steps.forEach((s) => (s.dataset['state'] = 'waiting'));
  expand(first, -1);
  const a = root.querySelector<HTMLElement>(`.ws-a[data-a="${first}"]`);
  a?.querySelector('[data-run]')?.removeAttribute('hidden');
  a?.querySelector('[data-final]')?.setAttribute('hidden', '');
  const io = new IntersectionObserver(
    (en) => {
      if (!en.some((x) => x.isIntersecting)) return;
      io.disconnect();
      if (!played && current === first && tab === 'decision') play();
      else finish();
    },
    { threshold: 0.4 },
  );
  io.observe(root);
}
