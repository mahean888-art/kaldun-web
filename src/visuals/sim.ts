/**
 * "Three questions before every commitment." — a row of decision tabs, and
 * for each, three cards under the three questions. Each card is a three-beat
 * story: the plan, the simulation, what it finds (and, for an arrangement,
 * what it requires).
 */

export function initSim(root: ParentNode = document): void {
  const box = root.querySelector<HTMLElement>('[data-qs]');
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
