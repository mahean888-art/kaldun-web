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
}
