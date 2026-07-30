/**
 * Accessible tabs. Roving tabindex, arrow-key navigation, Home/End, and the
 * selected tab scrolled into view inside its overflow strip.
 *
 * Markup contract:
 *   [data-tabs]
 *     [role=tablist] > button[role=tab][aria-controls][data-tab]
 *     [role=tabpanel][id]
 */

import { qs, qsa } from '../lib/dom';

export function initTabs(root: HTMLElement, onChange?: (id: string) => void): void {
  const list = qs<HTMLElement>('[role="tablist"]', root);
  const tabs = qsa<HTMLButtonElement>('[role="tab"]', root);
  if (!list || tabs.length === 0) return;

  const panels = tabs
    .map((tab) => {
      const id = tab.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    })
    .filter((node): node is HTMLElement => node !== null);

  const select = (index: number, focus = false): void => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = panels[i];
      if (panel) panel.hidden = !active;
    });

    const tab = tabs[index];
    if (!tab) return;
    if (focus) tab.focus();

    // Keep the active tab visible in the horizontally scrolling strip.
    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    if (tabRect.left < listRect.left || tabRect.right > listRect.right) {
      list.scrollTo({
        left: tab.offsetLeft - list.clientWidth / 2 + tab.offsetWidth / 2,
        behavior: 'smooth',
      });
    }

    onChange?.(tab.dataset.tab ?? String(index));
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      let target = -1;
      if (event.key === 'ArrowRight') target = i === last ? 0 : i + 1;
      else if (event.key === 'ArrowLeft') target = i === 0 ? last : i - 1;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = last;
      if (target >= 0) {
        event.preventDefault();
        select(target, true);
      }
    });
  });

  const initial = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  select(initial >= 0 ? initial : 0);
}

export function initAllTabs(root: ParentNode = document): void {
  for (const node of qsa<HTMLElement>('[data-tabs]', root)) initTabs(node);
}
