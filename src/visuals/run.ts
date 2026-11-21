/**
 * Where we start: one screen of the product.
 *
 * A Foresight Machine for a dollar issuer, open on one decision. Every visible
 * control responds honestly: persona switcher, focus tabs & left nav, open-task
 * previews, live toggleable interventions that recompute the stress bars and
 * Answer panel in real time, and a working question bar into /discuss/?q=.
 */
const PERSONAS: Record<string, { k: string; t: string; n: string; q: string }> = {
  payments: {
    k: 'This world',
    t: 'Payment company',
    n: 'We model the world once; each institution gets its own machine.',
    q: 'Where should liquidity sit so every payout clears, at any hour, with the least cash trapped?',
  },
  exchange: {
    k: 'This world',
    t: 'Exchange',
    n: 'We model the world once; each institution gets its own machine.',
    q: 'Which distribution terms grow balances that stay, for us and the issuer?',
  },
  bank: {
    k: 'This world',
    t: 'Bank',
    n: 'We model the world once; each institution gets its own machine.',
    q: 'What should it cost to cover redemptions that cannot clear over a weekend?',
  },
  trader: {
    k: 'Next, on the same engine',
    t: 'Commodity trader',
    n: 'Trade and critical supply chains',
    q: 'How should cargo at sea be hedged and routed if a strait closes?',
  },
  mga: {
    k: 'Next, on the same engine',
    t: 'Specialty MGA',
    n: 'Underwrite, across all three worlds',
    q: 'What should it cost to cover a late project, when power, equipment, and debt depend on each other?',
  },
  grid: {
    k: 'Next, on the same engine',
    t: 'Grid and compute developer',
    n: 'Power, compute, and megainfrastructure',
    q: 'Which build plan still holds if interconnection slips two years?',
  },
};

const OPEN_TASKS: Record<string, { t: string; q: string; s: string }> = {
  buffer: {
    t: 'Liquidity buffer, next week',
    q: 'What is the smallest cash buffer across four settlement banks that clears a 3-day holiday weekend without breaking par?',
    s: 'Bank holiday cutoff + 4× retail outflow + primary wire delay.',
  },
  reserve: {
    t: 'Reserve mix for December',
    q: 'How should T-bill maturities, overnight repo, and bank cash be positioned into year-end balance-sheet contraction?',
    s: 'Repo haircut spike + year-end dealer retreat + $1.5B institutional exit.',
  },
  exchange: {
    t: 'Terms with Exchange E',
    q: 'Which mint-and-redeem fee tiers and settlement windows grow sticky balances for both the issuer and Exchange E?',
    s: 'Correlated weekend volatility + exchange withdrawal queue + reserve yield compression.',
  },
};

const FOCUS_MAP: Record<string, string[]> = {
  all: [],
  model: ['1', '2'],
  simulate: ['3'],
  intervene: ['4', '5'],
  record: ['5', '6'],
};

function fmtMoney(millions: number): string {
  if (millions >= 1000) return `$${(millions / 1000).toFixed(1)}B`;
  return `$${millions}M`;
}

function initPersonas(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-persona-btn]');
  const menu = root.querySelector<HTMLElement>('[data-persona-menu]');
  const card = root.querySelector<HTMLElement>('[data-persona-card]');
  if (!btn || !menu || !card) return;
  const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('[data-p]'));
  const discuss = card.querySelector<HTMLAnchorElement>('[data-pv-d]');
  const set = (sel: string, v: string): void => {
    const e = card.querySelector<HTMLElement>(sel);
    if (e) e.textContent = v;
  };
  const close = (): void => {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };
  const back = (): void => {
    card.hidden = true;
    items.forEach((i) => i.classList.toggle('is-on', i.dataset['p'] === 'issuer'));
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    card.hidden = true;
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) items[0]?.focus();
  });
  items.forEach((i) =>
    i.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
      const p = PERSONAS[i.dataset['p'] ?? ''];
      items.forEach((x) => x.classList.toggle('is-on', x === i));
      if (!p) return back();
      set('[data-pv-k]', p.k);
      set('[data-pv-t]', p.t);
      set('[data-pv-n]', p.n);
      set('[data-pv-q]', p.q);
      if (discuss) discuss.href = `/discuss/?q=${encodeURIComponent(p.q)}`;
      card.hidden = false;
    }),
  );
  card.querySelector('[data-pv-x]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    back();
    btn.focus();
  });
  card.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => {
    close();
    back();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!menu.hidden || !card.hidden) btn.focus();
    close();
    back();
  });
}

