/**
 * Where we start: World 01, programmable money.
 *
 * One pinned frame steps through five beats as the page scrolls: the world,
 * you inside it, the ask (the agent at work), the answer, and the record.
 * Left pane: the work, line by line. Right canvas: the world that work
 * touches. Role chips choose whose machine it is; the world stays the same.
 *
 * Every beat is complete as a still. Motion only adds: the clock runs in the
 * world beat, the trace streams at reading speed in the ask beat. Under
 * reduced motion, and on phones (stacked cards), every beat is shown at rest.
 *
 * The companies are samples. Counts of work and ranges are the only numbers.
 */
import { prefersReducedMotion } from '../lib/prefers';

type RoleId = 'pay' | 'exchange' | 'issuer' | 'bank' | 'lender';
type NodeId = 'issA' | 'issB' | 'exch' | 'pay' | 'lend' | 'bankA' | 'bankB' | 'bankC';
type Term = { change: string; why: string; must: string; who: string };
type Role = {
  name: string;
  node: NodeId;
  task: string;
  page: Array<[string, string]>;
  read: string;
  breaks: string;
  breaksWhy: string;
  tried: string;
  ask: string;
  answer: string;
  terms: Term[];
  range: string;
  changeIf: string;
  plans: Array<[string, string, string]>;
  rejected: Array<[string, string]>;
  short: string;
};

