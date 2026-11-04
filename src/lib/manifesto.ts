/**
 * The manifesto page: the "On this page" list follows the reader, and the
 * share row copies the address.
 */

export function initManifesto(root: Document = document): void {
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-toc]'));
  if (links.length) {
    const secs = links.map((a) => root.getElementById(a.dataset['toc'] ?? '')).filter((x): x is HTMLElement => !!x);
    const mark = (id: string): void => {
      for (const a of links) a.classList.toggle('is-on', a.dataset['toc'] === id);
    };
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) mark(vis[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const s of secs) io.observe(s);
    mark(secs[0]?.id ?? '');
  }
  const copy = root.querySelector<HTMLButtonElement>('[data-copy-link]');
  copy?.addEventListener('click', () => {
    const done = (): void => {
      copy.textContent = 'Copied';
      window.setTimeout(() => (copy.textContent = 'Copy link'), 1800);
    };
    void navigator.clipboard?.writeText(location.href.split('#')[0] ?? location.href).then(done, done);
  });
}