function initTermSimulator(win: HTMLElement): void {
  const btns = Array.from(win.querySelectorAll<HTMLButtonElement>('[data-term]'));
  if (!btns.length) return;

  const state: Record<string, boolean> = { rail: true, cap: true, sweep: true };

  const setSim = (key: string, strongText: string, barPct: number): void => {
    const row = win.querySelector<HTMLElement>(`[data-sim="${key}"]`);
    if (!row) return;
    const val = row.querySelector<HTMLElement>('[data-sim-val]');
    const bar = row.querySelector<HTMLElement>('b.f');
    if (val) val.textContent = strongText;
    if (bar) bar.style.width = `${barPct}%`;
  };

  const setText = (attr: string, text: string): void => {
    const el = win.querySelector<HTMLElement>(`[${attr}]`);
    if (el) el.textContent = text;
  };

  const recompute = (): void => {
    const rail = !!state['rail'];
    const cap = !!state['cap'];
    const sweep = !!state['sweep'];
    const count = Number(rail) + Number(cap) + Number(sweep);

    // 1. Volume surge
    setSim('surge', cap ? '6.0×' : '2.3×', cap ? 46.2 : 0);

    // 2. Settlement bank offline
    setSim('offline', rail ? '48 h+' : '3.5 h', rail ? 92.7 : 0);

    // 3. Weekend run held at par ($380M base -> $1.9B with all 3)
    const runM = 380 + (rail ? 420 : 0) + (cap ? 350 : 0) + (sweep ? 750 : 0);
    const runText = fmtMoney(runM);
    const runPct = ((runM - 380) / 1520) * 60.8;
    setSim('run', runText, Number(runPct.toFixed(1)));

    // 4. March 2023 weekend, rescaled
    let svbText = 'short $310M';
    let svbPct = 0;
    if (rail && cap && sweep) {
      svbText = 'paid in full';
      svbPct = 45;
    } else if (sweep && (rail || cap)) {
      svbText = 'short $85M';
      svbPct = 29;
    } else if (sweep) {
      svbText = 'short $140M';
      svbPct = 21;
    } else if (rail && cap) {
      svbText = 'short $190M';
      svbPct = 14;
    } else if (rail || cap) {
      svbText = 'short $260M';
      svbPct = 6;
    }
    setSim('svb', svbText, svbPct);

    // Update Answer panel
    if (count === 3) {
      setText('data-ans-title', 'Yes, with three terms.');
      setText('data-ans-regimes', 'All four raised');
      setText('data-ans-breaks', 'both payout banks offline in one weekend, or a weekend run above $1.9B.');
    } else if (count === 0) {
      setText('data-ans-title', 'No — breaks under stress.');
      setText('data-ans-regimes', '0 of 4 raised');
      setText('data-ans-breaks', 'a 2.3× merchant surge, 3.5 h bank outage, or a $380M weekend run.');
    } else {
      setText('data-ans-title', `Partial — ${count} of 3 terms.`);
      const raised = (cap ? 1 : 0) + (rail ? 1 : 0) + (runM > 380 ? 1 : 0) + (svbPct >= 45 ? 1 : 0);
      setText('data-ans-regimes', `${raised} of 4 raised`);
      const weak = !rail
        ? 'one settlement bank offline for 3.5 h.'
        : !cap
          ? 'a 2.3× merchant volume surge.'
          : 'a rescaled March 2023 weekend exit (short $190M).';
      setText('data-ans-breaks', weak);
    }

    setText('data-ans-run', runText);
    setText('data-ans-cash', sweep ? '$0.7B' : '$1.2B');
    setText(
      'data-ans-yield',
      sweep
        ? '$500M freed (about $17.5M a year at a 3.5% reserve yield)'
        : 'No idle cash freed without the morning fund sweep.',
    );

    btns.forEach((b) => {
      const k = b.dataset['term'] ?? '';
      const on = !!state[k];
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  };

  btns.forEach((b) => {
    b.addEventListener('click', () => {
      const k = b.dataset['term'] ?? '';
      if (!(k in state)) return;
      state[k] = !state[k];
      recompute();
    });
  });

  recompute();
}

function initFocusAndTasks(root: HTMLElement, win: HTMLElement): void {
  const tabs = Array.from(win.querySelectorAll<HTMLButtonElement>('.ps__tabs [data-focus]'));
  const navBtns = Array.from(win.querySelectorAll<HTMLButtonElement>('.ps__nav [data-focus]'));
  const cards = Array.from(win.querySelectorAll<HTMLElement>('[data-c]'));
  const taskBtns = Array.from(win.querySelectorAll<HTMLButtonElement>('[data-task-list] [data-task]'));
  const taskCard = win.querySelector<HTMLElement>('[data-task-card]');
  const taskClose = win.querySelector<HTMLButtonElement>('[data-tk-x]');
  const taskDiscuss = win.querySelector<HTMLAnchorElement>('[data-tk-d]');

  const closeTask = (): void => {
    if (taskCard) taskCard.hidden = true;
    taskBtns.forEach((b) => b.parentElement?.classList.toggle('is-on', b.dataset['task'] === 'partner'));
  };

  const setFocus = (key: string): void => {
    closeTask();
    const picked = FOCUS_MAP[key] ?? [];
    win.classList.toggle('is-focus', picked.length > 0);
    cards.forEach((c) => c.classList.toggle('is-picked', picked.includes(c.dataset['c'] ?? '')));
    tabs.forEach((t) => {
      const on = t.dataset['focus'] === key;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', String(on));
    });
    navBtns.forEach((n) => {
      const li = n.parentElement;
      if (!li) return;
      const isTasks = n.textContent?.trim() === 'Tasks';
      const on = key === 'all' ? isTasks : n.dataset['focus'] === key;
      li.classList.toggle('is-on', on);
    });
  };

  tabs.forEach((t) => t.addEventListener('click', () => setFocus(t.dataset['focus'] ?? 'all')));
  navBtns.forEach((n) => n.addEventListener('click', () => setFocus(n.dataset['focus'] ?? 'all')));

  taskBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const key = b.dataset['task'] ?? 'partner';
      if (key === 'partner' || !OPEN_TASKS[key] || !taskCard) {
        closeTask();
        return;
      }
      const meta = OPEN_TASKS[key]!;
      const tEl = taskCard.querySelector<HTMLElement>('[data-tk-t]');
      const qEl = taskCard.querySelector<HTMLElement>('[data-tk-q]');
      const sEl = taskCard.querySelector<HTMLElement>('[data-tk-s]');
      if (tEl) tEl.textContent = meta.t;
      if (qEl) qEl.textContent = meta.q;
      if (sEl) sEl.textContent = meta.s;
      if (taskDiscuss) taskDiscuss.href = `/discuss/?q=${encodeURIComponent(meta.q)}`;
      taskBtns.forEach((x) => x.parentElement?.classList.toggle('is-on', x === b));
      win.classList.remove('is-focus');
      taskCard.hidden = false;
    });
  });

  taskClose?.addEventListener('click', closeTask);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && taskCard && !taskCard.hidden) closeTask();
  });

  const askForm = win.querySelector<HTMLFormElement>('[data-ask-form]');
  askForm?.addEventListener('submit', (e) => {
    const input = askForm.querySelector<HTMLInputElement>('input[name="q"]');
    const val = input?.value.trim() ?? '';
    if (!val) {
      e.preventDefault();
      window.location.href = '/discuss/';
    }
  });
}