const ROLES: Record<RoleId, Role> = {
  pay: {
    name: 'Kestrel',
    node: 'pay',
    task: 'Keep weekend payouts instant through the holiday, without prefunding more.',
    page: [
      ['Manila payouts settle through Bank B, which closes at 5pm local.', 'agreement §4.1'],
      ['Weekend volume runs about twice a weekday’s, peaking Saturday night.', 'statements, Mar–Aug'],
      ['Bank C can fund same day on business days.', 'agreement §4.2'],
      ['Treasury prefunds Friday afternoon for the whole weekend.', 'treasury runbook'],
    ],
    read: 'Read 14 agreements and six months of statements',
    breaks: 'Breaks on long weekends',
    breaksWhy: 'Bank B closes before the US close',
    tried: 'Trying terms · 214 so far, 2 kept',
    ask: 'Clause 4.2 seems to allow Thursday funding at Bank C.',
    answer: 'Move Friday’s Manila prefunding to Thursday through Bank C, and ask Exchange E for a weekend standby line.',
    terms: [
      { change: 'Prefund Manila on Thursday through Bank C', why: 'Bank C is open a full day before Bank B closes', must: 'Clause 4.2 allows Thursday funding', who: 'Bank C' },
      { change: 'A weekend standby line from Exchange E', why: 'Covers the Sunday-night peak without idle cash', must: 'E agrees to a two-hour draw', who: 'Exchange E' },
    ],
    range: '$80–140M less prefunding (80% range)',
    changeIf: 'Bank C changes its cut-off, or weekend volume doubles again.',
    plans: [
      ['Today’s plan', 'Prefund Friday at Bank B for the whole weekend', 'Holds most weekends; short on long ones'],
      ['Best within today’s terms', 'Prefund more on Friday', '$60–110M more idle cash'],
      ['The machine’s terms', 'Thursday at Bank C, plus a standby line', '$80–140M less prefunding'],
    ],
    rejected: [
      ['Route all payouts through Bank A', 'breaks the 40% counterparty cap'],
      ['Draw on the issuer’s instant redemption', 'needs consent we don’t have'],
      ['Pause payouts on holiday Sundays', 'breaks the service promise'],
    ],
    short: 'Weekend payouts',
  },
  exchange: {
    name: 'Wren',
    node: 'exch',
    task: 'Offer instant withdrawals to the bank at any hour, without a bigger float.',
    page: [
      ['Withdrawals to banks settle through Bank C on business days.', 'agreement §3.4'],
      ['The float sits in digital dollars at Issuer A.', 'treasury policy'],
      ['Sunday nights carry a fifth of weekly withdrawals.', 'ledger, Mar–Aug'],
      ['Issuer A redeems on weekends through Bank A.', 'issuer terms §6'],
    ],
    read: 'Read 9 agreements and six months of withdrawals',
    breaks: 'Breaks on Sunday nights',
    breaksWhy: 'withdrawals outrun the float before Fedwire opens',
    tried: 'Trying terms · 186 so far, 2 kept',
    ask: 'Issuer A’s terms seem to allow weekend redemption through Bank A.',
    answer: 'Redeem with Issuer A on Saturday through Bank A, and keep part of the float in tokenized deposits at Bank C.',
    terms: [
      { change: 'Saturday redemption with Issuer A through Bank A', why: 'Refills the float before the Sunday peak', must: 'Weekend redemption is in Issuer A’s terms', who: 'Issuer A' },
      { change: 'Part of the float in tokenized deposits at Bank C', why: 'Moves at any hour and earns while it waits', must: 'Bank C settles deposits on weekends', who: 'Bank C' },
    ],
    range: '$40–70M smaller float (80% range)',
    changeIf: 'Issuer A narrows weekend redemption, or Sunday volume rises by half.',
    plans: [
      ['Today’s plan', 'One float, refilled on Monday', 'Short on some Sunday nights'],
      ['Best within today’s terms', 'A bigger float', '$30–60M more idle'],
      ['The machine’s terms', 'Saturday redemption, plus deposits at Bank C', '$40–70M smaller float'],
    ],
    rejected: [
      ['Delay withdrawals over $1M to Monday', 'breaks the withdrawal promise'],
      ['Borrow from the lender every weekend', 'costs more than the float saves'],
      ['Move the float to Issuer B', 'Issuer B has no weekend redemption'],
    ],
    short: 'Instant withdrawals',
  },
  issuer: {
    name: 'Linnet',
    node: 'issA',
    task: 'Offer instant redemption to a new partner, without holding more cash.',
    page: [
      ['Instant redemptions settle through Bank B and Bank A.', 'banking agreements'],
      ['The reserve sits in short T-bills, repo and cash at banks.', 'reserve report'],
      ['Redemptions peak on Friday afternoons after payroll.', 'ledger, Mar–Aug'],
      ['The partner’s draft asks for no limit and no notice.', 'partner draft v3'],
    ],
    read: 'Read 11 agreements and the reserve reports',
    breaks: 'Breaks after payroll Fridays',
    breaksWhy: 'Bank B carries most instant redemptions',
    tried: 'Trying terms · 312 so far, 3 kept',
    ask: 'The partner’s draft seems to allow a daily limit per merchant.',
    answer: 'Offer it with a daily limit per merchant, notice before very large redemptions, and a morning redemption from the reserve fund.',
    terms: [
      { change: 'A daily instant limit per merchant', why: 'Caps the Friday peak at Bank B', must: 'The partner accepts a limit', who: 'The partner' },
      { change: 'A morning redemption from the reserve fund', why: 'Puts cash at Bank B before the peak', must: 'The fund settles same day', who: 'The fund' },
    ],
    range: '$0.6–0.9B less cash at banks (80% range)',
    changeIf: 'The partner refuses a limit, or adoption is twice the forecast.',
    plans: [
      ['Today’s plan', 'Sign the draft as written', 'Short at Bank B on fast adoption'],
      ['Best within today’s terms', 'Hold more cash at Bank B', '$0.8–1.2B more cash'],
      ['The machine’s terms', 'A limit, notice and a morning redemption', '$0.6–0.9B less cash'],
    ],
    rejected: [
      ['Add a fifth instant bank', 'onboarding takes past launch'],
      ['Redeem the partner’s merchants next day', 'breaks the instant promise'],
      ['Move reserves to longer bills', 'breaks the reserve rules'],
    ],
    short: 'Instant redemption',
  },
  bank: {
    name: 'Bank C',
    node: 'bankC',
    task: 'Settle tokenized deposits on weekends with the least intraday liquidity.',
    page: [
      ['Tokenized deposits settle on weekends; wires do not.', 'deposit terms §2'],
      ['Two issuers and one exchange hold deposits here.', 'client list'],
      ['Holiday Mondays bring the largest net outflows.', 'ledger, 2 years'],
      ['T-bills may be pledged for a standby line.', 'collateral schedule'],
    ],
    read: 'Read 7 agreements and two years of flows',
    breaks: 'Breaks on holiday Mondays',
    breaksWhy: 'two issuers redeem on the same day',
    tried: 'Trying terms · 140 so far, 2 kept',
    ask: 'The collateral schedule seems to allow T-bills as weekend collateral.',
    answer: 'Hold a smaller buffer on Saturdays, and pledge T-bills for a standby line on holiday Mondays.',
    terms: [
      { change: 'A smaller Saturday buffer', why: 'Weekend outflows are small until Sunday night', must: 'No issuer redeems large on Saturday', who: 'Internal' },
      { change: 'A T-bill standby line on holiday Mondays', why: 'Covers two issuers redeeming at once', must: 'T-bills qualify as weekend collateral', who: 'Treasury' },
    ],
    range: '$120–200M less held idle (80% range)',
    changeIf: 'A third issuer joins, or holiday redemptions move to Saturday.',
    plans: [
      ['Today’s plan', 'One buffer, all weekend', 'Holds, with cash idle'],
      ['Best within today’s terms', 'A buffer sized by day', '$40–80M less idle'],
      ['The machine’s terms', 'Smaller Saturdays, a T-bill line on holidays', '$120–200M less idle'],
    ],
    rejected: [
      ['Stop weekend settlement on holidays', 'breaks the deposit terms'],
      ['Borrow overnight from Bank A', 'no weekend market'],
      ['Ask issuers for notice', 'notice only covers large redemptions'],
    ],
    short: 'Weekend settlement',
  },
  lender: {
    name: 'Plover',
    node: 'lend',
    task: 'Lend against a merchant’s digital-dollar receivables, at a rate that holds.',
    page: [
      ['The merchant is paid in digital dollars through Kestrel.', 'processor agreement'],
      ['Receivables can be swept daily to our account.', 'processor agreement §5'],
      ['Weekend sales are a third of the merchant’s week.', 'merchant statements'],
      ['Losses are taken when payouts stop for three days.', 'credit policy'],
    ],
    read: 'Read 6 agreements and a year of the merchant’s sales',
    breaks: 'Breaks on long weekends',
    breaksWhy: 'the merchant’s payouts slow while banks are closed',
    tried: 'Trying terms · 98 so far, 2 kept',
    ask: 'The processor agreement seems to allow sweeping receivables daily.',
    answer: 'Lend at 70% of receivables, swept daily, with the rate reset if weekend volume falls by a third.',
    terms: [
      { change: 'Lend at 70% of receivables', why: 'Holds through a long weekend’s slow payouts', must: 'Sales stay within last year’s range', who: 'The merchant' },
      { change: 'A daily sweep through Kestrel', why: 'Cash reaches us before banks close', must: 'Kestrel allows daily sweeps', who: 'Kestrel' },
    ],
    range: 'Loss 0.4–0.9% a year (80% range)',
    changeIf: 'The merchant changes processor, or weekend sales fall by a third.',
    plans: [
      ['Today’s plan', 'Decline: no history in digital dollars', 'No loan, no loss'],
      ['Best within today’s terms', 'Lend at 50%, swept weekly', 'Loss 1.1–2.0% a year'],
      ['The machine’s terms', '70%, swept daily, with a reset', 'Loss 0.4–0.9% a year'],
    ],
    rejected: [
      ['Lend at 90%', 'breaks on two long weekends a year'],
      ['Sweep only on business days', 'cash sits over weekends'],
      ['Take the merchant’s inventory as collateral', 'outside the credit policy'],
    ],
    short: 'Receivables line',
  },
};

