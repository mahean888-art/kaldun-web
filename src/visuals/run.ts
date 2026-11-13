/**
 * Where we start: a Foresight Machine at work, end to end.
 *
 * The machine writes its model of the issuer and the world it depends on
 * (capital, counterparties, contracts, markets and rules), checks that model
 * against the past, then runs a decision in the same document: replay, a
 * thousand futures, a search, and an answer with its evidence. The sections in
 * the sidebar fill in as they are written.
 *
 * It plays once the window is in view. The visitor can pause, replay, or jump
 * to any written section. The tabs change the decision; the world is modeled
 * once and stays. Under reduced motion everything is shown at once.
 */
import { prefersReducedMotion } from '../lib/prefers';

type Kind = 'discover' | 'optimize' | 'coordinate';
type Block = {
  sec: string; // sidebar section this block belongs to
  status?: string; // what the machine says it is doing before the block appears
  html: string; // the block
  words?: boolean; // reveal word by word (prose); otherwise row by row
  wait?: number; // extra pause after the block, ms
};

/* -------------------------------------------------------------- the world */

const e = (name: string): string => `<a class="wk-e">${name}</a>`;
const rowsT = (head: string[], rows: string[][], cls = ''): string =>
  `<table class="wk-t ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;

const SECTIONS: Array<[string, string, number]> = [
  ['overview', 'Overview', 0],
  ['capital', 'Capital', 1],
  ['counterparties', 'Counterparties', 1],
  ['contracts', 'Contracts', 1],
  ['markets', 'Markets and rules', 1],
  ['fidelity', 'Checked against the past', 1],
  ['decision', 'Decision', 0],
  ['replay', 'Replay', 1],
  ['futures', 'Futures', 1],
  ['search', 'Search', 1],
  ['answer', 'Answer', 1],
];

const WORLD: Block[] = [
  { sec: 'overview', status: 'Reading the issuer’s ledger…', html: `<h3 class="wk__h1">The issuer, in its world</h3>` },
  {
    sec: 'overview',
    words: true,
    html: `<p>A dollar issuer with $41.2B in circulation, held in 2.3M wallets. Every dollar is redeemable for cash, at any hour, through any of its ${e('140 partners')}. Its promise depends on ${e('25 banks')}, a ${e('reserve fund')}, the rates it earns, and the rules it answers to. The machine models all of them.</p>`,
  },
  { sec: 'capital', status: 'Reading reserve holdings…', html: `<h4 class="wk__h2">Capital</h4>` },
  {
    sec: 'capital',
    html: `<p class="wk-lead">Reserve $41.6B, 101% of circulation.</p>
      <div class="wk-stack" aria-hidden="true"><i style="flex:67"></i><i style="flex:20"></i><i style="flex:13"></i></div>
      ${rowsT(['Holding', 'Amount', 'Share'], [
        ['Treasury bills, under 93 days', '$27.9B', '67%'],
        [`Overnight repo with ${e('Fund F')}`, '$8.3B', '20%'],
        [`Cash at ${e('25 banks')}`, '$5.4B', '13%'],
      ])}`,
  },
  { sec: 'counterparties', status: 'Mapping settlement at 25 banks…', html: `<h4 class="wk__h2">Counterparties</h4>` },
  {
    sec: 'counterparties',
    html: rowsT(['Bank', 'Settles', 'Window', 'Same-day limit', 'Instant share'], [
      [e('Bank B'), 'Instant', '24/7', '$657M', '58%'],
      [e('Bank A'), 'Instant', '24/7', '$240M', '19%'],
      [e('Bank C'), 'Instant', 'Weekdays 6am–10pm', '$180M', '14%'],
      [e('Bank D'), 'Instant', 'Weekdays 8am–8pm', '$120M', '9%'],
      ['21 more', 'Next day', 'Business hours', '—', '—'],
    ]),
  },
  {
    sec: 'counterparties',
    words: true,
    html: `<p class="wk-note"><span class="wk-note__k">World</span> ${e('Bank C')} moved its window to 6am yesterday. Updated for every machine.</p>`,
  },
  {
    sec: 'counterparties',
    html: `<p class="wk-chips"><span>48 payment companies</span><span>61 wallets</span><span>12 exchanges</span><span>19 lenders</span></p>`,
  },
  { sec: 'contracts', status: 'Reading 140 partner agreements…', html: `<h4 class="wk__h2">Contracts</h4>` },
  {
    sec: 'contracts',
    words: true,
    html: `<p>140 agreements read. 38 promise redemption within minutes, 9 set daily limits, 4 require notice before large redemptions. ${e('Partner N')}’s draft asks for instant redemption for 31,000 merchants, with no limit and no notice.</p>`,
  },
  { sec: 'markets', status: 'Connecting markets and rules…', html: `<h4 class="wk__h2">Markets and rules</h4>` },
  {
    sec: 'markets',
    html: rowsT(['', 'Now', 'Source'], [
      ['3-month T-bill', '4.12%', 'Live'],
      ['Overnight repo', '4.31%', 'Live'],
      ['Redemptions, last 30 days', '$6.8B', 'Ledger'],
      [e('OCC reserve rule'), 'Met', 'Checked hourly'],
      [e('Reserve policy v6'), 'Met', 'At least 10% as cash'],
    ], 'wk-t--kv'),
  },
  { sec: 'fidelity', status: 'Replaying the last 78 weeks…', html: `<h4 class="wk__h2">Checked against the past</h4>` },
  {
    sec: 'fidelity',
    html: `<div class="wk-fit"><p><b>1.8%</b><span>mean error, 78 weeks replayed</span></p><p><b>25 of 25</b><span>banks’ balances within range</span></p><p><b>v15</b><span>promoted Nov 2, after 11 weeks moved closer</span></p></div>`,
    wait: 500,
  },
];

/* ------------------------------------------------------------ the decisions */

const bars = (rows: Array<[string, number, number, number, number, number, number]>, a: string, b: string): string =>
  `<div class="wk-iv"><p class="wk-iv__lg"><span><i class="o"></i>${a}</span><span><i class="f"></i>${b}</span><span class="r">Line: 90% range</span></p>${rows
    .map(([l, am, alo, ahi, bm, blo, bhi]) => {
      const X = (v: number) => ((v - 60) / 40) * 100;
      return `<div class="wk-iv__r"><span>${l}</span><i><b class="o" style="left:${X(alo)}%;width:${X(ahi) - X(alo)}%"></b><em class="o" style="left:${X(am)}%"></em><b class="f" style="left:${X(blo)}%;width:${Math.max(1, X(bhi) - X(blo))}%"></b><em class="f" style="left:${X(bm)}%"></em></i><span>${am}% → <strong>${bm}%</strong></span></div>`;
    })
    .join('')}<p class="wk-iv__ax"><span></span><span class="t"><span>60%</span><span>80%</span><span>100%</span></span><span></span></p></div>`;

const answer = (title: string, items: string[], scored: Array<[string, string]>, stamp: string): string =>
  `<div class="wk-ans"><p class="wk-ans__k">Answer</p><p class="wk-ans__t">${title}</p><ol>${items.map((t, i) => `<li><span>${i + 1}</span>${t}</li>`).join('')}</ol>
   <dl>${scored.map(([k, v]) => `<div><dt>${k}</dt><dd class="${v === 'Pending' ? 'is-p' : ''}">${v}</dd></div>`).join('')}</dl><p class="wk-ans__s">${stamp}</p></div>`;

const DECISIONS: Record<Kind, Block[]> = {
  discover: [
    {
      sec: 'decision',
      status: 'Treasury asked a question…',
      html: `<div class="wk-q"><p class="wk-q__k">Decision · Discover</p><h4>Can we offer instant redemption to ${e('Partner N')}’s merchants?</h4><p class="wk-q__g">Goal: every redemption paid within minutes, at any hour. May change: reserve mix, cash by bank, timing, partner limits and terms.</p></div>`,
    },
    { sec: 'replay', status: 'Replaying 78 weeks with Partner N included…', html: `<div class="wk-chart" data-chart="replay"></div>` },
    {
      sec: 'replay',
      words: true,
      html: `<p>With Partner N’s merchants added, ${e('Bank B')} would have fallen short in 7 of 78 weeks, all on weekday mornings after payroll. The reserve was large enough every time. The route was not.</p>`,
    },
    {
      sec: 'futures',
      status: 'Running 1,000 futures over two years…',
      html: bars([
        ['Adoption is slow', 96, 93, 98, 100, 99, 100],
        ['Adoption is fast', 73, 66, 79, 100, 98, 100],
        ['Partner N doubles', 81, 75, 86, 100, 98, 100],
        ['A bank leaves', 88, 83, 92, 99, 97, 100],
      ], 'The draft', 'With the terms found'),
    },
    {
      sec: 'search',
      status: 'Searching arrangements no one listed…',
      html: `<p class="wk-lead">312 arrangements tried. Three terms hold in every future.</p>
        ${rowsT(['Term', 'Without it'], [
          ['A daily instant limit per merchant', '84%'],
          ['Notice from Partner N before very large redemptions', '93%'],
          ['A morning redemption from the reserve fund, sized to the day', '89%'],
        ], 'wk-t--terms')}`,
    },
    {
      sec: 'answer',
      status: 'Recording the answer before the outcome…',
      html: answer('Yes, with three terms.', ['A daily instant limit per merchant.', 'Notice from Partner N before very large redemptions.', 'A morning redemption from the reserve fund.'], [['The rules', 'Pass'], ['The past', 'Pass, 78 of 78 weeks'], ['The futures', '100%, fast adoption'], ['Extra cash', '$1.2B → $0.4B'], ['The outcome', 'Pending']], 'Recorded Nov 6 · before outcome · model v15'),
    },
  ],
  optimize: [
    {
      sec: 'decision',
      status: 'Treasury asked a question…',
      html: `<div class="wk-q"><p class="wk-q__k">Decision · Optimize</p><h4>How much cash should we keep at each bank next week?</h4><p class="wk-q__g">Goal: every redemption paid within minutes, with the least cash idle. May change: cash by bank, timing.</p></div>`,
    },
    { sec: 'replay', status: 'Replaying 78 weeks under each plan…', html: `<div class="wk-chart" data-chart="idle"></div>` },
    {
      sec: 'replay',
      words: true,
      html: `<p>Today’s plan left $2.1B idle on an average day. Replayed with $0.6B less at three slower banks, every redemption is still paid within minutes in all 78 weeks.</p>`,
    },
    {
      sec: 'futures',
      status: 'Running 1,000 futures for next week…',
      html: bars([
        ['Redemptions rise 30%', 100, 99, 100, 100, 99, 100],
        ['The largest partner redeems at once', 100, 98, 100, 100, 98, 100],
        ['Bank C closes early', 100, 99, 100, 99, 97, 100],
        ['Rates move a point', 100, 99, 100, 100, 99, 100],
      ], 'Current plan', 'Optimized'),
    },
    {
      sec: 'search',
      status: 'Trying cash by bank…',
      html: `<p class="wk-lead">200 plans tried. The best holds $0.6B less.</p>${rowsT(['Bank', 'Today', 'Next week'], [[e('Bank E'), '$0.9B', '$0.65B'], [e('Bank F'), '$0.8B', '$0.6B'], [e('Bank G'), '$0.6B', '$0.45B'], ['Instant banks A–D', '$1.2B', '$1.2B']], 'wk-t--terms')}`,
    },
    {
      sec: 'answer',
      status: 'Recording the answer before the outcome…',
      html: answer('Hold $0.6B less at banks next week.', ['Draw it from banks E, F and G.', 'Keep the instant banks at today’s balances.', 'Move it back if redemptions rise more than 30%.'], [['The rules', 'Pass'], ['The past', 'Pass, 78 of 78 weeks'], ['The futures', '100%, median'], ['Idle cash', '$2.1B → $1.5B'], ['The outcome', 'Pending']], 'Recorded Nov 13 · before outcome · model v15'),
    },
  ],
  coordinate: [
    {
      sec: 'decision',
      status: 'Treasury and Exchange E asked a question…',
      html: `<div class="wk-q"><p class="wk-q__k">Decision · Coordinate</p><h4>Which terms with ${e('Exchange E')} grow balances that stay?</h4><p class="wk-q__g">Goal: more long-held balances, at the same cost. May change: the terms between us. Exchange E runs its own machine; only terms and scores pass between them.</p></div>`,
    },
    {
      sec: 'replay',
      status: 'Each machine replays its own past…',
      html: `<div class="wk-fit"><p><b>1.7%</b><span>our machine, 78 weeks</span></p><p><b>Within 2%</b><span>E’s machine, reported by E</span></p><p><b>None</b><span>data shared between them</span></p></div>`,
    },
    {
      sec: 'futures',
      status: 'Running the same 1,000 futures in both machines…',
      words: true,
      html: `<p>Under current terms, long-held balances on Exchange E stay near $9.0B (8.4–9.6) over two years. Under E’s proposal they rise to $9.3B, and our income falls $38M a year.</p>`,
    },
    {
      sec: 'search',
      status: 'Trying terms in both machines…',
      html: `<p class="wk-lead">48 term sets tried. One leaves both sides better off.</p>${rowsT(['Terms', 'Long-held balances', 'Our income', 'E’s revenue'], [['Current terms', '$9.0B', '—', '—'], ['E’s proposal', '$9.3B', '−$38M', '+$38M'], ['Found by both machines', '$11.4B', '+$9M', '+$12M']], 'wk-t--win')}`,
    },
    {
      sec: 'answer',
      status: 'Recording the answer before the outcome…',
      html: answer('Terms both machines accept.', ['E’s share rises the longer balances stay.', 'It falls on balances that leave within a month.', 'The shares reset if reserve yields move sharply.'], [['The rules', 'Pass, both sides'], ['The past', 'Pass'], ['The futures', 'Both gain, median'], ['The outcome', 'Pending']], 'Recorded Nov 12 · before outcome · model v15 · E’s model v7'),
    },
  ],
};

/* ------------------------------------------------------------- small charts */

const rng = (seed: number) => (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function series(seed: number, base: number, amp: number, trend: number): number[] {
  const r = rng(seed);
  return Array.from({ length: 78 }, (_, i) => base + trend * i + amp * Math.sin(i / 6.3) + amp * 0.5 * Math.sin(i / 2.1 + 1) + (r() - 0.5) * amp * 0.8);
}

function chart(host: HTMLElement, kind: string): void {
  const w = Math.max(240, host.clientWidth);
  const h = 120;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  const add = (tag: string, a: Record<string, string | number>): void => {
    const n = document.createElementNS(NS, tag);
    for (const k in a) n.setAttribute(k, String(a[k]));
    svg.appendChild(n);
  };
  const X = (i: number) => (i / 77) * w;
  let legend = '';
  if (kind === 'replay') {
    const r = rng(23);
    const v = series(11, 430, 46, 1.1).map((x, i) => x * (1.22 + 0.1 * Math.sin(i / 3.7) + (r() - 0.5) * 0.12));
    const lim = [...v].sort((a, b) => b - a).slice(6, 8).reduce((a, b) => a + b) / 2;
    const Y = (x: number) => 8 + (1 - (x - 380) / 420) * (h - 16);
    v.forEach((x, i) => {
      if (x > lim) add('rect', { x: X(i) - 3, y: 0, width: 6, height: h, fill: 'rgba(194,65,12,0.12)' });
    });
    add('line', { x1: 0, x2: w, y1: Y(lim), y2: Y(lim), stroke: '#141210', 'stroke-dasharray': '3 3', 'stroke-width': 1 });
    add('path', { d: v.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x).toFixed(1)}`).join(''), fill: 'none', stroke: '#141210', 'stroke-width': 1.5 });
    legend = `<span><i class="ln"></i>Bank B, peak day each week, with Partner N</span><span><i class="ds"></i>Same-day limit $${Math.round(lim)}M</span><span><i class="sh"></i>Falls short</span>`;
  } else {
    const now = series(31, 2.1, 0.09, 0);
    const opt = now.map((x, i) => x - 0.6 + 0.03 * Math.sin(i / 2.7));
    const Y = (x: number) => 8 + (1 - (x - 1.2) / 1.2) * (h - 16);
    add('path', { d: now.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x).toFixed(1)}`).join(''), fill: 'none', stroke: '#bdb7ac', 'stroke-width': 2 });
    add('path', { d: opt.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x).toFixed(1)}`).join(''), fill: 'none', stroke: '#f39200', 'stroke-width': 2 });
    legend = `<span><i class="gy"></i>Idle cash, current plan</span><span><i class="or"></i>Optimized plan</span>`;
  }
  host.replaceChildren(svg);
  const lg = document.createElement('p');
  lg.className = 'wk-chart__lg';
  lg.innerHTML = legend;
  const ax = document.createElement('p');
  ax.className = 'wk-chart__ax';
  ax.innerHTML = '<span>May 2025</span><span>Nov 2025</span><span>May 2026</span><span>Nov 2026</span>';
  host.prepend(lg);
  host.append(ax);
}

