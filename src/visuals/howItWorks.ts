/**
 * 02 · How it works — Universal 4-Stage Architectural Ledger Controller
 * Pure typographic & structural interaction (zero procedural canvas).
 * Synchronizes the 4 top stage columns (01 Model -> 04 Record) with the
 * 3-column universal mechanical specification sheet (Input -> Mechanism -> Output).
 */
export function initHowItWorks(host: HTMLElement): void {
  const tabs = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-hw-tab]'));
  const panels = Array.from(host.querySelectorAll<HTMLElement>('[data-hw-panel]'));
  const nextBtn = host.querySelector<HTMLButtonElement>('[data-hw-next]');
  const prevBtn = host.querySelector<HTMLButtonElement>('[data-hw-prev]');
  const stepOut = host.querySelector<HTMLElement>('[data-hw-step]');
  if (!tabs.length) return;

  let current = 0;

  const select = (idx: number, focus = false): void => {
    current = ((idx % tabs.length) + tabs.length) % tabs.length;

    tabs.forEach((tab, i) => {
      const on = i === current;
      tab.classList.toggle('is-on', on);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });

    panels.forEach((panel, i) => {
      panel.hidden = i !== current;
    });

    if (stepOut) {
      stepOut.textContent = `${String(current + 1).padStart(2, '0')} / ${String(tabs.length).padStart(2, '0')}`;
    }

    if (focus) tabs[current]?.focus();
  };

  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
  prevBtn?.addEventListener('click', () => select(current - 1));
  nextBtn?.addEventListener('click', () => select(current + 1));

  host.querySelector('[role="tablist"]')?.addEventListener('keydown', (ev) => {
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
      select(tabs.length - 1, true);
    }
  });

  select(0);
}
