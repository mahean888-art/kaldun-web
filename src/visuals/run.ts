/**
 * Where we start: one screen of the product.
 *
 * A Foresight Machine for a dollar issuer, open on one decision. Six numbered
 * parts (question, model, futures, search, answer, record) are explained in
 * the legend below; pointing at a legend item picks out its part on screen.
 */
// Personas in the menu. Same world: its own machine on the shared model. Other worlds: next, on the same engine.
const PERSONAS: Record<string, { k: string; t: string; n: string; q: string }> = {
  payments: { k: 'This world', t: 'Payment company', n: 'We model the world once; each institution gets its own machine.', q: 'Where should liquidity sit so every payout clears, at any hour, with the least cash trapped?' },
  exchange: { k: 'This world', t: 'Exchange', n: 'We model the world once; each institution gets its own machine.', q: 'Which distribution terms grow balances that stay, for us and the issuer?' },
  bank: { k: 'This world', t: 'Bank', n: 'We model the world once; each institution gets its own machine.', q: 'What should it cost to cover redemptions that cannot clear over a weekend?' },
  trader: { k: 'Next, on the same engine', t: 'Commodity trader', n: 'Commodities and global trade', q: 'Hedge now, or hold and finance the inventory?' },
  mga: { k: 'Next, on the same engine', t: 'Specialty MGA', n: 'Insurance and emergent risk', q: 'How should a risk with no loss history be priced and layered?' },
  grid: { k: 'Next, on the same engine', t: 'Grid and compute developer', n: 'Energy, compute and megainfrastructure', q: 'Stage the build, or finance it whole?' },
};

function initPersonas(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-persona-btn]');
  const menu = root.querySelector<HTMLElement>('[data-persona-menu]');
  const card = root.querySelector<HTMLElement>('[data-persona-card]');
  if (!btn || !menu || !card) return;
  const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('[data-p]'));
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

export function initRun(root: HTMLElement): void {
  initPersonas(root);
  const items = Array.from(root.querySelectorAll<HTMLElement>('.ps__legend [data-k]'));
  const win = root.querySelector<HTMLElement>('.ps__win');
  if (!win) return;
  const pick = (k: string | null): void => {
    win.classList.toggle('is-focus', !!k);
    win.querySelectorAll<HTMLElement>('[data-c]').forEach((c) => c.classList.toggle('is-picked', c.dataset['c'] === k));
    items.forEach((i) => i.classList.toggle('is-on', i.dataset['k'] === k));
  };
  items.forEach((i) => {
    i.tabIndex = 0;
    i.addEventListener('mouseenter', () => pick(i.dataset['k']!));
    i.addEventListener('focus', () => pick(i.dataset['k']!));
    i.addEventListener('mouseleave', () => pick(null));
    i.addEventListener('blur', () => pick(null));
  });
  // The parts arrive in order the first time the screen is seen.
  const io = new IntersectionObserver(
    (es) => {
      if (es.some((e) => e.isIntersecting)) {
        root.classList.add('is-in');
        io.disconnect();
      }
    },
    { threshold: 0, rootMargin: "0px 0px -20% 0px" },
  );
  io.observe(win);

  // Fit the whole screen in one viewport: scale it down to the height available
  // and widen its layout so it still fills the frame edge to edge.
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
    let k = 1;
    for (let i = 0; i < 4; i++) {
      win.style.width = `${inner / k}px`;
      k = Math.max(0.62, Math.min(1, avail / win.offsetHeight));
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
