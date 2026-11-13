/**
 * The demo workspace: a clickable prototype for meetings and live demos.
 * Not part of the public site; built on its own with `npm run build:demo`.
 */
import './styles/index.css';
import './styles/demo.css';
import { initWorkspace } from './visuals/console';
import { ready } from './lib/dom';

ready(() => {
  document.documentElement.classList.add('js');
  const root = document.querySelector<HTMLElement>('[data-ws]');
  if (!root) return;
  initWorkspace(root);

  const btn = root.querySelector<HTMLButtonElement>('[data-new]');
  const view = root.querySelector<HTMLElement>('[data-new-view]');
  const side = root.querySelector<HTMLElement>('[data-a-new]');
  const panels = (): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>('.ws-d, .ws-m, .ws-r, .ws-a:not([data-a-new])'));
  let hiddenByNew: HTMLElement[] = [];

  const closeNew = (): void => {
    if (!view || view.hidden) return;
    view.hidden = true;
    if (side) side.hidden = true;
    btn?.setAttribute('aria-pressed', 'false');
    root.classList.remove('is-new');
    hiddenByNew.forEach((p) => (p.hidden = false));
    hiddenByNew = [];
  };

  btn?.addEventListener('click', () => {
    if (!view || !view.hidden) return;
    hiddenByNew = panels().filter((p) => !p.hidden);
    hiddenByNew.forEach((p) => (p.hidden = true));
    view.hidden = false;
    if (side) side.hidden = false;
    btn.setAttribute('aria-pressed', 'true');
    root.classList.add('is-new');
    view.querySelector<HTMLElement>('textarea')?.focus();
  });

  // Any other control closes the new-decision screen first; the workspace does the rest.
  root.querySelectorAll<HTMLElement>('.ws-dec, .ws-tabs [role="tab"], [data-pick]').forEach((c) =>
    c.addEventListener(c.matches('select') ? 'change' : 'click', () => {
      hiddenByNew = [];
      if (view && !view.hidden) {
        view.hidden = true;
        if (side) side.hidden = true;
        btn?.setAttribute('aria-pressed', 'false');
        root.classList.remove('is-new');
      }
    }, { capture: true }),
  );

  // Start: the demo runs Partner N's decision, from question to answer.
  root.querySelector<HTMLFormElement>('[data-new-form]')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    closeNew();
    root.querySelector<HTMLButtonElement>('.ws-dec[data-dec="instant-redemption"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-replay]')?.click();
  });
});
