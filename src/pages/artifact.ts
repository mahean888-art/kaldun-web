/**
 * Single-file bundle entry.
 *
 * The site ships as five real HTML documents. This entry exists so the same
 * code can also run as one self-contained page — useful for sharing a live,
 * clickable build where a static host is not available.
 *
 * It is a packaging layer, not a second version of the site: the markup is the
 * built markup, injected by `scripts/build-artifact.mjs`, and the mounts are the
 * same ones the multi-page entries use.
 *
 * Routes are `#/home`, `#/engine`, `#/domains`, `#/record`, `#/project`, with an
 * optional third segment — a domain id on `#/domains`, otherwise the id of an
 * element to scroll to.
 */

import { enhance, teardown } from '../main';
import { initHeader } from '../components/header';
import { qs, qsa, ready } from '../lib/dom';
import { disposeMounts, mountDomains, MOUNTS, type RouteId } from '../mounts';
import { prefersReducedMotion } from '../lib/prefers';

type PagePayload = { id: RouteId; title: string; main: string };

declare global {
  interface Window {
    __KALDUN_PAGES__?: PagePayload[];
  }
}

const ROUTES: RouteId[] = ['home', 'engine', 'domains', 'record', 'project'];

/** Map the built filenames onto route ids. */
const FILE_TO_ROUTE: Record<string, RouteId> = {
  'index.html': 'home',
  'engine.html': 'engine',
  'domains.html': 'domains',
  'record.html': 'record',
  'project-10191.html': 'project',
};

const isRoute = (value: string): value is RouteId => (ROUTES as string[]).includes(value);

function parseHash(): { route: RouteId; extra: string } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [first = '', second = ''] = raw.split('/');
  return { route: isRoute(first) ? first : 'home', extra: second };
}

/** Rewrite the built document-to-document links into router links. */
function rewriteLinks(root: ParentNode): void {
  for (const link of qsa<HTMLAnchorElement>('a[href]', root)) {
    const href = link.getAttribute('href') ?? '';
    const match = /^([a-z0-9-]+\.html)(?:#(.+))?$/i.exec(href);
    if (!match) continue;
    const route = FILE_TO_ROUTE[match[1] ?? ''];
    if (!route) continue;
    link.setAttribute('href', match[2] ? `#/${route}/${match[2]}` : `#/${route}`);
  }
}

ready(() => {
  const pages = window.__KALDUN_PAGES__ ?? [];
  const host = qs<HTMLElement>('[data-route-host]');
  if (!host || pages.length === 0) return;

  document.documentElement.classList.add('js');

  const byId = new Map<RouteId, PagePayload>(pages.map((page) => [page.id, page]));

  // The header, drawer and footer are shared across routes, so they are wired
  // once and never replaced.
  rewriteLinks(document);
  initHeader();

  let current: RouteId | null = null;

  const markNav = (route: RouteId): void => {
    for (const link of qsa<HTMLAnchorElement>('.nav__link, .drawer__link')) {
      const target = link.getAttribute('href') ?? '';
      const active = target === `#/${route}`;
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  };

  const render = (route: RouteId, extra: string): void => {
    const page = byId.get(route);
    if (!page) return;

    if (route !== current) {
      teardown();
      disposeMounts();
      host.innerHTML = page.main;

      if (route === 'domains') {
        mountDomains(host, extra);
      } else {
        MOUNTS[route](host);
      }
      enhance(host);
      // After mounting, so generated links (carousel cards, decision panels)
      // are rewritten alongside the static ones.
      rewriteLinks(host);

      document.title = page.title;
      markNav(route);
      current = route;

      if (!extra || route === 'domains') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } else if (route === 'domains' && extra) {
      // Re-selecting a domain within the page the user is already on.
      qs<HTMLElement>(`[data-domain-nav-item="${extra}"]`, host)?.click();
      return;
    }

    if (extra && route !== 'domains') {
      const target = document.getElementById(extra);
      if (target) {
        requestAnimationFrame(() => {
          target.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start',
          });
        });
      }
    }
  };

  const go = (): void => {
    const { route, extra } = parseHash();
    render(route, extra);
  };

  window.addEventListener('hashchange', () => {
    // In-page anchors (`#run`) are left to the browser.
    if (window.location.hash.startsWith('#/') || window.location.hash === '') go();
  });

  if (!window.location.hash) window.location.replace('#/home');
  go();
});
