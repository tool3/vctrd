import { adjustLightness, contrastRatio, ensureContrast, hexToRgba, normalizeHex, readableTextOn, withLightness } from './color';

export const DEFAULT_ACCENT = '#ff69b4';

export const ACCENT_PRESETS: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'Hot pink', hex: '#ff69b4' },
  { name: 'Iris', hex: '#a698ff' },
  { name: 'Indigo', hex: '#7c8aff' },
  { name: 'Cyan', hex: '#5cd0ff' },
  { name: 'Emerald', hex: '#5ce0a8' },
  { name: 'Citrus', hex: '#ffcc66' },
  { name: 'Coral', hex: '#ff8c66' },
  { name: 'Silver', hex: '#c6c6c8' },
];

const SURFACE = '#0e0e0e';
const DESIGNED_LABEL = '#0e0e0e';

const faviconFor = (hex: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${adjustLightness(hex, 12)}"/><stop offset="1" stop-color="${withLightness(hex, 18)}"/></linearGradient><pattern id="l" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity="0.28"/></pattern></defs><rect width="64" height="64" rx="14" fill="#0e0e0e"/><rect x="4" y="4" width="56" height="56" rx="11" fill="url(#f)"/><g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21 L32 45 L46 21" stroke="#ff2d55" opacity="0.8" transform="translate(-1.8 0)"/><path d="M18 21 L32 45 L46 21" stroke="#4cc9f0" opacity="0.8" transform="translate(1.8 0)"/><path d="M18 21 L32 45 L46 21" stroke="#f7f7f2"/></g><rect x="4" y="4" width="56" height="56" rx="11" fill="url(#l)"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const setHeadAttribute = (selector: string, attribute: string, value: string): void =>
  document.querySelectorAll(selector).forEach((node) => node.setAttribute(attribute, value));

export const accentVariables = (raw: string): Record<string, string> => {
  const hex = normalizeHex(raw, DEFAULT_ACCENT);
  const accent = ensureContrast(hex, SURFACE, 3);
  return {
    '--color-brand-dark': accent,
    '--color-brand-dark-hover': adjustLightness(accent, 6),
    '--color-brand-dark-active': adjustLightness(accent, -6),
    '--color-brand-dark-subtle': hexToRgba(accent, 0.16),
    '--color-accent-dim': hexToRgba(accent, 0.7),
    '--color-text-inverted': contrastRatio(accent, DESIGNED_LABEL) >= 4.5 ? DESIGNED_LABEL : readableTextOn(accent),
    '--glow-brand': `0 0 20px ${hexToRgba(hex, 0.25)}`,
    '--glow-brand-intense': `0 0 30px ${hexToRgba(hex, 0.4)}`,
    '--ambient-1': hexToRgba(hex, 0.2),
    '--ambient-2': hexToRgba(hex, 0.13),
    '--ambient-3': hexToRgba(hex, 0.09),
  };
};

export const applyAccent = (raw: string): void => {
  const hex = normalizeHex(raw, DEFAULT_ACCENT);
  const root = document.documentElement;
  Object.entries(accentVariables(hex)).forEach(([name, value]) => root.style.setProperty(name, value));
  setHeadAttribute('link[rel~="icon"]', 'href', faviconFor(hex));
  setHeadAttribute('meta[name="theme-color"]', 'content', withLightness(hex, 6));
};
