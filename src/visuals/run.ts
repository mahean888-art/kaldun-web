/**
 * Where we start: the run.
 *
 * One app window plays a decision from question to answer, in six steps, for
 * three kinds of decision: Optimize, Discover (the default) and Coordinate.
 *
 * On a desktop-sized window the section holds still for about three screens
 * and scrolling advances the run a step at a time. If the visitor stops for
 * four seconds with the run in view, it plays on by itself, a step every 2.5
 * seconds; at the end it holds the answer for five seconds, then moves to the
 * next tab. On a phone it plays when tapped. Under reduced motion each tab shows
 * its finished answer.
 */
import { prefersReducedMotion } from '../lib/prefers';
import { RUNS as CH, OBS_B, REP_B, WITH_N, LIMIT_B, IDLE_NOW, IDLE_OPT, OBS_E, REP_E, meanErr, lines, intervals, scatter, route, live, legend, mn } from './runcharts';

type Tab = 'optimize' | 'discover' | 'coordinate';
type Row = { cells: string[]; win?: boolean };
type RunData = {
  kind: Tab;
  q: string;
  goal: string;
  step5: string;
  model: 'three' | 'two';
  replay: string[];
  tableLead: string;
  head: string[];
  rows: Row[];
  tried: string;
  answer: string;
  items?: string[];
  compare?: Array<[string, string, string]>;
  stamp: string;
};


const RUNS: Record<Tab, RunData> = {
  optimize: {
    kind: 'optimize',
    q: 'How much cash should we keep at each bank next week?',
    goal: 'every redemption paid within minutes, at any hour',
    step5: 'Optimize',
    model: 'three',
    replay: ['Replayed past events. Within 2% of what happened.'],
    tableLead: 'Cash by bank, tried across the same futures.',
    head: ['Plan', 'Idle cash', 'Promise holds'],
    rows: [
      { cells: ['Current plan', '$2.1B', '100%'] },
      { cells: ['Optimized', '$1.5B', '100%'], win: true },
    ],
    tried: '',
    answer: 'Hold $0.6B less at banks next week.',
    compare: [
      ['Idle cash', '$2.1B', '$1.5B'],
      ['Promise holds', '100%', '100%'],
    ],
    stamp: 'Recorded before outcome · Model v15',
  },
  discover: {
    kind: 'discover',
    q: 'Can we offer instant redemption to Partner N’s merchants?',
    goal: 'every redemption paid within minutes, at any hour',
    step5: 'Discover',
    model: 'three',
    replay: ['Replayed past events. Within 2% of what happened.'],
    tableLead: 'Started from the draft, then searched terms no one had listed.',
    head: ['Arrangement', 'From', 'Promise holds', 'Extra cash'],
    rows: [
      { cells: ['The draft', 'The draft', '73%', '$1.2B'] },
      { cells: ['A fifth instant bank', 'Treasury’s idea', '91%', '$0.7B'] },
      { cells: ['Merchant limit, notice, morning funding', 'Found by the machine', '100%', '$0.4B'], win: true },
    ],
    tried: '312 arrangements tried.',
    answer: 'Yes, with three terms.',
    items: [
      'A daily instant limit per merchant.',
      'Notice from Partner N before very large redemptions.',
      'A morning redemption from the reserve fund, sized to the day’s expected flow.',
    ],
    compare: [
      ['Promise holds', '73%', '100%'],
      ['Extra cash', '$1.2B', '$0.4B'],
    ],
    stamp: 'Recorded before outcome · Model v15',
  },
  coordinate: {
    kind: 'coordinate',
    q: 'Which terms with Exchange E grow balances that stay?',
    goal: 'more long-held balances, at the same cost',
    step5: 'Coordinate',
    model: 'two',
    replay: ['Our machine: replayed past events. Within 2% of what happened.', 'E’s machine: replayed past events. Within 2% of what happened.'],
    tableLead: 'Terms tried in both machines, each scoring its own side.',
    head: ['Terms', 'From', 'Long-held balances', 'Our income, per year', 'E’s revenue, per year'],
    rows: [
      { cells: ['Current terms', 'Today', '$9.0B', '—', '—'] },
      { cells: ['E’s proposal', 'Exchange E', '$9.3B', '−$38M', '+$38M'] },
      { cells: ['Found by both machines', 'Both machines', '$11.4B', '+$9M', '+$12M'], win: true },
    ],
    tried: '48 term sets tried in both machines.',
    answer: 'Terms both machines accept.',
    items: [
      'E’s share rises the longer balances stay.',
      'It falls on balances that leave within a month.',
      'The shares reset if reserve yields move sharply.',
    ],
    stamp: 'Recorded before outcome · Model v15 · E’s model v7',
  },
};

