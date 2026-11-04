/**
 * Where we start: the console.
 *
 * Three cases (a recurring decision, a counterparty change, a new service),
 * each a window with three stages: Model, Futures, Discovery. The stages
 * advance every eight seconds once the console is in view, and stop for good
 * the moment the visitor touches it. In Futures the replay fills in, one week
 * at a time, over about four seconds; that is the only animation. Under
 * reduced motion nothing advances and the replay is drawn whole.
 */

import { prefersReducedMotion } from '../lib/prefers';

const STAGES = ['model', 'futures', 'discovery'] as const;
type Stage = (typeof STAGES)[number];

/** Arrow keys move along a tab list; activation is by click. */
function arrows(list: HTMLElement): void {
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]!;
    next.focus();
    next.click();
    e.preventDefault();
  });
}

const select = (tabs: HTMLButtonElement[], on: HTMLButtonElement): void => {
  for (const t of tabs) {
    const yes = t === on;
    t.setAttribute('aria-selected', String(yes));
    t.tabIndex = yes ? 0 : -1;
  }
};

export function initConsole(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const caseTabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.cons__case-t'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-case]'));
  let timer = 0;
  let touched = false;

  const replay = (view: HTMLElement): void => {
    const dots = Array.from(view.querySelectorAll<HTMLElement>('.rp__dots i'));
    if (!dots.length) return;
    if (reduced) {
      for (const d of dots) d.classList.add('is-on');
      return;
    }
    for (const d of dots) d.classList.remove('is-on');
    const rows = Array.from(view.querySelectorAll('.rp__dots'));
    const per = rows[0]?.children.length ?? 1;
    // Fill all rows together, one week at a time.
    let w = 0;
    const step = (): void => {
      for (const r of rows) r.children[w]?.classList.add('is-on');
      w += 1;
      if (w < per) window.setTimeout(step, 4000 / per);
    };
    step();
  };

  const show = (panel: HTMLElement, stage: Stage): void => {
    const tabs = Array.from(panel.querySelectorAll<HTMLButtonElement>('.cons__tab'));
    const on = tabs[STAGES.indexOf(stage)]!;
    select(tabs, on);
    for (const v of panel.querySelectorAll<HTMLElement>('[data-view]')) v.hidden = v.dataset['view'] !== stage;
    for (const r of panel.querySelectorAll<HTMLElement>('[data-rail]')) r.hidden = r.dataset['rail'] !== stage;
    panel.dataset['stage'] = stage;
    if (stage === 'futures') replay(panel.querySelector<HTMLElement>('[data-view="futures"]')!);
  };

  const current = (): HTMLElement => panels.find((p) => !p.hidden) ?? panels[0]!;

  const stop = (): void => {
    touched = true;
    window.clearTimeout(timer);
    root.classList.add('is-held');
  };

  const advance = (): void => {
    if (touched) return;
    const p = current();
    const i = STAGES.indexOf((p.dataset['stage'] as Stage) ?? 'model');
    if (i >= STAGES.length - 1) return; // rest on Discovery
    show(p, STAGES[i + 1]!);
    timer = window.setTimeout(advance, 8000);
  };

  for (const t of caseTabs) {
    t.addEventListener('click', () => {
      select(caseTabs, t);
      for (const p of panels) p.hidden = p.id !== t.getAttribute('aria-controls');
      show(current(), 'model');
    });
  }
  arrows(root.querySelector<HTMLElement>('.cons__cases')!);

  for (const p of panels) {
    p.dataset['stage'] = 'model';
    const tabs = Array.from(p.querySelectorAll<HTMLButtonElement>('.cons__tab'));
    tabs.forEach((t, i) => t.addEventListener('click', () => show(p, STAGES[i]!)));
    arrows(p.querySelector<HTMLElement>('.cons__tabs')!);
  }

  // Any touch inside the console hands control to the visitor.
  root.addEventListener('pointerdown', stop, { capture: true });
  root.addEventListener('keydown', stop, { capture: true });

  if (reduced) return;
  const io = new IntersectionObserver(
    (e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      if (!touched) timer = window.setTimeout(advance, 8000);
    },
    { threshold: 0.35 },
  );
  io.observe(root);
}
