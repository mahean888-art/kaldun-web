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

type Tab = 'optimize' | 'discover' | 'coordinate';
type Row = { cells: string[]; win?: boolean };
type RunData = {
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

/** A fan of futures, drawn once; the CSS draws it left to right. */
function fan(): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 600 200');
  svg.setAttribute('class', 'rn__fan');
  svg.setAttribute('aria-hidden', 'true');
  let seed = 7;
  const rnd = (): number => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let k = 0; k < 46; k++) {
    let y = 100;
    let d = 'M0 100';
    const drift = (rnd() - 0.5) * 2.2;
    for (let x = 20; x <= 600; x += 20) {
      y += drift * 3 + (rnd() - 0.5) * 9;
      y = Math.max(8, Math.min(192, y));
      d += ` L${x} ${y.toFixed(1)}`;
    }
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('pathLength', '1');
    p.style.setProperty('--k', String(k));
    svg.append(p);
  }
  return svg;
}

function table(head: string[], rows: Row[], stagger: boolean): HTMLElement {
  const t = el('table', 'rn__t');
  const thead = el('thead');
  const hr = el('tr');
  head.forEach((h) => hr.append(el('th', undefined, h)));
  thead.append(hr);
  const tb = el('tbody');
  rows.forEach((r, i) => {
    const tr = el('tr', r.win ? 'is-win' : undefined);
    if (stagger) tr.style.setProperty('--d', `${i * 420}ms`);
    r.cells.forEach((c, j) => tr.append(el(j === 0 ? 'th' : 'td', undefined, c)));
    tb.append(tr);
  });
  t.append(thead, tb);
  return t;
}

function stepView(d: RunData, i: number, animate: boolean): HTMLElement {
  const v = el('div', `rn__view rn__view--${i}`);
  if (i === 0) {
    v.append(el('p', 'rn__lab', 'Question received'), el('p', 'rn__line', 'Treasury asked this question. The machine starts with the goal and what may change.'));
  } else if (i === 1) {
    v.append(el('p', 'rn__lab', d.model === 'two' ? 'Two machines' : 'The model'));
    const cols = el('div', d.model === 'two' ? 'rn__cols rn__cols--2' : 'rn__cols');
    (d.model === 'two' ? MODEL2 : MODEL3).forEach(([h, rows], k) => {
      const c = el('div', 'rn__col');
      c.style.setProperty('--d', `${k * 160}ms`);
      c.append(el('p', 'rn__colh', h));
      const ul = el('ul');
      rows.forEach((r) => ul.append(el('li', undefined, r)));
      c.append(ul);
      cols.append(c);
    });
    v.append(cols);
    if (d.model === 'two') v.append(el('p', 'rn__note', 'Neither model is shared.'));
  } else if (i === 2) {
    v.append(el('p', 'rn__lab', 'Replay'));
    d.replay.forEach((r) => v.append(el('p', 'rn__big', r)));
  } else if (i === 3) {
    v.append(el('p', 'rn__lab', 'Look ahead'));
    const f = el('div', 'rn__fanwrap');
    f.append(fan(), el('span', 'rn__fanlab', '1,000 futures'));
    v.append(f);
  } else if (i === 4) {
    v.append(el('p', 'rn__lab', d.step5), el('p', 'rn__line', d.tableLead), table(d.head, d.rows, animate));
    if (d.tried) v.append(el('p', 'rn__note', d.tried));
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
