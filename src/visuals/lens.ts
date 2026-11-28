/**
 * Lenses: the hero's and one per World card. Each shows a still until the
 * world engine (three.js, loaded after first paint) takes over. The hero lens
 * runs while it is on screen; a card's lens comes alive under the pointer.
 * The ring is a time dial: the amber arc is the day, the clock counts hours
 * run ahead, and dragging across the glass moves time.
 */
import { prefersReducedMotion } from '../lib/prefers';
import type { Engine } from './lens-engine';

const LABELS: Record<string, string> = { money: 'Digital money', power: 'Power & compute', trade: 'Global trade' };

function dial(host: HTMLElement): void {
  const svg = host.querySelector<SVGSVGElement>('.lens__dial');
  if (!svg) return;
  const full = host.dataset['lens'] === 'all';
  let s = '<circle r="86" class="lens__ring"/>';
  for (let i = 0; i < 144; i++) {
    const a = (i / 144) * Math.PI * 2, major = i % 12 === 0, L = major ? 3.2 : 1.4;
    s += `<line class="${major ? 'lens__tk lens__tk--m' : 'lens__tk'}" x1="${(Math.cos(a) * 86).toFixed(2)}" y1="${(Math.sin(a) * 86).toFixed(2)}" x2="${(Math.cos(a) * (86 + L)).toFixed(2)}" y2="${(Math.sin(a) * (86 + L)).toFixed(2)}"/>`;
  }
  const day = Number(host.dataset['lensDay'] ?? 0.42);
  const C = 2 * Math.PI * 83.6;
  s += `<circle r="83.6" class="lens__track"/><circle data-arc r="83.6" class="lens__arc" transform="rotate(-90)" stroke-dasharray="${(day * C).toFixed(2)} ${C.toFixed(2)}"/>`;
  s += `<rect data-hand x="-1.1" y="-90.6" width="2.2" height="2.2" class="lens__hand" transform="rotate(${(day * 360).toFixed(1)})"/>`;
  if (full) {
    (['money', 'power', 'trade'] as const).forEach((k, i) => {
      const a = ([-90, 38, 142][i]! * Math.PI) / 180, x = Math.cos(a) * 93, y = Math.sin(a) * 93;
      const anchor = i === 0 ? 'middle' : i === 1 ? 'start' : 'end';
      s += `<text data-w="${k}" class="lens__lab${i === 0 ? ' on' : ''}" x="${x.toFixed(1)}" y="${(y + (i ? 3 : -1.5)).toFixed(1)}" text-anchor="${anchor}">${LABELS[k]}</text>`;
    });
    s += '<text data-clock class="lens__clock" x="0" y="98" text-anchor="middle">T + 00 H</text>';
  }
  svg.innerHTML = s;
}

/** Scale the dial's type so labels stay at 12px whatever the lens size. */
function sizeType(host: HTMLElement): void {
  const box = host.querySelector<HTMLElement>('.lens__box');
  if (!box) return;
  const w = box.clientWidth || 400;
  host.style.setProperty('--lens-fs', `${((12 * 200) / w).toFixed(2)}px`);
}

export function initLenses(root: ParentNode): void {
  const hosts = Array.from(root.querySelectorAll<HTMLElement>('[data-lens]'));
  if (!hosts.length) return;
  hosts.forEach((h) => { dial(h); sizeType(h); });
  addEventListener('resize', () => hosts.forEach(sizeType));

  const reduced = prefersReducedMotion();
  const hero = hosts.find((h) => h.dataset['lens'] === 'all') ?? null;
  const cards = hosts.filter((h) => h !== hero);
  const exporting = new URLSearchParams(location.search).has('lensexport');

  let engine: Engine | null = null;
  let heroIn = false;
  let hovered: HTMLElement | null = null;
  let docVisible = !document.hidden;

  const sync = (): void => {
    if (!engine) return;
    const want = !docVisible ? null : hovered ?? (heroIn && hero ? hero : null);
    if (want && engine.host() !== want) engine.attach(want);
    else if (!want && engine.host()) engine.detach();
  };

  const load = async (): Promise<void> => {
    try {
      const { createEngine } = await import('./lens-engine');
      engine = createEngine({ reduced, exporting });
      if (exporting) (window as unknown as { __lens: Engine }).__lens = engine;
      sync();
    } catch {
      /* no WebGL: the stills stay */
    }
  };

  if (hero) {
    new IntersectionObserver((es) => { heroIn = es.some((e) => e.isIntersecting); sync(); }, { threshold: 0.05 }).observe(hero);
  }
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cards.forEach((c) => {
      const zone = c.closest<HTMLElement>('[data-lens-zone]') ?? c;
      zone.addEventListener('pointerenter', () => { hovered = c; sync(); });
      zone.addEventListener('pointerleave', () => { if (hovered === c) hovered = null; sync(); });
    });
  }
  document.addEventListener('visibilitychange', () => { docVisible = !document.hidden; sync(); });

  const start = (): void => void load();
  if (exporting) start();
  else if ('requestIdleCallback' in window) (window as unknown as { requestIdleCallback: (f: () => void, o: object) => void }).requestIdleCallback(start, { timeout: 1200 });
  else setTimeout(start, 400);
}