export function initRun(root: HTMLElement): void {
  initPersonas(root);
  const win = root.querySelector<HTMLElement>('.ps__win');
  if (!win) return;
  initFocusAndTasks(root, win);
  initTermSimulator(win);

  const io = new IntersectionObserver(
    (es) => {
      if (es.some((e) => e.isIntersecting)) {
        root.classList.add('is-in');
        io.disconnect();
      }
    },
    { threshold: 0, rootMargin: '0px 0px -12% 0px' },
  );
  io.observe(win);

  const stage = win.parentElement as HTMLElement;
  const wide = window.matchMedia('(min-width: 1024px)');
  const fit = (): void => {
    win.style.transform = '';
    win.style.width = '';
    stage.style.height = '';
    if (!wide.matches) return;
    const cs = getComputedStyle(stage);
    const padT = parseFloat(cs.paddingTop);
    const inner = stage.clientWidth - parseFloat(cs.paddingLeft);
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    const avail = window.innerHeight - headerH - 48 - padT;
    const fits = (k: number): boolean => {
      win.style.width = `${inner / k}px`;
      return win.offsetHeight * k <= avail;
    };
    let k = 1;
    if (!fits(1)) {
      let lo = 0.62;
      let hi = 1;
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
      k = lo;
    }
    win.style.width = `${inner / k}px`;
    win.style.transformOrigin = '0 0';
    win.style.transform = `scale(${k})`;
    stage.style.height = `${padT + win.offsetHeight * k}px`;
  };
  fit();
  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fit);
  });
  document.fonts?.ready.then(fit);
}
