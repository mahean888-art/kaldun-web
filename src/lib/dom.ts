/**
 * Tiny DOM helpers. Typed, null-safe, no dependencies.
 */

export function qs<T extends Element = HTMLElement>(
  selector: string,
  scope: ParentNode = document,
): T | null {
  return scope.querySelector<T>(selector);
}

export function qsa<T extends Element = HTMLElement>(
  selector: string,
  scope: ParentNode = document,
): T[] {
  return Array.from(scope.querySelectorAll<T>(selector));
}

type Attrs = Record<string, string | number | boolean | undefined>;

/** Create an element with attributes and children in one call. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Create an SVG element (namespaced) with attributes and children. */
export function svg(tag: string, attrs: Attrs = {}, children: Element[] = []): SVGElement {
  const node = document.createElementNS(SVG_NS, tag) as SVGElement;
  applyAttrs(node, attrs);
  for (const child of children) node.append(child);
  return node;
}

function applyAttrs(node: Element, attrs: Attrs): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') {
      node.setAttribute('class', String(value));
    } else if (key === 'text') {
      node.textContent = String(value);
    } else if (key === 'html') {
      node.innerHTML = String(value);
    } else if (key === 'style') {
      node.setAttribute('style', String(value));
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }
}

/** Replace all children of a host with new nodes. */
export function mount(host: Element, ...nodes: Array<Node | string>): void {
  host.replaceChildren(...nodes.map((n) => (typeof n === 'string' ? document.createTextNode(n) : n)));
}

/** Escape a string for safe interpolation into innerHTML. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Run a callback once the document is parsed. */
export function ready(fn: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}
