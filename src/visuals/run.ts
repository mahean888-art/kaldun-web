/**
 * Where we start: the machine edits the terms.
 *
 * Treasury's draft of a partner agreement, open in the issuer's machine. The
 * draft shows first; then the machine adds its clauses as tracked changes,
 * each with a note in the margin; then the result holds, and it loops.
 * Other decisions in the sidebar open their own documents.
 * Under reduced motion the finished document is shown, still.
 */
import { prefersReducedMotion } from '../lib/prefers';

type Clause = { n: string; title: string; text: string; add?: boolean; note?: string };
type Doc = {
  crumb: string;
  title: string;
  meta: string;
  clauses: Clause[];
  recorded: string;
  res: Array<[string, string, string?]>; // label, value, "from" for a value that changes
};

const DOCS: Record<string, Doc> = {
  partner: {
    crumb: 'Partner N',
    title: 'Partner N — merchant redemption terms',
    meta: 'Treasury · draft 3 · Updated today',
    clauses: [
      { n: '4.1', title: 'Instant redemption.', text: 'Partner N’s merchants may redeem digital dollars for US dollars at any hour, settled within minutes.' },
      { n: '4.2', title: 'Daily limit.', text: 'Instant redemption is available up to $5M per merchant per day. Larger amounts settle the next business morning.', add: true, note: 'Without a daily limit, a busy Saturday empties weekend cash by early afternoon.' },
      { n: '4.3', title: 'Notice.', text: 'A single redemption above $25M requires twelve hours’ notice.', add: true, note: 'Redemptions this large already come with a day’s warning.' },
      { n: '5.1', title: 'Cash at banks.', text: 'The issuer keeps cash at partner banks to meet redemptions.' },
      { n: '5.2', title: 'Morning fund redemption.', text: 'Each morning, including weekends, the issuer redeems reserve-fund shares to cover the day’s expected redemptions.', add: true, note: 'The fund redeems seven days a week. The banks don’t.' },
    ],
    recorded: 'Nov 6',
    res: [['Cash held at banks', '$0.4B', '$1.2B'], ['Redemptions', 'paid at any hour']],
  },
  exchange: {
    crumb: 'Exchange E',
    title: 'Exchange E — distribution and reward terms',
    meta: 'Treasury · draft 2 · Updated yesterday',
    clauses: [
      { n: '3.1', title: 'Distribution.', text: 'Exchange E lists the issuer’s digital dollars and supports deposits and withdrawals at any hour.' },
      { n: '3.2', title: 'Reward share.', text: 'The issuer pays Exchange E a share of reserve income on balances held on the exchange.' },
      { n: '3.3', title: 'Held balances.', text: 'The reward share applies to balances held at least 30 days. Balances that leave sooner earn none.', add: true, note: 'Paying for balances that leave within a month buys nothing.' },
      { n: '3.4', title: 'Largest customers.', text: 'For customers holding more than $10M for 90 days, the share rises by a quarter.', add: true, note: 'A few large holders carry most of the balances that stay.' },
      { n: '3.5', title: 'Rate reset.', text: 'If the three-month Treasury rate moves more than half a point, both parties reset the share within ten business days.', add: true, note: 'Rates are falling. A fixed share would soon pay out more than the reserve earns.' },
    ],
    recorded: 'Nov 12',
    res: [['Balances held 30+ days', '$11.4B', '$9.0B'], ['Reward budget', 'unchanged']],
  },
  weekend: {
    crumb: 'Weekend cash',
    title: 'Weekend cash — December plan',
    meta: 'Treasury · draft 1 · Updated today',
    clauses: [
      { n: '1.1', title: 'Friday funding.', text: 'Treasury funds partner banks by 2 p.m. Friday for the weekend’s expected redemptions.' },
      { n: '1.2', title: 'Two chains, prefunded.', text: 'On Fridays at 3 p.m., the issuer prefunds redemption wallets on the two chains that carry most weekend volume.', add: true, note: 'Weekend redemptions gather on two chains. The other ten see little.' },
      { n: '1.3', title: 'Holiday weekends.', text: 'December 25 and January 1 are funded as three-day weekends.' },
      { n: '1.4', title: 'Standby line.', text: 'A standby bank line covers holiday redemptions above the prefunded amount.', add: true, note: 'Card networks now settle on holidays. The banks holding the cash do not.' },
    ],
    recorded: 'Nov 13',
    res: [['Cash idle over weekends', '$1.5B', '$2.1B'], ['Holiday redemptions', 'paid at any hour']],
  },
};

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function initRun(root: HTMLElement): void {
  const reduced = prefersReducedMotion();
  const body = root.querySelector<HTMLElement>('[data-doc-body]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const crumb = root.querySelector<HTMLElement>('[data-crumb]');
  const foot = root.querySelector<HTMLElement>('[data-foot]');
  const res = root.querySelector<HTMLElement>('[data-res]');
  const decs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-doc]'));
  if (!body || !status || !crumb || !foot || !res) return;

  let id = 'partner';
  let timers: number[] = [];
  let visible = false;
  const at = (ms: number, f: () => void): void => {
    timers.push(window.setTimeout(f, ms));
  };
  const clear = (): void => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const setStatus = (text: string, cls: string): void => {
    status.className = `tm__status ${cls}`;
    status.textContent = text;
  };

  const render = (): void => {
    const d = DOCS[id]!;
    crumb.textContent = d.crumb;
    body.innerHTML = `<h3 class="tm__title">${esc(d.title)}</h3><p class="tm__meta"><span class="tm__av">TR</span>${esc(d.meta)}</p>
      <ol class="tm__cl">${d.clauses
        .map(
          (c) => `<li class="tm__c${c.add ? ' is-add' : ''}"><div class="tm__cin"><div class="tm__hl"><span class="tm__n">${c.n}</span><p class="tm__t"><b>${esc(c.title)}</b> ${esc(c.text)}</p></div>${
            c.note ? `<aside class="tm__note"><span class="tm__by"><i></i><i></i>Foresight Machine</span>${esc(c.note)}</aside>` : ''
          }</div></li>`,
        )
        .join('')}</ol>`;
    res.innerHTML = d.res
      .map(([k, v, from]) => `<div><dt>${esc(k)}</dt><dd>${from ? `${esc(from)} → <b data-count="${esc(v)}" data-from="${esc(from)}">${esc(v)}</b>` : esc(v)}</dd></div>`)
      .join('');
  };

  /** Count the changing figure once, from its old value to its new one. */
  const count = (): void => {
    res.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const to = el.dataset['count']!;
      const from = el.dataset['from']!;
      const m = /^\$([\d.]+)B$/.exec(to);
      const f = /^\$([\d.]+)B$/.exec(from);
      if (!m || !f) return;
      const a = parseFloat(f[1]!), b = parseFloat(m[1]!);
      const t0 = performance.now();
      const step = (now: number): void => {
        const p = Math.min(1, (now - t0) / 700);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = `$${(a + (b - a) * e).toFixed(1)}B`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  const finished = (): void => {
    const d = DOCS[id]!;
    const n = d.clauses.filter((c) => c.add).length;
    root.classList.add('is-done');
    body.querySelectorAll('.tm__c.is-add').forEach((c) => c.classList.add('is-on'));
    foot.classList.add('is-on');
    setStatus(`${n} changes from Foresight Machine · recorded ${d.recorded}`, 'is-done');
  };

  const play = (): void => {
    clear();
    render();
    // Hold the document at its finished height, so nothing below it moves.
    body.style.minHeight = '';
    root.classList.add('is-done');
    body.style.minHeight = `${body.offsetHeight}px`;
    root.classList.remove('is-done');
    foot.classList.remove('is-on');
    if (reduced) {
      finished();
      return;
    }
    setStatus('Draft · shared with Foresight Machine', 'is-draft');
    const added = Array.from(body.querySelectorAll<HTMLElement>('.tm__c.is-add'));
    at(2000, () => setStatus('Foresight Machine is reviewing', 'is-run'));
    added.forEach((c, k) => at(2600 + k * 800, () => c.classList.add('is-on')));
    const end = 2600 + added.length * 800 + 900;
    at(end, () => {
      finished();
      count();
    });
    at(end + 5000, () => {
      if (visible) play();
    });
  };

  decs.forEach((b) =>
    b.addEventListener('click', () => {
      id = b.dataset['doc']!;
      body.style.minHeight = '';
      decs.forEach((x) => {
        const on = x === b;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', String(on));
      });
      play();
    }),
  );

  // Draw the finished state first, so the page is complete at rest; play when seen.
  render();
  finished();
  const io = new IntersectionObserver(
    (es) => {
      const v = es.some((e) => e.isIntersecting);
      if (v && !visible) {
        visible = true;
        play();
      } else if (!v && visible) {
        visible = false;
        clear();
        finished();
      }
    },
    { threshold: 0.35 },
  );
  io.observe(root.querySelector('.tm__win')!);
}
