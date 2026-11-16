/**
 * Where we start: one screen of the product.
 *
 * A Foresight Machine for a dollar issuer, open on one decision. Six numbered
 * parts (question, model, futures, search, answer, record) are explained in
 * the legend below; pointing at a legend item picks out its part on screen.
 */
export function initRun(root: HTMLElement): void {
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
