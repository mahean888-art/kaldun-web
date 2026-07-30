/** Project 10191 page composition. */

import { bootstrap } from '../main';
import { el, qs } from '../lib/dom';
import { BACKGROUNDS_LONG, FELLOWS_WORK_ON, PROVIDES } from '../data/fellowship';

bootstrap(() => {
  const backgrounds = qs('[data-backgrounds-long]');
  if (backgrounds) {
    backgrounds.replaceChildren(
      ...BACKGROUNDS_LONG.map((item) =>
        el('div', { class: 'background', 'data-reveal': 'fade' }, [item]),
      ),
    );
  }

  const worksOn = qs('[data-works-on]');
  if (worksOn) {
    worksOn.replaceChildren(
      ...FELLOWS_WORK_ON.map((item) => el('span', { class: 'chip chip--bronze' }, [item])),
    );
  }

  const provides = qs('[data-provides]');
  if (provides) {
    provides.replaceChildren(
      ...PROVIDES.map((item) =>
        el('div', { class: 'provide', 'data-reveal': 'fade' }, [
          el('span', { class: 'provide__label' }, [item.label]),
          el('p', { class: 'provide__body' }, [item.body]),
        ]),
      ),
    );
  }
});