const CAPTIONS: Array<[string, string]> = [
  ['The world.', 'Built once, from public flows, bank hours and the rules. Watch a long weekend.'],
  ['Your institution, inside it.', 'It reads your agreements and records, and writes down how you work. Every line points to its source.'],
  ['Ask a decision.', 'It replays the past, runs a thousand futures, finds where your plan breaks, and tries terms no one listed. When it isn’t sure, it asks.'],
  ['An answer you can act on.', 'The terms, why they hold, what must be true, and what would change the answer.'],
  ['Written down before the outcome.', 'Then scored, and the model learns from the score.'],
];

/* ------------------------------------------------------------------ the map */

const NODES: Record<NodeId, { x: number; y: number; label: string; bank?: boolean }> = {
  issA: { x: 170, y: 104, label: 'Issuer A' },
  issB: { x: 400, y: 104, label: 'Issuer B' },
  exch: { x: 630, y: 104, label: 'Exchange E' },
  pay: { x: 280, y: 262, label: 'Kestrel' },
  lend: { x: 560, y: 262, label: 'Lender' },
  bankA: { x: 170, y: 388, label: 'Bank A', bank: true },
  bankB: { x: 400, y: 388, label: 'Bank B', bank: true },
  bankC: { x: 630, y: 388, label: 'Bank C', bank: true },
};
const RAIL_Y = 180;
const FED_Y = 470;
const LINKS: Array<[NodeId, NodeId]> = [['pay', 'bankA'], ['pay', 'bankB'], ['pay', 'bankC'], ['lend', 'bankC'], ['lend', 'bankB']];
// When each bank stops sending (hours after Fri 15:00 ET) and starts again.
const CLOSE: Record<string, number> = { bankA: 3, bankB: 2, bankC: 4 };
const OPEN_H = 66; // Mon 09:00
const FED_CLOSE = 4; // Fri 19:00
const FED_OPEN = 54; // Sun 21:00

