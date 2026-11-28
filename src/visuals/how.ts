/**
 * How it works: four natively responsive 1:1 Foresight Machine product screens.
 * Sticky left rail follows scroll; each screen gently animates its telemetry
 * while in view without ever flashing an empty canvas.
 */
import { prefersReducedMotion } from '../lib/prefers';

const wait = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms));

export function initHow(root: HTMLElement): void {
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-hz-go]'));
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-hz]'));
  const pauses = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-pause]'));
  if (!steps.length) return;
  const reduced = prefersReducedMotion();
  let paused = reduced;

  // ---- Sticky left list follows scroll
  const mark = (n: number): void =>
    links.forEach((l) => {
      const on = l.dataset['hzGo'] === String(n);
      l.classList.toggle('is-on', on);
      if (on) l.setAttribute('aria-current', 'step');
      else l.removeAttribute('aria-current');
    });

  let raf = 0;
  const onScroll = (): void => {
    raf = 0;
    const line = window.innerHeight * 0.42;
    let cur = 1;
    steps.forEach((s, k) => {
      if (s.getBoundingClientRect().top <= line) cur = k + 1;
    });
    mark(cur);
  };
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(onScroll);
  }, { passive: true });

  links.forEach((l) =>
    l.addEventListener('click', (e) => {
      const t = root.querySelector<HTMLElement>(l.getAttribute('href') ?? '');
      if (!t) return;
      e.preventDefault();
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56;
      window.scrollTo({
        top: t.getBoundingClientRect().top + window.scrollY - headerH - 28,
        behavior: reduced ? 'auto' : 'smooth',
      });
    }),
  );
  onScroll();

  // ---- Pause toggle
  const setPaused = (p: boolean): void => {
    paused = p;
    root.classList.toggle('is-paused', p);
    pauses.forEach((b) => {
      b.setAttribute('aria-label', p ? 'Play the screens' : 'Pause the screens');
      b.classList.toggle('is-play', p);
    });
  };
  pauses.forEach((b) => b.addEventListener('click', () => setPaused(!paused)));
  setPaused(paused);

  if (reduced) return;

  const visible = new Set<Element>();
  const live = (el: Element): boolean => visible.has(el) && !paused;
  const until = async (el: Element): Promise<void> => {
    while (!live(el)) await wait(300);
  };

  const s1 = root.querySelector<HTMLElement>('[data-zs="1"]');
  const s2 = root.querySelector<HTMLElement>('[data-zs="2"]');
  const s3 = root.querySelector<HTMLElement>('[data-zs="3"]');
  const s4 = root.querySelector<HTMLElement>('[data-zs="4"]');

  // 01: gently cycle highlighted linked entities while keeping content populated
  const loop1 = async (el: HTMLElement): Promise<void> => {
    const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-r]'));
    const sources = Array.from(el.querySelectorAll<HTMLElement>('.m1__sources li'));
    const seq = [1, 0, 2, 3, 4];
    for (;;) {
      for (const k of seq) {
        await until(el);
        rows.forEach((r, j) => r.classList.toggle('is-hi', j === k));
        sources.forEach((s, j) => s.classList.toggle('is-hi', j === (k % sources.length)));
        await wait(1900);
      }
    }
  };

  // 02: sweep shock 0.0× → 3.0×; plan breaks at 1.8×
  const loop2 = async (el: HTMLElement): Promise<void> => {
    const tile = (k: string): HTMLElement | null => el.querySelector<HTMLElement>(`[data-t="${k}"]`);
    const set = (k: string, v: string, bad = false): void => {
      const t = tile(k);
      if (!t) return;
      const b = t.querySelector('b');
      if (b) b.textContent = v;
      t.classList.toggle('is-bad', bad);
    };
    const cur = el.querySelector<HTMLElement>('.m2__cur');
    const shockOut = el.querySelector<HTMLElement>('[data-shock-out]');
    for (;;) {
      for (let i = 0; i <= 60; i++) {
        await until(el);
        const s = (i / 60) * 3;
        const head = 186 * (1 - s / 1.8);
        const broke = s >= 1.8;
        set('shock', s.toFixed(1), broke);
        set('head', broke ? 'Breach' : head.toFixed(0), broke);
        set('cov', Math.max(0.6, 1.34 - 0.08 * s * s).toFixed(2), 1.34 - 0.08 * s * s < 1.2);
        set('exp', (412 + 96 * s).toFixed(0));
        set('call', (s < 0.8 ? 0 : 64 * (s - 0.8)).toFixed(0), s > 1.6);
        set('slip', (s < 1.2 ? 0 : Math.round(4 * (s - 1.2))).toString(), s > 2.2);
        if (cur) cur.style.left = `${(s / 3) * 100}%`;
        if (shockOut) shockOut.textContent = `${s.toFixed(1)}×`;
        el.classList.toggle('is-broke', broke);
        await wait(broke ? 115 : 145);
      }
      await wait(2000);
    }
  };

  // 03: highlight active role evaluations sequentially while keeping workspace legible
  const loop3 = async (el: HTMLElement): Promise<void> => {
    const rows = Array.from(el.querySelectorAll<HTMLElement>('.m3__row'));
    const ags = Array.from(el.querySelectorAll<HTMLElement>('[data-ag]'));
    const res = el.querySelector<HTMLElement>('.m3__res');
    const who = [0, 1, 3, 4];
    for (;;) {
      for (let i = 0; i < rows.length; i++) {
        await until(el);
        rows.forEach((r, j) => r.classList.toggle('is-focus', j === i));
        ags.forEach((a, j) => a.classList.toggle('is-busy', j === who[i]));
        res?.classList.remove('is-focus');
        await wait(1600);
      }
      await until(el);
      rows.forEach((r) => r.classList.remove('is-focus'));
      ags.forEach((a) => a.classList.remove('is-busy'));
      res?.classList.add('is-focus');
      await wait(3200);
    }
  };

  // 04: subtle hash verification sweep + status confirmation
  const loop4 = async (el: HTMLElement): Promise<void> => {
    const h = el.querySelector<HTMLElement>('[data-hash]');
    const full = h?.dataset['hash'] ?? '';
    const tag = el.querySelector<HTMLElement>('.zr__new');
    const badge = el.querySelector<HTMLElement>('.m4__badge');
    if (!h) return;
    for (;;) {
      await until(el);
      await wait(3200);
      el.classList.remove('is-sealed');
      if (tag) tag.textContent = 'Sealing';
      if (badge) badge.textContent = 'HASHING…';
      for (let i = 8; i <= full.length; i += 4) {
        await until(el);
        h.textContent = full.slice(0, i);
        await wait(45);
      }
      h.textContent = full;
      el.classList.add('is-sealed');
      if (tag) tag.textContent = 'Committed';
      if (badge) badge.textContent = 'PRE-COMMITTED';
      await wait(4200);
    }
  };

  const io = new IntersectionObserver(
    (es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))),
    { threshold: 0.2 },
  );
  [s1, s2, s3, s4].forEach((s) => s && io.observe(s));
  if (s1) void loop1(s1);
  if (s2) void loop2(s2);
  if (s3) void loop3(s3);
  if (s4) void loop4(s4);
}
