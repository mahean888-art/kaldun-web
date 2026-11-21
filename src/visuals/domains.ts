/**
 * 05 · Worlds — Teknoir × Astromech interactive OS-window deck controller.
 * Synchronizes segmented capsule pills, next-arrow stepper, clickable OS-window
 * cards, 1/3 counter readout, and the institutional decision dossier below.
 */
export function initDomains(root: HTMLElement): void {
  const pills = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-i]'));
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-tk-card]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tk-panel]'));
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-tk-next]');
  const countEl = root.querySelector<HTMLElement>('[data-tk-count]');
  if (!pills.length) return;

  let current = 0;

  const select = (idx: number, focus = false): void => {
    current = ((idx % pills.length) + pills.length) % pills.length;

    pills.forEach((p, k) => {
      const on = k === current;
      p.classList.toggle('is-on', on);
      p.setAttribute('aria-selected', String(on));
      p.tabIndex = on ? 0 : -1;
    });

    cards.forEach((c, k) => {
      const on = k === current;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-current', on ? 'true' : 'false');
    });

    panels.forEach((panel, k) => {
      panel.hidden = k !== current;
    });

    if (countEl) countEl.textContent = `${current + 1}/${pills.length}`;
    if (focus) pills[current]?.focus();
  };

  pills.forEach((p, i) => p.addEventListener('click', () => select(i)));
  cards.forEach((c, i) => {
    c.addEventListener('click', () => select(i));
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select(i);
      }
    });
  });

  nextBtn?.addEventListener('click', () => select(current + 1));

  root.querySelector('[role="tablist"]')?.addEventListener('keydown', (ev) => {
    const k = (ev as KeyboardEvent).key;
    if (k === 'ArrowRight' || k === 'ArrowDown') {
      ev.preventDefault();
      select(current + 1, true);
    } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
      ev.preventDefault();
      select(current - 1, true);
    } else if (k === 'Home') {
      ev.preventDefault();
      select(0, true);
    } else if (k === 'End') {
      ev.preventDefault();
      select(pills.length - 1, true);
    }
  });

  select(0);
}
