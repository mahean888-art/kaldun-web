/**
 * Domains: a list of five, and one panel. Selecting a cell (click, or the arrow
 * keys within the list) shows its panel with a short cross-fade.
 */
export function initDomains(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  if (!tabs.length) return;
  const narrow = window.matchMedia('(max-width: 899px)');
  const select = (i: number, focus = false): void => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, k) => {
      const on = k === i;
      if (on && p.hidden) {
        p.hidden = false;
        p.classList.add('is-in');
        requestAnimationFrame(() => requestAnimationFrame(() => p.classList.remove('is-in')));
      } else if (!on) p.hidden = true;
    });
    if (focus) tabs[i]!.focus();
    // On narrow screens the list scrolls sideways: keep the chosen chip in view.
    if (narrow.matches) {
      const list = tabs[i]!.parentElement!;
      list.scrollTo({ left: tabs[i]!.offsetLeft - 16, behavior: 'smooth' });
    }
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  root.querySelector('[role="tablist"]')?.addEventListener('keydown', (ev) => {
    const k = (ev as KeyboardEvent).key;
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    let n = -1;
    if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % tabs.length;
    else if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i + tabs.length - 1) % tabs.length;
    else if (k === 'Home') n = 0;
    else if (k === 'End') n = tabs.length - 1;
    if (n < 0) return;
    ev.preventDefault();
    select(n, true);
  });
}