const W = 800;
const H = 590;

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function clockLabel(h: number): string {
  const days = ['Fri', 'Sat', 'Sun', 'Mon'];
  const t = 15 + h;
  const d = Math.floor(t / 24);
  const hh = Math.floor(t % 24);
  const mm = Math.floor((t * 60) % 60);
  return `${days[Math.min(d, 3)]} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ET`;
}

/** The shared world at hour h of a long weekend, for one role. */
function mapSVG(role: Role, h: number, opts: { lit?: string[]; futures?: boolean; compact?: boolean } = {}): string {
  const fs = opts.compact ? 19 : 13;
  const open = (b: string): boolean => h < CLOSE[b]! || h >= OPEN_H;
  const fedOpen = h < FED_CLOSE || h >= FED_OPEN;
  const banksClosed = ['bankA', 'bankB', 'bankC'].every((b) => !open(b));
  const lit = new Set(opts.lit ?? []);
  const label = (id: NodeId): string => (id === role.node ? `${id === 'pay' ? role.name : NODES[id].label} (you)` : NODES[id].label);
  let s = `<svg class="wd-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="The shared world: issuers, an exchange and payment companies on chains open at any hour; banks and Fedwire on their own hours. ${esc(clockLabel(h))}.">`;
  s += `<text x="24" y="34" class="t q" font-size="${fs}">Programmable money · the shared world</text>`;
  s += `<text x="${W - 24}" y="34" text-anchor="end" class="t b" font-size="${fs + 1}">${esc(clockLabel(h))}${banksClosed ? ' · banks closed' : ''}</text>`;
  // rails
  s += `<line x1="24" x2="${W - 24}" y1="${RAIL_Y}" y2="${RAIL_Y}" class="rail"/>`;
  if (!opts.compact) s += `<text x="24" y="${RAIL_Y + 22}" class="t q" font-size="${fs}">Chains · open at any hour</text>`;
  s += `<line x1="24" x2="${W - 24}" y1="${FED_Y}" y2="${FED_Y}" class="fed ${fedOpen ? 'is-open' : ''}"/>`;
  if (!opts.compact) s += `<text x="24" y="${FED_Y + 22}" class="t q" font-size="${fs}">Fedwire · ${fedOpen ? 'open' : 'closed, opens Sun 21:00 ET'}</text>`;
  // stems from chain participants to the rail
  (['issA', 'issB', 'exch'] as NodeId[]).forEach((id) => (s += `<line x1="${NODES[id].x}" x2="${NODES[id].x}" y1="${NODES[id].y + 16}" y2="${RAIL_Y}" class="ln"/>`));
  (['pay', 'lend'] as NodeId[]).forEach((id) => (s += `<line x1="${NODES[id].x}" x2="${NODES[id].x}" y1="${RAIL_Y}" y2="${NODES[id].y - 18}" class="ln"/>`));
  // bank links, dashed when that bank is closed
  LINKS.forEach(([a, b]) => {
    const A = NODES[a], B = NODES[b];
    s += `<line x1="${A.x}" y1="${A.y + 18}" x2="${B.x}" y2="${B.y - 18}" class="lk ${open(b) ? '' : 'is-closed'} ${lit.has(`${a}-${b}`) ? 'is-lit' : ''}"/>`;
  });
  (['bankA', 'bankB', 'bankC'] as NodeId[]).forEach((id) => (s += `<line x1="${NODES[id].x}" x2="${NODES[id].x}" y1="${NODES[id].y + 18}" y2="${FED_Y}" class="lk ${fedOpen ? '' : 'is-closed'}"/>`));
  // moving value: on the chain rail always; on bank links only while open
  for (let k = 0; k < 4; k++) s += `<circle r="3.5" class="mv" style="offset-path:path('M24 ${RAIL_Y}H${W - 24}');animation-delay:${-k * 1.6}s"/>`;
  // nodes
  (Object.keys(NODES) as NodeId[]).forEach((id) => {
    const n = NODES[id];
    const you = id === role.node;
    const closed = n.bank && !open(id);
    const r = you ? 17 : 14;
    s += `<g class="nd ${you ? 'is-you' : ''} ${closed ? 'is-closed' : ''} ${lit.has(id) ? 'is-lit' : ''}">`;
    s += n.bank ? `<rect x="${n.x - 16}" y="${n.y - 16}" width="32" height="32" rx="4"/>` : `<circle cx="${n.x}" cy="${n.y}" r="${r}"/>`;
    const ly = n.y < RAIL_Y ? n.y - 26 : n.y + 38;
    s += `<text x="${n.x}" y="${ly}" text-anchor="middle" class="t ${you ? 'b' : ''}" font-size="${fs}">${esc(label(id))}</text>`;
    if (n.bank && !opts.compact) s += `<text x="${n.x}" y="${n.y + 56}" text-anchor="middle" class="t q" font-size="${fs - 1}">${closed ? 'closed' : 'open'}</text>`;
    s += '</g>';
  });
  // a queue at the visitor's institution while banks are closed
  const q = Math.max(0, Math.min(4, Math.round(((h - 2) / 20) * 4)));
  if (q > 0 && banksClosed) {
    const n = NODES[role.node];
    for (let k = 0; k < q; k++) s += `<rect x="${n.x - 92 + k * 6}" y="${n.y - 14 + k * 9}" width="${44 - k * 6}" height="6" rx="2" class="qu"/>`;
    if (!opts.compact) s += `<text x="${n.x - 70}" y="${n.y + 34}" text-anchor="middle" class="t q" font-size="${fs - 1}">queue</text>`;
  }
  // futures
  if (opts.futures) {
    const y0 = 528;
    s += `<text x="24" y="${y0 - 6}" class="t q" font-size="${fs}">1,000 futures</text><text x="${W - 24}" y="${y0 - 6}" text-anchor="end" class="t b warn" font-size="${fs}">${esc(role.breaks.toLowerCase())}</text>`;
    let d = '', dw = '';
    let seed = 11;
    for (let i = 0; i < 1000; i++) {
      seed = (seed * 16807) % 2147483647;
      const x = 24 + (i / 999) * (W - 48);
      const bad = i >= 742 && i <= 812 && seed % 3 !== 0;
      const top = bad ? y0 + 4 : y0 + 18 + (seed % 14);
      (bad ? (dw += `M${x.toFixed(1)} ${y0 + 46}V${top}`) : (d += `M${x.toFixed(1)} ${y0 + 46}V${top}`));
    }
    s += `<path d="${d}" class="tk"/><path d="${dw}" class="tk tk--w"/>`;
  }
  return s + '</svg>';
}

