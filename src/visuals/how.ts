/**
 * How it works: four steps. The list on the left follows the scroll and jumps
 * on click. Each step's screen is drawn at 960 × 560 and scaled to its column;
 * it plays a short loop while on screen: the search types and resolves (01),
 * a stress sweep runs until the plan breaks (02), the agents report in turn
 * (03), and the record's hash is written and sealed (04). One pause control
 * stops every screen. Under reduced motion each screen shows its final state.
 */
import { prefersReducedMotion } from '../lib/prefers';

const W = 960;
const H = 560;
const wait = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms));

export function initHow(root: HTMLElement): void {
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-hz-go]'));
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-hz]'));
  const stages = Array.from(root.querySelectorAll<HTMLElement>('.hz__stage'));
  const pauses = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-pause]'));
  if (!steps.length) return;
  const reduced = prefersReducedMotion();
  let paused = reduced;

  // ---- the list follows the scroll
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
    const line = window.innerHeight * 0.45;
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
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 54;
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - headerH - 32, behavior: reduced ? 'auto' : 'smooth' });
    }),
  );

  // ---- fit each screen to its stage, with an even margin of backdrop
  const fit = (): void =>
    stages.forEach((st) => {
      const zs = st.querySelector<HTMLElement>('.zs');
      if (!zs) return;
      const pad = Math.round(Math.max(14, Math.min(48, st.clientWidth * 0.055)));
      const k = (st.clientWidth - pad * 2) / W;
      zs.style.transform = `translate(${pad}px, ${pad}px) scale(${k})`;
      st.style.height = `${Math.ceil(H * k + pad * 2)}px`;
    });
  fit();
  window.addEventListener('resize', () => {
    fit();
    onScroll();
  });
  document.fonts?.ready.then(fit);
  onScroll();

  // ---- pause
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

  // ---- the loops; each runs only while its screen is in view and not paused
  const visible = new Set<Element>();
  const live = (el: Element): boolean => visible.has(el) && !paused;
  const until = async (el: Element): Promise<void> => {
    while (!live(el)) await wait(300);
  };

  const s1 = root.querySelector<HTMLElement>('[data-zs="1"]');
  const s2 = root.querySelector<HTMLElement>('[data-zs="2"]');
  const s3 = root.querySelector<HTMLElement>('[data-zs="3"]');
  const s4 = root.querySelector<HTMLElement>('[data-zs="4"]');

  // 01: type the query, resolve, walk the results
  const loop1 = async (el: HTMLElement): Promise<void> => {
    const q = el.querySelector<HTMLElement>('[data-type]')!;
    const text = q.dataset['type'] ?? '';
    const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-r]'));
    for (;;) {
      await until(el);
      el.classList.remove('is-found');
      rows.forEach((r) => r.classList.remove('is-hi'));
      q.textContent = '';
      for (let i = 1; i <= text.length; i++) {
        await until(el);
        q.textContent = text.slice(0, i);
        await wait(70);
      }
      await wait(350);
      el.classList.add('is-found');
      for (const k of [1, 0, 2, 1]) {
        await until(el);
        rows.forEach((r, j) => r.classList.toggle('is-hi', j === k));
        await wait(1400);
      }
      await wait(1200);
    }
  };

  // 02: sweep the shock from 0 to 3; the plan breaks at 1.8
  const loop2 = async (el: HTMLElement): Promise<void> => {
    const tile = (k: string): HTMLElement => el.querySelector<HTMLElement>(`[data-t="${k}"]`)!;
    const set = (k: string, v: string, bad = false): void => {
      tile(k).querySelector('b')!.textContent = v;
      tile(k).classList.toggle('is-bad', bad);
    };
    const cur = el.querySelector<HTMLElement>('.zw__cur')!;
    const shockOut = el.querySelector<HTMLElement>('.zw__foot b')!;
    for (;;) {
      for (let i = 0; i <= 60; i++) {
        await until(el);
        const s = (i / 60) * 3;
        const head = 186 * (1 - s / 1.8);
        const broke = s >= 1.8;
        set('shock', s.toFixed(1));
        set('head', broke ? 'Breached' : head.toFixed(0), broke);
        set('cov', Math.max(0.6, 1.34 - 0.08 * s * s).toFixed(2), 1.34 - 0.08 * s * s < 1.2);
        set('exp', (412 + 96 * s).toFixed(0));
        set('call', (s < 0.8 ? 0 : 64 * (s - 0.8)).toFixed(0), s > 1.6);
        set('slip', (s < 1.2 ? 0 : Math.round(4 * (s - 1.2))).toString(), s > 2.2);
        cur.style.left = `${(s / 3) * 100}%`;
        shockOut.textContent = `${s.toFixed(1)}×`;
        el.classList.toggle('is-broke', broke);
        await wait(broke ? 120 : 160);
      }
      await wait(2200);
    }
  };

  // 03: the agents report in turn, then the result
  const loop3 = async (el: HTMLElement): Promise<void> => {
    const msgs = Array.from(el.querySelectorAll<HTMLElement>('[data-m]'));
    const ags = Array.from(el.querySelectorAll<HTMLElement>('[data-ag]'));
    const who = [0, 1, 3, 4];
    for (;;) {
      await until(el);
      msgs.forEach((m) => m.classList.remove('is-in'));
      ags.forEach((a) => a.classList.remove('is-busy', 'is-done'));
      for (let i = 0; i < msgs.length; i++) {
        await until(el);
        const a = ags[who[i] ?? -1];
        if (a) a.classList.add('is-busy');
        await wait(1100);
        if (a) a.classList.replace('is-busy', 'is-done');
        msgs[i]!.classList.add('is-in');
        await wait(i === msgs.length - 1 ? 4200 : 700);
      }
    }
  };

  // 04: write the hash, step the status, seal
  const loop4 = async (el: HTMLElement): Promise<void> => {
    const h = el.querySelector<HTMLElement>('[data-hash]')!;
    const full = h.dataset['hash'] ?? '';
    const sts = Array.from(el.querySelectorAll<HTMLElement>('[data-st]'));
    const tag = el.querySelector<HTMLElement>('.zr__new')!;
    for (;;) {
      await until(el);
      el.classList.remove('is-sealed');
      tag.textContent = 'Sealing';
      sts.forEach((s, k) => s.classList.toggle('is-on', k === 0));
      h.textContent = '';
      for (let i = 2; i <= full.length; i += 2) {
        await until(el);
        h.textContent = full.slice(0, i);
        await wait(38);
      }
      await wait(400);
      el.classList.add('is-sealed');
      tag.textContent = 'Committed';
      await wait(5200);
    }
  };

  const finals = (): void => {
    if (s1) {
      s1.querySelector('[data-type]')!.textContent = s1.querySelector<HTMLElement>('[data-type]')!.dataset['type'] ?? '';
      s1.classList.add('is-found');
      s1.querySelector('[data-r="1"]')?.classList.add('is-hi');
    }
    s3?.querySelectorAll('[data-m]').forEach((m) => m.classList.add('is-in'));
    s3?.querySelectorAll('[data-ag]').forEach((a) => a.classList.add('is-done'));
    if (s4) {
      const h = s4.querySelector<HTMLElement>('[data-hash]')!;
      h.textContent = h.dataset['hash'] ?? '';
      s4.classList.add('is-sealed');
    }
  };

  if (reduced) {
    finals();
    return;
  }

  const io = new IntersectionObserver(
    (es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))),
    { threshold: 0.35 },
  );
  [s1, s2, s3, s4].forEach((s) => s && io.observe(s));
  if (s1) void loop1(s1);
  if (s2) void loop2(s2);
  if (s3) void loop3(s3);
  if (s4) void loop4(s4);
}
