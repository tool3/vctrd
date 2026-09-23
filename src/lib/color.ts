export type Rgb = readonly [number, number, number];

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const HEX6 = /^#?([a-f0-9]{6})$/i;
const HEX3 = /^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i;

export const parseHex = (input: string): string | null => {
  const trimmed = input.trim();
  const full = HEX6.exec(trimmed);
  if (full) return `#${full[1]!.toLowerCase()}`;
  const short = HEX3.exec(trimmed);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase() : null;
};

export const normalizeHex = (input: string, fallback = '#000000'): string => parseHex(input) ?? fallback;

export const hexToRgb = (hex: string): Rgb => {
  const n = parseInt(normalizeHex(hex).slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};

const channelHex = (n: number): string => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

export const rgbToHex = ([r, g, b]: Rgb): string => `#${channelHex(r)}${channelHex(g)}${channelHex(b)}`;

export const hexToRgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const mixHex = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
};

const unitRgb = (hex: string): Rgb => {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
};

const hueOf = (r: number, g: number, b: number, max: number, d: number): number => {
  if (d === 0) return 0;
  const raw = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (raw * 60 + 360) % 360;
};

export const hexToHsv = (hex: string): Hsv => {
  const [r, g, b] = unitRgb(hex);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  return { h: hueOf(r, g, b, max, d), s: max === 0 ? 0 : d / max, v: max };
};

export const hsvToHex = ({ h, s, v }: Hsv): string => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return rgbToHex([f(5) * 255, f(3) * 255, f(1) * 255]);
};

export const hexToHsl = (hex: string): Rgb => {
  const [r, g, b] = unitRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
  return [hueOf(r, g, b, max, d), s * 100, l * 100];
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return ln - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
};

export const adjustLightness = (hex: string, amount: number): string => {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + amount)));
};

export const withLightness = (hex: string, lightness: number): string => {
  const [h, s] = hexToHsl(hex);
  return hslToHex(h, s, lightness);
};

const linear = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

export const contrastRatio = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

export const readableTextOn = (background: string): string =>
  contrastRatio(background, '#ffffff') >= contrastRatio(background, '#000000') ? '#ffffff' : '#000000';

export const ensureContrast = (hex: string, against: string, minimum: number): string => {
  if (contrastRatio(hex, against) >= minimum) return hex;
  const [h, s, l] = hexToHsl(hex);
  const direction = luminance(against) > 0.5 ? -1 : 1;
  const shades = Array.from({ length: 100 }, (_, i) => hslToHex(h, s, Math.max(0, Math.min(100, l + direction * (i + 1)))));
  return shades.find((shade) => contrastRatio(shade, against) >= minimum) ?? (direction < 0 ? '#000000' : '#ffffff');
};
