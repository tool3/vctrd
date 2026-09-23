const CSS_DELAYS = 'data-vctrd-delays';
const SMIL_BEGIN = 'data-vctrd-begin';
const SMIL_ELEMENTS = new Set(['animate', 'animateTransform', 'animateMotion', 'animateColor', 'set']);
const MAX_LOOP_MS = 30_000;

export interface Timeline {
  base: string;
  duration: number;
  animated: boolean;
}

const UNIT_MS: Record<string, number> = { ms: 1, s: 1000, min: 60_000, h: 3_600_000 };

export const parseSeconds = (value: string): number | null => {
  const match = /^([+-]?\d*\.?\d+)(ms|s|min|h)?$/.exec(value.trim());
  return match ? (Number(match[1]) * (UNIT_MS[match[2] ?? 's'] ?? 1000)) / 1000 : null;
};

const parseTimeList = (value: string): number[] =>
  value
    .split(',')
    .map((part) => parseSeconds(part) ?? 0);

const round = (value: number): number => Math.round(value * 10_000) / 10_000;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export const loopLength = (durations: readonly number[]): number => {
  const steps = [
    ...new Set(durations.filter((d) => Number.isFinite(d) && d > 0).map((d) => Math.max(10, Math.round(d * 100) * 10))),
  ];
  if (steps.length === 0) return 0;
  const lcm = steps.reduce((acc, step) => (acc > MAX_LOOP_MS ? acc : (acc * step) / gcd(acc, step)));
  return (lcm <= MAX_LOOP_MS ? lcm : Math.min(MAX_LOOP_MS, Math.max(...steps))) / 1000;
};

const parseSvg = (svg: string): XMLDocument => {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('The SVG could not be parsed for animation.');
  return doc;
};

const stripActiveContent = (doc: XMLDocument): XMLDocument => {
  doc.querySelectorAll('script').forEach((script) => script.remove());
  doc.querySelectorAll('*').forEach((node) =>
    Array.from(node.attributes)
      .filter((attribute) => attribute.name.toLowerCase().startsWith('on'))
      .forEach((attribute) => node.removeAttribute(attribute.name)),
  );
  return doc;
};

const mountHidden = (root: Element): { elements: Element[]; unmount: () => void } => {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'open' });
  const clone = document.importNode(root, true);
  shadow.append(clone);
  document.body.append(host);
  return { elements: [clone, ...clone.querySelectorAll('*')], unmount: () => host.remove() };
};

interface Measured {
  durations: number[];
}

const measureCss = (live: Element, target: Element): Measured => {
  const style = getComputedStyle(live);
  if (!style.animationName || style.animationName === 'none') return { durations: [] };
  target.setAttribute(CSS_DELAYS, parseTimeList(style.animationDelay).join(','));
  return { durations: parseTimeList(style.animationDuration) };
};

const simpleDuration = (live: Element): number[] => {
  try {
    return 'getSimpleDuration' in live ? [(live as SVGAnimationElement).getSimpleDuration()] : [];
  } catch {
    return [];
  }
};

const measureSmil = (live: Element, target: Element): Measured => {
  if (!SMIL_ELEMENTS.has(target.localName)) return { durations: [] };
  target.setAttribute(SMIL_BEGIN, target.getAttribute('begin') ?? '');
  const dur = parseSeconds(target.getAttribute('dur') ?? '');
  return { durations: dur === null ? simpleDuration(live) : [dur] };
};

export const prepareTimeline = (svg: string): Timeline => {
  const doc = stripActiveContent(parseSvg(svg));
  const root = doc.documentElement;
  const targets = [root, ...root.querySelectorAll('*')];
  const { elements, unmount } = mountHidden(root);
  try {
    const durations = targets.flatMap((target, index) => {
      const live = elements[index];
      return live ? [...measureCss(live, target).durations, ...measureSmil(live, target).durations] : [];
    });
    const duration = loopLength(durations);
    return { base: new XMLSerializer().serializeToString(doc), duration, animated: duration > 0 };
  } finally {
    unmount();
  }
};

const shiftBegin = (begin: string, time: number): string =>
  (begin.trim() || '0s')
    .split(';')
    .map((token) => {
      const offset = parseSeconds(token);
      return offset === null ? token.trim() : `${round(offset - time)}s`;
    })
    .join(';');

export const frameAt = (timeline: Timeline, time: number): string => {
  const doc = parseSvg(timeline.base);
  doc.querySelectorAll(`[${CSS_DELAYS}]`).forEach((node) => {
    const delays = (node.getAttribute(CSS_DELAYS) ?? '').split(',').map(Number);
    const style = node.getAttribute('style') ?? '';
    const shifted = delays.map((delay) => `${round(delay - time)}s`).join(',');
    node.setAttribute('style', `${style};animation-delay:${shifted} !important;animation-play-state:paused !important`);
    node.removeAttribute(CSS_DELAYS);
  });
  doc.querySelectorAll(`[${SMIL_BEGIN}]`).forEach((node) => {
    node.setAttribute('begin', shiftBegin(node.getAttribute(SMIL_BEGIN) ?? '', time));
    node.removeAttribute(SMIL_BEGIN);
  });
  return new XMLSerializer().serializeToString(doc);
};