/* ---------------------------------------------------------------- the beats */

function left(role: Role, beat: number): string {
  if (beat === 0)
    return `<p class="wl-k">Programmable money</p><p class="wl-big">One world, shared by every machine.</p>
      <p class="wl-p">Built from public flows, bank hours and the rules.</p>
      <ul class="wl-legend"><li><i class="lg-rail"></i>Chains, open at any hour</li><li><i class="lg-fed"></i>Banks and Fedwire, on their own hours</li><li><i class="lg-q"></i>Payouts waiting for banks to open</li><li><i class="lg-or"></i>What the machine changes</li></ul>`;
  if (beat === 1)
    return `<p class="wl-k">${esc(role.name)} · your machine</p>
      <ol class="wl-trace is-done"><li>${esc(role.read)}</li><li>Mapped your banks, hours and limits</li><li>Wrote down how you work, with sources</li></ol>
      <p class="wl-p">Change the role above to see another machine in the same world.</p>`;
  if (beat === 2)
    return `<p class="wl-k">Task · Treasury</p><p class="wl-task">${esc(role.task)}</p>
      <ol class="wl-trace" data-trace><li>${esc(role.read)}</li><li>Replayed the last 78 weekends; matches what happened, within the range shown</li><li>Ran 1,000 futures to Jan 4</li><li class="is-warn"><b>${esc(role.breaks)}:</b> ${esc(role.breaksWhy)}</li><li class="is-or">${esc(role.tried)}</li></ol>
      <div class="wl-askc" data-askc><p class="wl-k">Waiting on you</p><p>${esc(role.ask)} Can you confirm?</p><p class="wl-btns"><span class="wl-b wl-b--on">Confirm</span><span class="wl-b">Show clause</span></p></div>`;
  if (beat === 3)
    return `<p class="wl-k">Answer</p><p class="wl-big">Here’s what I’d do.</p><p class="wl-p wl-ink">${esc(role.answer)}</p>
      <p class="wl-range">${esc(role.range)}</p>
      <p class="wl-k">What would change this answer</p><p class="wl-p">${esc(role.changeIf)}</p>`;
  return `<p class="wl-k">The Record</p><p class="wl-big">Recorded before the outcome.</p>
    <p class="wl-stamp">Thu 4:12pm · v16 · <code>9f3c…a71e</code></p>
    <p class="wl-p">Scored after the weekend against what happened. A miss proposes a revision, kept only if it does better on past weekends and worse on none.</p>`;
}