/* --------------------------------------------------------------------- init */

const WORD_MS = 28;

export function initRun(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const pane = root.querySelector<HTMLElement>('[data-pane]');
  const nav = root.querySelector<HTMLElement>('[data-nav]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-pause]');
  const replayBtn = root.querySelector<HTMLButtonElement>('[data-replay]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  if (!pane || !nav || !status) return;

  nav.innerHTML = SECTIONS.map(([id, label, sub]) => `<button type="button" class="wk-nav${sub ? ' wk-nav--sub' : ''}" data-sec="${id}" disabled>${label}</button>`).join('');
  const navBtns = Array.from(nav.querySelectorAll<HTMLButtonElement>('[data-sec]'));

  let kind: Kind = 'discover';
  let script: Block[] = [];
  let at = 0;
  let timer = 0;
  let paused = false;
  let follow = true;
  let started = false;
  const secEls = new Map<string, HTMLElement>();

  const setNav = (current: string | null): void => {
    navBtns.forEach((b) => {
      const id = b.dataset['sec']!;
      const written = secEls.has(id);
      b.disabled = !written;
      b.classList.toggle('is-done', written);
      b.classList.toggle('is-on', id === current);
    });
  };

  const place = (blk: Block, animate: boolean): void => {
    const wrap = document.createElement('div');
    wrap.className = 'wk-b';
    wrap.innerHTML = blk.html;
    if (!secEls.has(blk.sec)) secEls.set(blk.sec, wrap);
    pane.append(wrap);
    wrap.querySelectorAll<HTMLElement>('[data-chart]').forEach((c) => chart(c, c.dataset['chart']!));
    if (!animate) return;
    if (blk.words) {
      const walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
      const texts: Text[] = [];
      while (walker.nextNode()) texts.push(walker.currentNode as Text);
      let n = 0;
      texts.forEach((t) => {
        const frag = document.createDocumentFragment();
        t.data.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.append(part);
          else {
            const s = document.createElement('span');
            s.className = 'wk-w';
            s.textContent = part;
            s.style.animationDelay = `${n++ * WORD_MS}ms`;
            frag.append(s);
          }
        });
        t.replaceWith(frag);
      });
    } else {
      wrap.classList.add('wk-in');
      wrap.querySelectorAll<HTMLElement>('tr, li, .wk-iv__r, .wk-fit p, .wk-chips span, dl div').forEach((p, i) => {
        p.classList.add('wk-r');
        p.style.animationDelay = `${120 + i * 110}ms`;
      });
    }
  };

  const duration = (blk: Block): number => {
    if (blk.words) return blk.html.replace(/<[^>]+>/g, '').split(/\s+/).length * WORD_MS + 600;
    const n = (blk.html.match(/<tr|<li|wk-iv__r|<p><b>|<span>/g) || []).length;
    return 700 + n * 110;
  };

  const scrollEnd = (): void => {
    if (follow) pane.scrollTo({ top: pane.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  };

  const finish = (): void => {
    status.textContent = '';
    status.classList.remove('is-on');
    if (pauseBtn) pauseBtn.hidden = true;
  };

  const step = (): void => {
    if (paused) return;
    if (at >= script.length) {
      finish();
      return;
    }
    const blk = script[at]!;
    const write = (): void => {
      place(blk, true);
      setNav(blk.sec);
      at += 1;
      scrollEnd();
      timer = window.setTimeout(step, duration(blk) + (blk.wait ?? 0));
    };
    if (blk.status) {
      status.textContent = blk.status;
      status.classList.add('is-on');
      timer = window.setTimeout(write, 900);
    } else write();
  };

  const fill = (n: number): void => {
    while (at < Math.min(n, script.length)) {
      place(script[at]!, false);
      at += 1;
    }
    setNav(script[at - 1]?.sec ?? null);
  };

  const run = (keepWorld: boolean): void => {
    window.clearTimeout(timer);
    pane.replaceChildren();
    secEls.clear();
    at = 0;
    follow = true;
    paused = false;
    script = [...WORLD, ...DECISIONS[kind]];
    if (pauseBtn) {
      pauseBtn.hidden = false;
      pauseBtn.textContent = 'Pause';
    }
    setNav(null);
    if (reduced) {
      fill(script.length);
      finish();
      return;
    }
    if (keepWorld) {
      fill(WORLD.length);
      pane.scrollTop = pane.scrollHeight;
    }
    step();
  };

  pauseBtn?.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (paused) window.clearTimeout(timer);
    else step();
  });
  replayBtn?.addEventListener('click', () => {
    started = true;
    run(false);
  });
  navBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const el = secEls.get(b.dataset['sec']!);
      if (!el) return;
      follow = false;
      pane.scrollTo({ top: el.offsetTop - 12, behavior: reduced ? 'auto' : 'smooth' });
      navBtns.forEach((x) => x.classList.toggle('is-on', x === b));
    }),
  );
  pane.addEventListener('wheel', () => (follow = false), { passive: true });
  pane.addEventListener('touchmove', () => (follow = false), { passive: true });

  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      const k = t.dataset['tab'] as Kind;
      if (k === kind && started) return;
      kind = k;
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
      });
      const fresh = !started;
      started = true;
      run(!fresh); // the world is modeled once; a new decision runs on it
    }),
  );
  root.querySelector('[role="tablist"]')?.addEventListener('keydown', (ev) => {
    const key = (ev as KeyboardEvent).key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
    const i = tabs.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const n = tabs[(i + (key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]!;
    n.focus();
    n.click();
    ev.preventDefault();
  });

  if (reduced) {
    started = true;
    run(false);
    return;
  }
  pane.replaceChildren();
  const win = root.querySelector('.wk__win');
  if (!win) return;
  const io = new IntersectionObserver(
    (es) => {
      if (!started && es.some((x) => x.isIntersecting)) {
        started = true;
        io.disconnect();
        run(false);
      }
    },
    { threshold: 0.45 },
  );
  io.observe(win);
}
