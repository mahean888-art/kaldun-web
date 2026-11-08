/**
 * Where we start: the decision workspace.
 *
 * A treasury team asks a question; the machine works through four steps in
 * the open (Model, Replay, Look ahead, Discover) and the answer builds beside
 * the work. Three views: the decision, the model itself, and the record of what
 * was recommended before the outcome and how the model was revised.
 *
 * At first paint decision 1 is shown finished. When the window is 40% in view
 * the run plays once, about fifteen seconds. Only the running (or chosen) step is
 * expanded. Any click on a step, decision or tab stops the run and shows the
 * finished state, and so does scrolling away mid-run: a half-finished state is
 * never shown on return. "Replay the run" plays it again on request. Under
 * reduced motion nothing plays.
 */

import { prefersReducedMotion } from '../lib/prefers';

type Timer = ReturnType<typeof setTimeout>;
type Tab = 'decision' | 'model' | 'record';

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
  const views: Record<Exclude<Tab, 'decision'>, [HTMLElement | null, HTMLElement | null]> = {
    model: [root.querySelector('[data-model-view]'), root.querySelector('[data-a-model]')],
    record: [root.querySelector('[data-record-view]'), root.querySelector('[data-a-record]')],
  };
  const panel = root.querySelector<HTMLElement>('#ws-center-panel');
  const first = decs[0]?.dataset['dec'] ?? '';
  const firstStatus = decs[0]?.querySelector<HTMLElement>('[data-status]');
  const statusText = firstStatus?.textContent ?? '';
  let current = first;
  let tab: Tab = 'decision';
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

  /** The step to show expanded when a decision opens finished: the last done, or the one before the running one. */
  const defaultStep = (id: string): number => {
    const st = stepsOf(id);
    const run = st.findIndex((s) => s.dataset['state'] === 'running');
    if (run >= 0) return Math.max(0, run - 1);
    return st.length - 1;
  };

  /** Decision 1, finished: every step done, the answer in place. */
  const finish = (): void => {
    timers.forEach(clearTimeout);
    timers = [];
    const was = running;
    running = false;
    stepsOf(first).forEach((s) => (s.dataset['state'] = 'done'));
    const a = root.querySelector<HTMLElement>(`.ws-a[data-a="${first}"]`);
    a?.querySelector<HTMLElement>('[data-run]')?.setAttribute('hidden', '');
    a?.querySelector<HTMLElement>('[data-final]')?.removeAttribute('hidden');
    a?.classList.remove('is-running', 'is-fading');
    if (firstStatus) firstStatus.textContent = statusText;
    root.classList.remove('is-running');
    if (was && current === first) expand(first, defaultStep(first));
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
    (Object.keys(views) as Array<keyof typeof views>).forEach((k) => views[k].forEach((v) => v && (v.hidden = tab !== k)));
    expand(id, step ?? defaultStep(id));
  };

  const interrupt = (): void => {
    if (running) finish();
    played = true;
  };

  /** Decision 1: the steps run in order, and the answer builds beside them. */
  const play = (): void => {
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
      expand(first, defaultStep(first));
      timers.push(setTimeout(() => a.classList.remove('is-fading'), 450));
    });
  };

  const setTab = (t: Tab): void => {
    tab = t;
    tabs.forEach((b) => {
      const on = b.dataset['tab'] === t;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    const btn = tabs.find((b) => b.dataset['tab'] === t);
    if (btn) panel?.setAttribute('aria-labelledby', btn.id);
    open(current);
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
  tabs.forEach((b) =>
    b.addEventListener('click', () => {
      interrupt();
      setTab(b.dataset['tab'] as Tab);
    }),
  );
  root.querySelector('.ws-tabs')?.addEventListener('keydown', (ev) => {
    const k = (ev as KeyboardEvent).key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight') return;
    const i = tabs.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const n = tabs[(i + (k === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]!;
    n.focus();
    n.click();
    ev.preventDefault();
  });
  root.querySelector<HTMLButtonElement>('[data-replay]')?.addEventListener('click', () => {
    finish();
    if (tab !== 'decision') setTab('decision');
    open(first);
    play();
  });

  // First paint: decision 1, finished.
  open(first);
  if (reduced) {
    played = true;
    return;
  }
  // Play once at 40% in view; if the visitor scrolls away mid-run, finish at once.
  const io = new IntersectionObserver(
    (en) => {
      const e = en[en.length - 1]!;
      if (e.intersectionRatio >= 0.4) {
        if (!played && current === first && tab === 'decision') play();
      } else if (!e.isIntersecting || e.intersectionRatio < 0.1) {
        if (running) finish();
      }
    },
    { threshold: [0, 0.1, 0.4] },
  );
  io.observe(root);
}