function canvas(role: Role, beat: number, compact = false): string {
  if (beat === 0) return mapSVG(role, 11, { compact });
  if (beat === 1)
    return `<div class="wc-dim">${mapSVG(role, 11, { compact })}</div><div class="wc-page"><p class="wc-k">Written by the machine</p><h4>How ${esc(role.name)} works</h4><ul>${role.page
      .map(([t, src]) => `<li>${esc(t)} <span class="wc-src">${esc(src)}</span></li>`)
      .join('')}</ul></div>`;
  if (beat === 2) return mapSVG(role, 11, { futures: true, compact, lit: [role.node] });
  if (beat === 3)
    return `<div class="wc-ans"><div class="wc-plans">${role.plans
      .map(([h, d, c], k) => `<div class="${k === 2 ? 'is-or' : ''}"><p class="wc-k">${esc(h)}</p><p>${esc(d)}</p><p class="wc-cost">${esc(c)}</p></div>`)
      .join('')}</div>
      <table class="wc-terms"><thead><tr><th>Change</th><th>Why it holds</th><th>What must be true</th><th>Needs</th></tr></thead><tbody>${role.terms
        .map((t) => `<tr><td>${esc(t.change)}</td><td>${esc(t.why)}</td><td>${esc(t.must)}</td><td>${esc(t.who)}</td></tr>`)
        .join('')}</tbody></table>
      <p class="wc-k">${esc(role.tried.replace('Trying terms · ', '').replace(' so far', ' tried'))} · rejected, with reasons</p>
      <ul class="wc-rej">${role.rejected.map(([t, r]) => `<li><s>${esc(t)}</s> <span>${esc(r)}</span></li>`).join('')}</ul></div>`;
  return `<div class="wc-ledger"><p class="wc-k">The Record · ${esc(role.name)}</p><table><thead><tr><th>Task</th><th>Recorded</th><th>Expected</th><th>Outcome</th></tr></thead><tbody>
    <tr class="is-new"><td>${esc(role.short)}, holiday weekend</td><td>Thu 4:12pm</td><td>${esc(role.range.replace(/ \(80% range\)/, ''))}</td><td><span class="wc-pend" data-pend>Pending</span></td></tr>
    <tr><td>${esc(role.short)}, last weekend</td><td>Thu 3:50pm</td><td>Within range</td><td><span class="wc-ok">Scored · within range</span></td></tr>
    <tr><td>${esc(role.short)}, Labor Day</td><td>Thu 4:05pm</td><td>Within range</td><td><span class="wc-miss">Scored · missed</span></td></tr>
    <tr class="is-rev"><td colspan="4">Model revised → v16 after the Labor Day miss: Bank B’s holiday cut-off was an hour earlier. Kept: closer on 11 past weekends, worse on none.</td></tr>
    </tbody></table></div>`;
}

