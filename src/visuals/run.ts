/**
 * Where we start: the world a machine models, and the questions asked of it.
 *
 * Programmable money as it stands, from public data: its size, who issues it,
 * where it lives, and what is moving. Beside it, the questions each kind of
 * institution would put to its own machine. Nothing here is a made-up result.
 * The window is a fixed design size, scaled to fit one screen.
 */
type Role = 'issuer' | 'bank' | 'exchange' | 'pay';

const QUESTIONS: Record<Role, string[]> = {
  issuer: [
    'How much reserve income can we share with distributors before it stops paying for itself?',
    'Which chains should hold our liquidity, and how much on each?',
    'What would it take to redeem instantly on a holiday weekend?',
  ],
  bank: [
    'Issue our own dollar, join the 2027 consortium, or offer tokenized deposits?',
    'How much liquidity do weekend redemptions need from us?',
    'Which issuers should we bank, and on what terms?',
  ],
  exchange: [
    'Which issuer’s reward terms keep balances on our platform?',
    'How large a float covers instant withdrawals at any hour?',
    'Which chain should we support next?',
  ],
  pay: [
    'Which dollar, on which chain, should we settle in?',
    'How much should we prefund for weekends and holidays?',
    'What terms do we need from our banks to pay out at any hour?',
  ],
};

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function initRun(root: HTMLElement): void {
  const qs = root.querySelector<HTMLElement>('[data-qs]');
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-role]'));
  const win = root.querySelector<HTMLElement>('.tm__win');
  const stage = root.querySelector<HTMLElement>('.tm__stage');
  if (!qs || !win || !stage) return;

  const show = (r: Role): void => {
    chips.forEach((c) => {
      const on = c.dataset['role'] === r;
      c.setAttribute('aria-selected', String(on));
      c.tabIndex = on ? 0 : -1;
    });
    qs.innerHTML = QUESTIONS[r].map((q, i) => `<li style="--i:${i}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(q)}</li>`).join('');
  };
  chips.forEach((c) => c.addEventListener('click', () => show(c.dataset['role'] as Role)));
  root.querySelector('.wv__roles')?.addEventListener('keydown', (ev) => {
    const key = (ev as KeyboardEvent).key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
    const i = chips.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const n = chips[(i + (key === 'ArrowRight' ? 1 : chips.length - 1)) % chips.length]!;
    n.focus();
    n.click();
    ev.preventDefault();
  });
  show('issuer');

  // Fit: full width, no taller than the screen allows.
  const wide = window.matchMedia('(min-width: 768px)');
  const fit = (): void => {
    if (!wide.matches) {
      win.style.transform = '';
      stage.style.height = '';
      stage.style.maxWidth = '';
      return;
    }
    const pad = 40;
    const outer = (stage.parentElement as HTMLElement).clientWidth;
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    const k = Math.min(1, (outer - pad) / 1120, (window.innerHeight - headerH - 96 - pad) / 600);
    win.style.transform = `scale(${k})`;
    stage.style.maxWidth = `${pad + 1120 * k}px`;
    stage.style.height = `${pad + 600 * k}px`;
  };
  fit();
  window.addEventListener('resize', fit);

  // The bars grow once, the first time the window is seen.
  const io = new IntersectionObserver(
    (es) => {
      if (es.some((e) => e.isIntersecting)) {
        root.classList.add('is-in');
        io.disconnect();
      }
    },
    { threshold: 0.3 },
  );
  io.observe(win);
}
