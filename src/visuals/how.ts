/**
 * How it works — left sticky navigation tracks whichever of the four steps
 * is currently in view, with smooth anchor jumping.
 */
export function initHow(root: HTMLElement): void {
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-hz-step]'));
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-hz-link]'));
  if (!steps.length || !links.length) return;

  const setActive = (id: string): void => {
    links.forEach((a) => {
      const on = a.dataset['hzLink'] === id;
      a.classList.toggle('is-on', on);
      if (on) a.setAttribute('aria-current', 'step');
      else a.removeAttribute('aria-current');
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const top = visible[0]?.target as HTMLElement | undefined;
      if (top?.dataset['hzStep']) setActive(top.dataset['hzStep']);
    },
    { rootMargin: '-18% 0px -48% 0px', threshold: [0.1, 0.35, 0.6] },
  );
  steps.forEach((s) => io.observe(s));

  links.forEach((a) => {
    a.addEventListener('click', () => {
      if (a.dataset['hzLink']) setActive(a.dataset['hzLink']);
    });
  });
}
