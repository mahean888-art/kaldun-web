/**
 * Header behaviour: no drawn bar on the hero, a thin opaque bar once the page
 * scrolls, light while the light hero is under it. The markup carries only
 * the wordmark, the index, and one action, so there is no drawer to manage.
 */

import { qs } from '../lib/dom';
import { onFrame, type Frame } from '../lib/ticker';

export function initHeader(): void {
  const header = qs<HTMLElement>('[data-header]');
  if (!header) return;

  const hero = qs<HTMLElement>('.hero');
  let stuck = false;
  let onLight = false;

  onFrame((frame: Frame) => {
    const nextStuck = frame.scrollY > 12;
    if (nextStuck !== stuck) {
      stuck = nextStuck;
      header.classList.toggle('is-stuck', stuck);
    }

    // While the light hero is still under the bar, the bar reads light.
    const nextOnLight = hero ? frame.scrollY < hero.offsetTop + hero.offsetHeight - header.offsetHeight : false;
    if (nextOnLight !== onLight) {
      onLight = nextOnLight;
      header.classList.toggle('is-on-light', onLight);
    }
  });
}