/* --------------------------------------------------------------------- init */

export function initRun(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const leftEl = root.querySelector<HTMLElement>('[data-left]');
  const canvasEl = root.querySelector<HTMLElement>('[data-canvas]');
  const capEl = root.querySelector<HTMLElement>('[data-cap]');
  const noteEl = root.querySelector<HTMLElement>('[data-note]');
  const cards = root.querySelector<HTMLElement>('[data-cards]');
  const fit = root.querySelector<HTMLElement>('[data-fit]');
  const track = root.closest<HTMLElement>('[data-wd-track]');
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-role]'));
  const steps = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-beat]'));
  if (!leftEl || !canvasEl || !capEl || !noteEl || !cards || !fit) return;

  const wide = window.matchMedia('(min-width: 768px)');
  const pin = window.matchMedia('(min-width: 1024px) and (min-height: 680px)');
  let roleId: RoleId = 'pay';
  let beat = 0;
  let clockRaf = 0;
  let traceTimer = 0;

  const note = (r: Role): string => `${r.name} is a sample ${r === ROLES.bank ? 'bank' : 'company'}, and its figures are examples. Fedwire’s hours are real.`;

  const stopMotion = (): void => {
    cancelAnimationFrame(clockRaf);
    window.clearTimeout(traceTimer);
  };

  /** Beat 1: the clock runs Friday afternoon to Monday morning, and loops. */
  const runClock = (): void => {
    const role = ROLES[roleId];
    const t0 = performance.now() + 600;
    let last = -1;
    const tick = (now: number): void => {
      if (now < t0) {
        clockRaf = requestAnimationFrame(tick);
        return;
      }
      canvasEl.classList.remove('is-in');
      const h = 11 + (((now - t0) / 9000) % 1) * (OPEN_H + 3 - 11);
      const step = Math.floor(h * 4) / 4;
      if (step !== last) {
        last = step;
        canvasEl.innerHTML = mapSVG(role, Math.min(step, OPEN_H + 1));
      }
      clockRaf = requestAnimationFrame(tick);
    };
    clockRaf = requestAnimationFrame(tick);
  };

  /** Beat 3: the trace streams at reading speed, then the ask appears. */
  const runTrace = (): void => {
    const items = Array.from(leftEl.querySelectorAll<HTMLElement>('[data-trace] li'));
    const askc = leftEl.querySelector<HTMLElement>('[data-askc]');
    items.forEach((li) => li.classList.add('is-wait'));
    askc?.classList.add('is-wait');
    let k = 0;
    const next = (): void => {
      if (k >= items.length) {
        askc?.classList.remove('is-wait');
        return;
      }
      const li = items[k]!;
      li.classList.remove('is-wait');
      li.classList.add('is-run');
      const ms = Math.max(700, ((li.textContent ?? '').length / 34) * 1000);
      traceTimer = window.setTimeout(() => {
        li.classList.remove('is-run');
        k += 1;
        next();
      }, ms);
    };
    next();
  };

  const runPending = (): void => {
    traceTimer = window.setTimeout(() => {
      const p = canvasEl.querySelector<HTMLElement>('[data-pend]');
      if (p) {
        p.textContent = 'Scored · within range';
        p.className = 'wc-ok';
      }
    }, 2600);
  };

  const paint = (animate: boolean): void => {
    stopMotion();
    const role = ROLES[roleId];
    root.dataset['beat'] = String(beat);
    leftEl.innerHTML = left(role, beat);
    canvasEl.innerHTML = canvas(role, beat);
    capEl.innerHTML = `<b>${esc(CAPTIONS[beat]![0])}</b> ${esc(CAPTIONS[beat]![1])}`;
    noteEl.textContent = note(role);
    steps.forEach((b, k) => {
      b.classList.toggle('is-on', k === beat);
      b.classList.toggle('is-done', k < beat);
      b.setAttribute('aria-current', k === beat ? 'step' : 'false');
    });
    canvasEl.classList.remove('is-in');
    void canvasEl.offsetWidth;
    canvasEl.classList.add('is-in');
    if (!animate || reduced) return;
    if (beat === 0) runClock();
    if (beat === 2) runTrace();
    if (beat === 4) runPending();
  };

  /** Phones: five still cards. */
  const paintCards = (): void => {
    const role = ROLES[roleId];
    const chipRow = `<div class="wd__roles wd__roles--m" role="tablist" aria-label="Whose machine">${chips
      .map((c) => `<button type="button" role="tab" data-mrole="${c.dataset['role']}" aria-selected="${c.dataset['role'] === roleId}">${esc(c.textContent ?? '')}</button>`)
      .join('')}</div>`;
    cards.innerHTML = chipRow + CAPTIONS.map(
      ([t, d], k) => `<article class="wd-card"><p class="wd-card__n">${String(k + 1).padStart(2, '0')} · ${esc(['World', 'You', 'Ask', 'Answer', 'Record'][k]!)}</p>
        <p class="wd-card__cap"><b>${esc(t)}</b> ${esc(d)}</p>
        <div class="wd-card__canvas">${canvas(role, k, true)}</div>
        <div class="wd-card__left">${left(role, k)}</div></article>`,
    ).join('') + `<p class="wd__note">${esc(note(role))}</p>`;
  };

  // Fit the frame to the screen: a fixed design size, scaled.
  const resize = (): void => {
    const frame = fit.firstElementChild as HTMLElement;
    const availW = fit.clientWidth;
    const availH = pin.matches ? window.innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64) - 40 : Infinity;
    const k = Math.min(1, availW / 1200, availH / 760);
    frame.style.transform = `scale(${k})`;
    fit.style.height = `${760 * k}px`;
  };

  const setRole = (id: RoleId): void => {
    roleId = id;
    chips.forEach((c) => {
      const on = c.dataset['role'] === id;
      c.setAttribute('aria-selected', String(on));
      c.tabIndex = on ? 0 : -1;
    });
    if (wide.matches) paint(true);
    else paintCards();
  };

  chips.forEach((c) => c.addEventListener('click', () => setRole(c.dataset['role'] as RoleId)));
  cards.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-mrole]');
    if (b) setRole(b.dataset['mrole'] as RoleId);
  });
  root.querySelector('.wd__roles')?.addEventListener('keydown', (ev) => {
    const key = (ev as KeyboardEvent).key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
    const i = chips.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const n = chips[(i + (key === 'ArrowRight' ? 1 : chips.length - 1)) % chips.length]!;
    n.focus();
    n.click();
    ev.preventDefault();
  });

  // Scroll drives the beat while pinned; the stepper moves the scroll.
  const beatFromScroll = (): number => {
    if (!track) return beat;
    const r = track.getBoundingClientRect();
    const run = Math.max(1, track.offsetHeight - window.innerHeight);
    const p = Math.min(0.999, Math.max(0, -r.top / run));
    return Math.floor(p * 5);
  };
  steps.forEach((b, k) =>
    b.addEventListener('click', () => {
      if (pin.matches && track) {
        const run = track.offsetHeight - window.innerHeight;
        const top = track.getBoundingClientRect().top + window.scrollY + run * ((k + 0.5) / 5);
        window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      } else {
        beat = k;
        paint(true);
      }
    }),
  );
  let onScreen = false;
  const onScroll = (): void => {
    if (!pin.matches || !wide.matches) return;
    const b = beatFromScroll();
    if (b !== beat) {
      beat = b;
      paint(onScreen);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const io = new IntersectionObserver((es) => {
    const vis = es.some((e) => e.isIntersecting);
    if (vis && !onScreen) {
      onScreen = true;
      if (wide.matches) paint(true);
    } else if (!vis && onScreen) {
      onScreen = false;
      stopMotion();
    }
  }, { threshold: 0.3 });
  io.observe(root);

  const layout = (): void => {
    root.classList.toggle('is-cards', !wide.matches);
    if (wide.matches) {
      resize();
      paint(onScreen);
    } else {
      stopMotion();
      paintCards();
    }
  };
  window.addEventListener('resize', layout);
  wide.addEventListener('change', layout);
  layout();
}