const SCORED: Array<[string, string, string, boolean?]> = [
  ['The rules', 'Reserve policy, OCC rule', 'Pass'],
  ['The past', 'Every replayed day', 'Pass'],
  ['The futures', '1,000 over two years', '100%'],
  ['The outcome', 'After launch', 'Pending', true],
];

const MODEL3: Array<[string, string[]]> = [
  ['The world', ['Banks and settlement windows', 'Partners and their behavior', 'Rates and markets', 'Chains and rails']],
  ['The issuer', ['Reserve fund', 'Cash at 25 banks', '140 partner agreements', 'Redemption ledger']],
  ['Policy', ['Reserve policy', 'OCC reserve rule', 'Limits per bank', 'Service promises']],
];
const MODEL2: Array<[string, string[]]> = [
  ['Our machine', ['Reserves and banks', 'Partner agreements', 'Distribution costs', 'Reserve policy']],
  ['Exchange E’s machine', ['Its users and their balances', 'Its fees and revenue', 'Its listing terms', 'Its risk limits']],
];

const el = (tag: string, cls?: string, text?: string): HTMLElement => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};


function stepView(d: RunData, i: number, _animate: boolean): HTMLElement {
  const v = el('div', `rn__view rn__view--${i}`);
  if (i === 0) {
    const c = CH[d.kind];
    const chips = (xs: Array<[string, boolean]>): string => xs.map(([t, on]) => `<span class="${on ? 'is-on' : ''}">${on ? '✓ ' : ''}${t}</span>`).join('');
    const box = el('div', 'rn__setup');
    box.innerHTML = `<div><p class="rn__lab">What may change</p><p class="rn__chips">${chips(c.may)}</p><p class="rn__lab">Must hold</p><p class="rn__chips">${chips(c.hold.map((h): [string, boolean] => [h, true]))}</p><p class="rn__fix">Anything outside ‘What may change’ stays fixed.</p></div><dl class="rn__props"><dt>Asked by</dt><dd>${c.asked}</dd><dt>Model</dt><dd>v15</dd><dt>Files</dt><dd>${c.files.join('<br>')}</dd></dl>`;
    v.append(box);
  } else if (i === 1) {
    const c = CH[d.kind];
    if (d.model === 'two') {
      v.append(el('p', 'rn__lab', 'Two machines, one world'));
      const cols = el('div', 'rn__cols rn__cols--2');
      MODEL2.forEach(([h, rows], k) => {
        const col = el('div', 'rn__col');
        col.style.setProperty('--d', `${k * 160}ms`);
        col.append(el('p', 'rn__colh', h));
        const ul = el('ul');
        rows.forEach((r) => ul.append(el('li', undefined, r)));
        col.append(ul);
        cols.append(col);
      });
      v.append(cols, el('p', 'rn__note', 'Neither model is shared. Only terms and scores pass between them.'));
    } else {
      const top = el('div', 'rn__row');
      top.append(el('p', 'rn__lab', 'How redemptions are paid · last 90 days'));
      const ly = el('p', 'rn__layers');
      ly.innerHTML = MODEL3.map(([h], k) => `<span>${h} <i>${['shared', 'its own', 'its rules'][k]}</i></span>`).join('');
      top.append(ly);
      const host = el('div', 'rn__chart');
      const unk = el('p', 'rn__unk');
      unk.innerHTML = `<b>Unknown, kept in view</b> ${c.unknown}`;
      v.append(top, host, unk);
      requestAnimationFrame(() => live(host, (w) => route(w, d.kind === 'discover', Math.max(170, Math.min(230, host.parentElement!.clientHeight - 110)))));
    }
  } else if (i === 2) {
    const host = el('div', 'rn__chart');
    const stats = el('p', 'rn__stats');
    if (d.kind === 'coordinate') {
      v.append(el('p', 'rn__lab', 'Our machine, replayed · balances E’s users held, $B'), legend([['ink', 'What happened'], ['or', 'Replay']]), host, stats);
      stats.innerHTML = `<span><b>${(meanErr(OBS_E, REP_E) * 100).toFixed(1)}%</b> mean error, 78 weeks</span><span><b>Within 2%</b> E’s machine, reported by E</span><span><b>None</b> data shared</span>`;
      requestAnimationFrame(() => live(host, (w) => lines(w, { series: [{ v: OBS_E, color: '#141210' }, { v: REP_E, color: '#f39200', dash: '4 3' }], min: 7.6, max: 9.8, ticks: [8, 9], fmt: (x) => `$${x}B`, h: 150 })));
    } else if (d.kind === 'optimize') {
      v.append(el('p', 'rn__lab', 'The past, under each plan · idle cash at banks, $B'), legend([['grey', 'Current plan'], ['or', 'Optimized plan']]), host, stats);
      stats.innerHTML = `<span><b>${(meanErr(OBS_B, REP_B) * 100).toFixed(1)}%</b> replay error, 78 weeks</span><span><b>78 of 78</b> weeks every redemption paid, both plans</span>`;
      requestAnimationFrame(() => live(host, (w) => lines(w, { series: [{ v: IDLE_NOW, color: '#bdb7ac', w: 2 }, { v: IDLE_OPT, color: '#f39200', w: 2 }], min: 1.2, max: 2.4, ticks: [1.2, 1.8, 2.4], fmt: (x) => `$${x.toFixed(1)}B`, h: 150 })));
    } else {
      const over = WITH_N.map((x, k) => (x > LIMIT_B ? k : -1)).filter((k) => k >= 0);
      v.append(el('p', 'rn__lab', 'The past, with Partner N · bank B’s peak day each week, $M'), legend([['ink', 'With Partner N'], ['dash', 'Bank B same-day limit'], ['sh', 'Falls short']]), host, stats);
      stats.innerHTML = `<span><b>${(meanErr(OBS_B, REP_B) * 100).toFixed(1)}%</b> replay error against what happened</span><span><b>${over.length} of 78</b> weeks fall short with Partner N, all at bank B</span>`;
      requestAnimationFrame(() => live(host, (w) => lines(w, { series: [{ v: WITH_N, color: '#141210' }], min: 300, max: 800, ticks: [400, 600, 800], fmt: mn, limit: { v: LIMIT_B, label: mn(LIMIT_B) }, over, h: 150 })));
    }
  } else if (i === 3) {
    const c = CH[d.kind];
    const short: Record<Tab, [string, string]> = { discover: ['Draft', 'Found'], optimize: ['Current', 'Optimized'], coordinate: ['Current', 'Found'] };
    const host = el('div', 'rn__chart');
    v.append(el('p', 'rn__lab', `${c.iv.title} · ${c.iv.cap.split(' · ')[0]}`), legend([['hollow', c.iv.a], ['dot', c.iv.b], ['range', '90% range']]), host);
    requestAnimationFrame(() => live(host, (w) => intervals(w, { ...c.iv, a: short[d.kind][0], b: short[d.kind][1], compact: true })));
  } else if (i === 4) {
    const c = CH[d.kind];
    const host = el('div', 'rn__chart');
    v.append(el('p', 'rn__lab', `${d.step5} · ${c.s5.title}`), host);
    requestAnimationFrame(() => live(host, (w) => scatter(w, { ...c.s5.sc, h: Math.max(220, Math.min(270, host.parentElement!.clientHeight - 30)) })));
  } else {
    const grid = el('div', 'rn__ans');
    const a = el('div', 'rn__ansa');
    a.append(el('p', 'rn__lab', 'Answer'), el('p', 'rn__answer', d.answer));
    if (d.items) {
      const ol = el('ol', 'rn__items');
      d.items.forEach((t, k) => {
        const li = el('li');
        li.append(el('span', undefined, `0${k + 1}`), document.createTextNode(t));
        ol.append(li);
      });
      a.append(ol);
    }
    if (d.compare) {
      const cmp = el('dl', 'rn__cmp');
      d.compare.forEach(([k, from, to]) => {
        const r = el('div');
        r.append(el('dt', undefined, k), el('dd', undefined, `${from} → ${to}`));
        cmp.append(r);
      });
      a.append(cmp);
    }
    const b = el('div', 'rn__ansb');
    b.append(el('p', 'rn__lab', 'Scored against'));
    const sc = el('dl', 'rn__sc');
    SCORED.forEach(([k, what, res, pend]) => {
      const r = el('div');
      r.append(el('dt', undefined, k), el('dd', undefined, what), el('dd', pend ? 'rn__res is-pend' : 'rn__res', res));
      sc.append(r);
    });
    b.append(sc, el('p', 'rn__stamp', d.stamp));
    grid.append(a, b);
    v.append(grid);
  }
  return v;
}

