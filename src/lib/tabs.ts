/**
 * Tabs, wired once. Roving tabindex, aria-selected on the tabs, aria-hidden
 * on the panels, `.is-in` on the visible panel, arrow keys in both axes.
 * Selection by click and by keyboard; hover changes nothing. Used by the
 * domain index and the record's pillar.
 */

export type Select = (index: number, focus?: boolean) => void;

type Options = {
  tabs: HTMLElement[];
  panels: HTMLElement[];
};

export function wireTabs({ tabs, panels }: Options): Select {
  let active = 0;

  const select: Select = (i, focus = false) => {
    active = i;
    tabs.forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === i));
      tab.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((panel, k) => {
      panel.setAttribute('aria-hidden', String(k !== i));
      panel.classList.toggle('is-in', k === i);
    });
    if (focus) tabs[i]?.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      const delta =
        event.key === 'ArrowDown' || event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
            ? -1
            : 0;
      if (delta === 0) return;
      event.preventDefault();
      select((active + delta + tabs.length) % tabs.length, true);
    });
  });

  select(0);
  return select;
}
