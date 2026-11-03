/**
 * The decision dialog, and the way back from a Journal entry.
 *
 * Every "Discuss a decision" link points at #decision. On the home page that
 * opens the dialog in place, so the reader keeps their place on the page; a
 * link from a Journal entry arrives with the hash and opens it on load.
 *
 * Journal links remember where the reader was. Back from an entry returns to
 * that exact point: through history when the reader came from the home page,
 * otherwise by restoring the saved position.
 */

const KEY = 'fm:return';

const store = {
  get: (): number | null => {
    try {
      const v = sessionStorage.getItem(KEY);
      return v === null ? null : Number(v);
    } catch {
      return null;
    }
  },
  set: (y: number): void => {
    try {
      sessionStorage.setItem(KEY, String(Math.round(y)));
    } catch {
      /* private mode: history still restores the place */
    }
  },
  clear: (): void => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

export function initDialog(root: Document = document): void {
  const dlg = root.querySelector<HTMLDialogElement>('[data-dialog]');
  if (!dlg) return;
  const open = (): void => {
    if (dlg.open) return;
    dlg.showModal();
    document.documentElement.classList.add('has-dialog');
    dlg.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
  };
  const close = (): void => dlg.close();
  dlg.addEventListener('close', () => {
    document.documentElement.classList.remove('has-dialog');
    if (location.hash === '#decision') history.replaceState(null, '', location.pathname + location.search);
  });
  // A click on the backdrop closes; a click inside the panel does not.
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });
  dlg.querySelector('[data-dialog-close]')?.addEventListener('click', close);
  root.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href="#decision"], a[href="/#decision"]');
    if (!a) return;
    e.preventDefault();
    open();
  });
  if (location.hash === '#decision') open();
}

/** On the home page: remember the place before opening an entry; restore it on return. */
export function initJournalReturn(root: Document = document): void {
  for (const a of root.querySelectorAll<HTMLAnchorElement>('[data-jlink]')) {
    a.addEventListener('click', () => store.set(window.scrollY));
  }
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const y = store.get();
  const fromEntry = /\/journal\//.test(document.referrer);
  if (y !== null && (nav?.type === 'back_forward' || (fromEntry && location.hash === '#return'))) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
    if (location.hash === '#return') history.replaceState(null, '', location.pathname);
  }
}

/** On an entry: Back returns to the exact place on the home page. */
export function initBack(root: Document = document): void {
  for (const a of root.querySelectorAll<HTMLAnchorElement>('[data-back]')) {
    a.addEventListener('click', (e) => {
      let ref: URL | null = null;
      try {
        ref = document.referrer ? new URL(document.referrer) : null;
      } catch {
        ref = null;
      }
      e.preventDefault();
      if (ref && ref.origin === location.origin && ref.pathname === '/' && history.length > 1) history.back();
      else location.href = store.get() !== null ? '/#return' : '/#journal';
    });
  }
}