export function initRun(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const rail = Array.from(root.querySelectorAll<HTMLElement>('.rn__rail li'));
  const step5 = root.querySelector<HTMLElement>('[data-step5]');
  const qEl = root.querySelector<HTMLElement>('[data-q]');
  const goalEl = root.querySelector<HTMLElement>('[data-goal]');
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const bar = root.querySelector<HTMLElement>('[data-bar]');
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]');
  const track = root.closest<HTMLElement>('[data-run-track]');
  if (!stage || !qEl || !goalEl || !bar) return;

  const ORDER: Tab[] = ['optimize', 'discover', 'coordinate'];
  let tab: Tab = 'discover';
  let step = reduced ? 5 : 0;
  let typer = 0;
  let auto = 0;
  let idle = 0;
  let hold = 0;
  let inView = false;
  let lastScrollStep = -1;
  const desktop = window.matchMedia('(min-width: 1024px) and (min-height: 760px)');

  const typeQuestion = (text: string): void => {
    window.clearInterval(typer);
    if (reduced) {
      qEl.textContent = text;
      return;
    }
    let n = 0;
    qEl.textContent = '';
    qEl.classList.add('is-typing');
    typer = window.setInterval(() => {
      n += 2;
      qEl.textContent = text.slice(0, n);
      if (n >= text.length) {
        window.clearInterval(typer);
        qEl.classList.remove('is-typing');
      }
    }, 22);
  };

  const render = (typeQ: boolean): void => {
    const d = RUNS[tab];
    tabs.forEach((t) => {
      const on = t.dataset['tab'] === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (step5) step5.textContent = d.step5;
    if (typeQ) typeQuestion(d.q);
    else qEl.textContent = d.q;
    goalEl.textContent = d.goal;
    rail.forEach((li, k) => {
      li.classList.toggle('is-done', k < step);
      li.classList.toggle('is-now', k === step);
    });
    bar.style.width = `${((step + 1) / 6) * 100}%`;
    const v = stepView(d, step, !reduced);
    stage.replaceChildren(v);
    if (!reduced) {
      void v.offsetWidth;
      v.classList.add('is-in');
    }
  };

  const stopAuto = (): void => {
    window.clearInterval(auto);
    window.clearTimeout(hold);
    auto = 0;
  };
  const nextTab = (): void => {
    tab = ORDER[(ORDER.indexOf(tab) + 1) % ORDER.length]!;
    step = 0;
    lastScrollStep = -1;
    render(true);
  };
  const advance = (): void => {
    if (step < 5) {
      step += 1;
      render(false);
      if (step === 5) {
        window.clearInterval(auto);
        auto = 0;
        hold = window.setTimeout(() => {
          nextTab();
          startAuto();
        }, 5000);
      }
    }
  };
  const startAuto = (): void => {
    if (reduced || auto) return;
    if (step === 5) {
      hold = window.setTimeout(() => {
        nextTab();
        startAuto();
      }, 5000);
      return;
    }
    auto = window.setInterval(advance, 2500);
  };
  const armIdle = (): void => {
    window.clearTimeout(idle);
    if (reduced || !inView) return;
    idle = window.setTimeout(startAuto, 4000);
  };

  // --- input ---------------------------------------------------------------------------
  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      stopAuto();
      tab = t.dataset['tab'] as Tab;
      step = reduced ? 5 : 0;
      lastScrollStep = -1;
      render(true);
      if (!desktop.matches) startAuto();
      else armIdle();
    }),
  );
  root.querySelector('[role="tablist"]')?.addEventListener('keydown', (ev) => {
    const k = (ev as KeyboardEvent).key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight') return;
    const i = ORDER.indexOf(tab);
    const n = tabs.find((b) => b.dataset['tab'] === ORDER[(i + (k === 'ArrowRight' ? 1 : 2)) % 3]);
    n?.focus();
    n?.click();
    ev.preventDefault();
  });
  replay?.addEventListener('click', () => {
    stopAuto();
    step = 0;
    lastScrollStep = -1;
    render(true);
    if (!reduced) startAuto();
  });
  root.querySelector('.rn__win')?.addEventListener('click', () => {
    if (desktop.matches || reduced) return;
    if (!auto) {
      if (step === 5) {
        step = 0;
        render(true);
      }
      startAuto();
    }
  });

  // --- scroll drives the run on a desktop-sized window ---------------------------------
  const onScroll = (): void => {
    if (!track || !desktop.matches || reduced) return;
    const r = track.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    if (span <= 0) return;
    const p = Math.max(0, Math.min(1, -r.top / span));
    const s = Math.min(5, Math.floor(p * 6));
    if (r.top > window.innerHeight * 0.5 || r.bottom < 0) return;
    if (s !== lastScrollStep) {
      lastScrollStep = s;
      stopAuto();
      if (s !== step) {
        step = s;
        render(false);
      }
    }
    armIdle();
  };
  let q = false;
  window.addEventListener(
    'scroll',
    () => {
      if (q) return;
      q = true;
      requestAnimationFrame(() => {
        q = false;
        onScroll();
      });
    },
    { passive: true },
  );

  const io = new IntersectionObserver(
    (en) => {
      inView = en.some((e) => e.isIntersecting);
      if (inView) armIdle();
      else {
        window.clearTimeout(idle);
        stopAuto();
      }
    },
    { threshold: 0.4 },
  );
  io.observe(root.querySelector('.rn__win') ?? root);
  render(!reduced);
  if (reduced) root.classList.add('is-still');
}
