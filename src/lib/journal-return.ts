/**
 * The way back from a Journal entry.
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
      else location.href = store.get() !== null ? '/#return' : '/#manifesto';
    });
  }
}
