/**
 * "From what could happen to what could work." — set as Simile sets its own
 * use cases: a row of decision tabs, and for each, three cards: who asks, the
 * question in their words, the alternatives compared, and related decisions.
 * The three cards follow the three questions in order.
 */

export function initSim(root: ParentNode = document): void {
  const box = root.querySelector<HTMLElement>('[data-sim]');
  if (!box) return;
  const tabs = Array.from(box.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(box.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  const show = (i: number, focus = false): void => {
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((p, k) => {
      p.hidden = k !== i;
      if (k === i) {
        p.classList.remove('is-in');
        void p.offsetWidth;
        p.classList.add('is-in');
      }
    });
    if (focus) tabs[i]?.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const go = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : -1;
      if (go < 0) return;
      e.preventDefault();
      show(go, true);
    });
  });
}
