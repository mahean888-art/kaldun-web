/**
 * Where we start: one decision, run on one living map.
 *
 * The issuer's world stays on screen the whole time: the reserve, the four
 * instant banks, its partners and Partner N. Each of the six steps changes the
 * same picture, and the inspector beside it carries one measure throughout:
 * the share of time the promise holds (in the past, in the futures, then with
 * the terms the machine found).
 *
 * The visitor moves through the steps: click a step, or Back and Next, or the
 * arrow keys. Nothing plays by itself.
 */
import { prefersReducedMotion } from '../lib/prefers';

const NS = 'http://www.w3.org/2000/svg';
const LAST = 5;

/* ------------------------------------------------------------------ helpers */

const sv = (tag: string, a: Record<string, string | number>, parent: Element): SVGElement => {
  const e = document.createElementNS(NS, tag);
  for (const k in a) e.setAttribute(k, String(a[k]));
  parent.appendChild(e);
  return e;
};
/** Text in the map; `font` is mono unless said otherwise. */
const tx = (p: Element, x: number, y: number, s: string, o: Record<string, string | number> = {}, sans = false): SVGElement => {
  const t = sv('text', { x, y, class: sans ? 'lm-t lm-t--sans' : 'lm-t', ...o }, p);
  t.textContent = s;
  return t;
};
/** A group shown only in some steps (`show`), dimmed in some (`dim`), strained in some (`hot`). */
const grp = (p: Element, show = '0-5', extra: Record<string, string> = {}): SVGElement => sv('g', { 'data-show': show, ...extra }, p);
const inRange = (r: string | null, i: number): boolean =>
  !!r && r.split(',').some((part) => {
    const [a, b] = part.split('-').map(Number);
    return i >= a! && i <= (b ?? a)!;
  });
const band = (xa: number, ya: number, ha: number, xb: number, yb: number, hb: number): string => {
  const m = (xa + xb) / 2;
  return `M${xa} ${ya}C${m} ${ya} ${m} ${yb} ${xb} ${yb}L${xb} ${yb + hb}C${m} ${yb + hb} ${m} ${ya + ha} ${xa} ${ya + ha}Z`;
};

/* --------------------------------------------------------------------- map */

const BANKS: Array<[string, number]> = [['Bank B', 58], ['Bank A', 19], ['Bank C', 14], ['Bank D', 9]];

function drawMap(w: number): SVGSVGElement {
  const narrow = w < 560;
  const h = narrow ? 300 : 380;
  const svg = document.createElementNS(NS, 'svg') as SVGSVGElement;
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const T = narrow ? 46 : 64, B = narrow ? 52 : 60;
  const H = h - T - B;
  const x0 = narrow ? 18 : Math.round(w * 0.17);
  const x1 = Math.round(w * (narrow ? 0.46 : 0.5));
  const x2 = narrow ? w - 18 : Math.round(w * 0.83);
  const gap = 10;
  const tot = H - gap * (BANKS.length - 1);
  const nodeH = H * 0.5;
  const n0 = T + (H - nodeH) / 2;

  // The world: flows reserve → banks → partners.
  const world = grp(svg, '0-5', { 'data-dim': '0' });
  let y = T, ys = n0;
  const bankY: number[] = [], bankH: number[] = [];
  BANKS.forEach(([, sh], k) => {
    const bh = (sh / 100) * tot, eh = (sh / 100) * nodeH;
    const fill = k === 0 ? 'rgba(20,18,16,0.13)' : 'rgba(20,18,16,0.06)';
    sv('path', { d: band(x0, ys, eh, x1 - 6, y, bh), fill }, world);
    sv('path', { d: band(x1 + 6, y, bh, x2, ys, eh), fill }, world);
    bankY.push(y);
    bankH.push(bh);
    y += bh + gap;
    ys += eh;
  });
  // Bank bars and labels.
  BANKS.forEach(([name, sh], k) => {
    const g = grp(world, '0-5');
    sv('rect', { x: x1 - 6, y: bankY[k]!, width: 12, height: bankH[k]!, rx: 2, class: k === 0 ? 'lm-bank lm-bank--b' : 'lm-bank', 'data-hot': k === 0 ? '2-3' : '' }, g);
    if (!narrow || k === 0) tx(g, x1 + 16, bankY[k]! + Math.min(bankH[k]! / 2, 16) + 4, `${name} · ${sh}%`, { class: 'lm-t lm-t--ink' });
  });
  // Reserve and partners.
  sv('rect', { x: x0 - 4, y: n0, width: 4, height: nodeH, class: 'lm-node' }, world);
  sv('rect', { x: x2, y: n0, width: 4, height: nodeH, class: 'lm-node' }, world);
  if (narrow) {
    tx(world, x0 - 4, n0 - 10, 'Reserve', {}, true).setAttribute('class', 'lm-t lm-t--sans lm-t--ink');
    tx(world, x2 + 4, n0 - 10, 'Partners', { 'text-anchor': 'end' }, true).setAttribute('class', 'lm-t lm-t--sans lm-t--ink');
  } else {
    tx(world, x0 - 14, n0 + nodeH / 2 - 3, 'Reserve fund', { 'text-anchor': 'end', class: 'lm-t lm-t--sans lm-t--ink' }, true);
    tx(world, x0 - 14, n0 + nodeH / 2 + 15, 'and bank cash', { 'text-anchor': 'end', class: 'lm-t lm-t--sans' }, true);
    tx(world, x2 + 14, n0 + nodeH / 2 - 3, '140 partners', { class: 'lm-t lm-t--sans lm-t--ink' }, true);
    tx(world, x2 + 14, n0 + nodeH / 2 + 15, 'and their merchants', { class: 'lm-t lm-t--sans' }, true);
  }

  // Step 2: the model's layers, named on the map.
  const layers = grp(svg, '1-5');
  if (!narrow) {
    tx(layers, x0, 22, 'THE ISSUER · ITS OWN', { 'text-anchor': 'middle', class: 'lm-t lm-t--cap' });
    tx(layers, x1, 22, 'THE WORLD · SHARED', { 'text-anchor': 'middle', class: 'lm-t lm-t--cap' });
    tx(layers, x2, 22, 'POLICY · OCC RULE, LIMITS', { 'text-anchor': 'middle', class: 'lm-t lm-t--cap' });
  }
  // Bank B's same-day limit.
  const yB = bankY[0]!, hB = bankH[0]!;
  const lim = grp(svg, '1-5');
  sv('line', { x1: x1 - 16, x2: x1 + 16, y1: yB + hB * 0.28, y2: yB + hB * 0.28, class: 'lm-limit' }, lim);
  if (!narrow) tx(lim, x1 - 22, yB + hB * 0.28 + 4, 'same-day limit $657M', { 'text-anchor': 'end', class: 'lm-t' });

  // Partner N: a draft at first, then a flow into bank B.
  const yN = h - B + (narrow ? 18 : 22);
  const nIn = yB + hB * 0.45;
  const pn = grp(svg, '0-5');
  sv('circle', { cx: x2 + 2, cy: yN, r: 5, class: 'lm-n' }, pn);
  const pnl = { class: 'lm-t lm-t--sans lm-t--or', 'text-anchor': narrow ? 'end' : 'start' };
  tx(grp(pn, '0-3'), narrow ? x2 - 8 : x2 + 14, yN + 4, narrow ? 'Partner N' : 'Partner N · draft', pnl, true);
  tx(grp(pn, '4-5'), narrow ? x2 - 8 : x2 + 14, yN + 4, 'Partner N', pnl, true);
  // Futures: the flow at four adoption speeds.
  const fut = grp(svg, '3');
  [5, 11, 19, 28].forEach((bw) => sv('path', { d: band(x2, yN - bw / 2, bw, x1 + 6, nIn - bw / 2, bw), class: 'lm-ghost' }, fut));
  // The flow itself.
  const flow = grp(svg, '2-5');
  sv('path', { d: band(x2, yN - 7, 14, x1 + 6, nIn - 7, 14), class: 'lm-flow' }, flow);

  // Strain labels on bank B.
  const sx = narrow ? x1 : x1 - 16, sy = narrow ? h - 8 : yB + hB - 12, an = { 'text-anchor': narrow ? 'middle' : 'end' };
  tx(grp(svg, '2'), sx, sy, narrow ? '7 of 78 weeks short' : 'short in 7 of 78 weeks', { ...an, class: 'lm-t lm-t--hot' });
  tx(grp(svg, '3'), sx, sy, narrow ? 'strains in 5 months' : 'strains within five months', { ...an, class: 'lm-t lm-t--hot' });
  tx(grp(svg, '4-5'), sx, sy, narrow ? 'holds' : 'holds in every future', { ...an, class: 'lm-t lm-t--ok' });

  // Step 5: the three terms, placed where they act.
  const terms = grp(svg, '4-5');
  // 1 · a daily limit per merchant, on Partner N's flow.
  const gx = x1 + (x2 - x1) * 0.62;
  const gy = yN + (nIn - yN) * 0.72;
  sv('line', { x1: gx, x2: gx, y1: gy - 18, y2: gy + 18, class: 'lm-term' }, terms);
  sv('circle', { cx: gx, cy: gy - 24, r: 9, class: 'lm-badge' }, terms);
  tx(terms, gx, gy - 20, '1', { 'text-anchor': 'middle', class: 'lm-t lm-t--badge' });
  // 2 · notice before very large redemptions, at Partner N.
  const nx = narrow ? x2 - 90 : x2 - 40;
  sv('circle', { cx: nx, cy: yN, r: 9, class: 'lm-badge' }, terms);
  tx(terms, nx, yN + 4, '2', { 'text-anchor': 'middle', class: 'lm-t lm-t--badge' });
  // 3 · a morning redemption from the fund into bank B.
  const my = T - 22;
  sv('path', { d: `M${x0} ${n0 + 4}C${(x0 + x1) / 2} ${n0 + 4} ${(x0 + x1) / 2} ${my} ${x1 - 6} ${yB + 3}`, class: 'lm-morning' }, terms);
  const mx = x0 + (x1 - x0) * (narrow ? 0.55 : 0.22);
  const myy = n0 + 4 + (my - n0) * (narrow ? 0.75 : 0.18);
  sv('circle', { cx: mx, cy: myy, r: 9, class: 'lm-badge' }, terms);
  tx(terms, mx, myy + 4, '3', { 'text-anchor': 'middle', class: 'lm-t lm-t--badge' });

  return svg;
}

/* --------------------------------------------------------------- inspector */

const PH = '<span class="lm-i__ph">—</span>';
const big = (v: string, sub: string, cls = ''): string =>
  `<p class="lm-i__k">Promise holds</p><p class="lm-i__big ${cls}">${v}</p><p class="lm-i__bs">${sub}</p>`;
const rows = (xs: Array<[string, string, string?]>): string =>
  `<dl class="lm-i__rows">${xs.map(([a, b, c]) => `<div${c ? ` class="${c}"` : ''}><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>`;
const bar = (label: string, m: number, lo: number, hi: number, strong = false): string => {
  const X = (v: number) => ((v - 60) / 40) * 100;
  return `<div class="lm-iv${strong ? ' is-on' : ''}"><span>${label}</span><i><b style="left:${X(lo)}%;width:${X(hi) - X(lo)}%"></b><em style="left:${X(m)}%"></em></i><span>${m}%</span></div>`;
};

const INSPECT: string[] = [
  `${big(PH, 'Not yet run')}
   ${rows([['Goal', 'Every redemption paid within minutes, at any hour'], ['May change', 'Reserve mix, cash by bank, timing, partner limits and terms'], ['Must hold', 'Reserve policy, OCC rule, service promises']])}`,
  `${big(PH, 'Not yet run')}
   ${rows([['Model', 'v15, updated 2 hours ago'], ['The world', '25 banks and their settlement windows, rates, chains'], ['The issuer', 'Reserve fund, cash by bank, 140 agreements'], ['Unknown', 'How Partner N’s merchants will redeem. Estimated from two similar partners.', 'is-unk']])}`,
  `${big('91%', 'of the last 78 weeks, with Partner N included', 'is-warn')}
   ${rows([['Fell short', '7 weeks, all at bank B'], ['Replay error', '1.8% against what happened'], ['Bank B carries', '58% of instant redemptions']])}`,
  `${big('73%', 'of 1,000 futures, if adoption is fast', 'is-warn')}
   <div class="lm-ivs"><p class="lm-i__k">By condition · 90% range</p>
   ${bar('Adoption is slow', 96, 93, 98)}${bar('Adoption is fast', 73, 66, 79, true)}${bar('Partner N doubles', 81, 75, 86)}${bar('A bank leaves', 88, 83, 92)}</div>`,
  `${big('100%', 'of 1,000 futures, fast adoption, with three terms', 'is-ok')}
   <ol class="lm-i__terms">
     <li><span>1</span>A daily instant limit per merchant<em>without it 84%</em></li>
     <li><span>2</span>Notice before very large redemptions<em>without it 93%</em></li>
     <li><span>3</span>A morning redemption from the fund<em>without it 89%</em></li>
   </ol>
   ${rows([['Tried', '312 arrangements · extra cash $1.2B → $0.4B']])}`,
  `<p class="lm-i__k">Answer</p><p class="lm-i__ans">Yes, with three terms.</p>
   ${rows([['The rules', 'Pass'], ['The past', 'Pass, all 78 weeks'], ['The futures', '100%, fast adoption'], ['The outcome', 'Pending', 'is-pend']])}
   <p class="lm-i__stamp">Recorded Nov 6 · before outcome · model v15</p>`,
];

/** The measure across the run, filled in as it is learned. */
const trail = (i: number): string => {
  const cells: Array<[string, string, number]> = [['Past', '91%', 2], ['Futures', '73%', 3], ['Found', '100%', 4]];
  return `<div class="lm-trail">${cells.map(([k, v, at]) => `<p class="${i >= at ? 'is-on' : ''}${i === at ? ' is-now' : ''}"><span>${k}</span><b>${i >= at ? v : '—'}</b></p>`).join('')}</div>`;
};

/* --------------------------------------------------------------------- init */

export function initRun(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const host = root.querySelector<HTMLElement>('[data-map]');
  const insp = root.querySelector<HTMLElement>('[data-insp]');
  const rail = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-go]'));
  const caps = Array.from(root.querySelectorAll<HTMLElement>('[data-cap]'));
  const n = root.querySelector<HTMLElement>('[data-n]');
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  if (!host || !insp) return;
  if (reduced) root.classList.add('is-still');
  let step = 0;

  const paintMap = (): void => {
    host.querySelectorAll<SVGElement>('[data-show]').forEach((g) => g.classList.toggle('is-off', !inRange(g.getAttribute('data-show'), step)));
    host.querySelectorAll<SVGElement>('[data-dim]').forEach((g) => g.classList.toggle('is-dim', inRange(g.getAttribute('data-dim'), step)));
    host.querySelectorAll<SVGElement>('[data-hot]').forEach((g) => g.classList.toggle('is-hot', inRange(g.getAttribute('data-hot'), step)));
  };

  const go = (i: number): void => {
    step = Math.max(0, Math.min(LAST, i));
    root.dataset['step'] = String(step);
    rail.forEach((b, k) => {
      b.classList.toggle('is-on', k === step);
      b.classList.toggle('is-done', k < step);
      b.setAttribute('aria-current', k === step ? 'step' : 'false');
    });
    caps.forEach((c, k) => (c.hidden = k !== step));
    if (n) n.textContent = String(step + 1).padStart(2, '0');
    if (prev) prev.disabled = step === 0;
    if (next) next.textContent = step === LAST ? 'Start again ↺' : 'Next ›';
    insp.innerHTML = `<div class="lm-i">${INSPECT[step]}${trail(step)}</div>`;
    paintMap();
  };

  // Draw the map at its real width; redraw when that changes.
  let lastW = -1;
  const draw = (): void => {
    const w = Math.floor(host.clientWidth);
    if (w <= 0 || w === lastW) return;
    lastW = w;
    host.replaceChildren(drawMap(w));
    paintMap();
  };
  new ResizeObserver(draw).observe(host);

  rail.forEach((b, k) => b.addEventListener('click', () => go(k)));
  prev?.addEventListener('click', () => go(step - 1));
  next?.addEventListener('click', () => go(step === LAST ? 0 : step + 1));
  root.querySelector('.lm__win')?.addEventListener('keydown', (ev) => {
    const k = (ev as KeyboardEvent).key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft') return;
    go(step + (k === 'ArrowRight' ? 1 : -1));
    ev.preventDefault();
  });

  draw();
  go(0);
}
