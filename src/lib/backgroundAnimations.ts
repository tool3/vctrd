import type { BackgroundAnimation } from '@/types';

export interface AnimationFrame {
  width: number;
  height: number;
  inset: { x: number; y: number; width: number; height: number };
  radius: number;
  prefix: string;
}

const fixed = (value: number, digits = 1): string => value.toFixed(digits);

const lcg = (seed: number): number => (seed * 16807) % 2147483647;

const randomSequence = (seed: number, count: number): number[] =>
  Array.from({ length: count }).reduce<{ seed: number; values: number[] }>(
    (acc) => {
      const next = lcg(acc.seed);
      return { seed: next, values: [...acc.values, (next - 1) / 2147483646] };
    },
    { seed, values: [] },
  ).values;

const roundedPerimeter = (w: number, h: number, r: number): number => {
  const clamped = Math.min(r, w / 2, h / 2);
  return 2 * (w - 2 * clamped) + 2 * (h - 2 * clamped) + 2 * Math.PI * clamped;
};

const particles = ({ width: w, height: h }: AnimationFrame): string => {
  const values = randomSequence(7, 24 * 6);
  return Array.from({ length: 24 }, (_, i) => {
    const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0] = values.slice(i * 6, i * 6 + 6);
    const x = a * w;
    const r = 1 + b * 2.5;
    const dur = 10 + c * 18;
    const delay = d * dur;
    const opacity = 0.15 + e * 0.35;
    const drift = -30 + f * 60;
    const startY = h + r * 2;
    const endY = -r * 2;
    const timing = `dur="${fixed(dur)}s" begin="-${fixed(delay)}s" repeatCount="indefinite"`;
    return `<circle cx="${fixed(x)}" cy="${startY}" r="${fixed(r)}" fill="rgba(255,255,255,${fixed(opacity, 2)})"><animate attributeName="cy" values="${startY};${endY}" ${timing}/><animate attributeName="cx" values="${fixed(x)};${fixed(x + drift)};${fixed(x)}" ${timing}/><animate attributeName="opacity" values="0;${fixed(opacity, 2)};${fixed(opacity, 2)};0" keyTimes="0;0.1;0.9;1" ${timing}/></circle>`;
  }).join('');
};

const borderPulse = ({ inset, radius, width, height }: AnimationFrame): string => {
  const { x, y, width: iw, height: ih } = inset;
  const cr = Math.min(radius, iw / 2, ih / 2);
  const dur = 4;
  const room = Math.min(x, y, width - x - iw, height - y - ih);
  const expand = Math.max(12, Math.min(room * 0.8, 40));
  const spline = 'calcMode="spline" keySplines="0.2 0 0.4 1"';
  return Array.from({ length: 4 }, (_, i) => {
    const timing = `dur="${dur}s" begin="${fixed((i / 4) * dur)}s" repeatCount="indefinite"`;
    return `<rect x="${x}" y="${y}" width="${iw}" height="${ih}" rx="${cr}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" opacity="0"><animate attributeName="x" values="${x};${x - expand}" ${timing} ${spline}/><animate attributeName="y" values="${y};${y - expand}" ${timing} ${spline}/><animate attributeName="width" values="${iw};${iw + expand * 2}" ${timing} ${spline}/><animate attributeName="height" values="${ih};${ih + expand * 2}" ${timing} ${spline}/><animate attributeName="rx" values="${cr};${cr + expand * 0.3}" ${timing} ${spline}/><animate attributeName="opacity" values="0.25;0" ${timing} calcMode="spline" keySplines="0.3 0 0.7 1"/><animate attributeName="stroke-width" values="1.5;0.3" ${timing} calcMode="spline" keySplines="0.3 0 0.7 1"/></rect>`;
  }).join('');
};

const waves = ({ width: w, height: h }: AnimationFrame): string => {
  const count = Math.max(20, Math.round(h / 12));
  return Array.from({ length: count }, (_, i) => {
    const baseY = (i / count) * h;
    const points = Array.from({ length: Math.floor(w / 4) + 1 }, (_, step) => {
      const x = step * 4;
      const warp = Math.sin(x * 0.008 + i * 0.3) * 12 + Math.sin(x * 0.015 + i * 0.5) * 8;
      return `${x},${fixed(baseY + warp)}`;
    }).join(' ');
    const amp = 4 + (i % 5) * 2;
    const dur = 6 + (i % 4) * 2;
    const delay = (i * 0.3) % dur;
    return `<polyline points="${points}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.6"><animateTransform attributeName="transform" type="translate" values="0,${-amp};0,${amp};0,${-amp}" dur="${dur}s" begin="-${fixed(delay)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/></polyline>`;
  }).join('');
};

const borderGradient = ({ inset, radius, prefix }: AnimationFrame): string => {
  const { x, y, width: iw, height: ih } = inset;
  const cr = Math.min(radius, iw / 2, ih / 2);
  const cx = x + iw / 2;
  const cy = y + ih / 2;
  const diag = Math.sqrt(iw * iw + ih * ih) / 2;
  const id = `${prefix}-anim-border`;
  return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${cx - diag}" y1="${cy}" x2="${cx + diag}" y2="${cy}"><stop offset="0%" stop-color="rgba(100,180,255,0.5)"/><stop offset="25%" stop-color="rgba(200,100,255,0.4)"/><stop offset="50%" stop-color="rgba(255,100,180,0.5)"/><stop offset="75%" stop-color="rgba(100,255,200,0.4)"/><stop offset="100%" stop-color="rgba(100,180,255,0.5)"/><animateTransform attributeName="gradientTransform" type="rotate" values="0 ${cx} ${cy};360 ${cx} ${cy}" dur="6s" repeatCount="indefinite"/></linearGradient></defs><rect x="${x}" y="${y}" width="${iw}" height="${ih}" rx="${cr}" fill="none" stroke="url(#${id})" stroke-width="2"/><rect x="${x}" y="${y}" width="${iw}" height="${ih}" rx="${cr}" fill="none" stroke="url(#${id})" stroke-width="8" opacity="0.15"/>`;
};

const borderShimmer = ({ inset, radius }: AnimationFrame): string => {
  const { x, y, width: iw, height: ih } = inset;
  const cr = Math.min(radius, iw / 2, ih / 2);
  const perimeter = roundedPerimeter(iw, ih, cr);
  const segment = perimeter * 0.3;
  const rect = `x="${x}" y="${y}" width="${iw}" height="${ih}" rx="${cr}" fill="none"`;
  const travel = `<animate attributeName="stroke-dashoffset" values="0;${fixed(-perimeter, 0)}" dur="8s" repeatCount="indefinite" calcMode="linear"/>`;
  const pulse = (from: number, to: number) =>
    `<animate attributeName="stroke-opacity" values="${from};${to};${from}" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>`;
  return `<rect ${rect} stroke="rgba(255,255,255,0.05)" stroke-width="1"/><rect ${rect} stroke="rgba(255,255,255,0.08)" stroke-width="10" stroke-dasharray="${fixed(segment, 0)} ${fixed(perimeter - segment, 0)}" stroke-linecap="round">${pulse(0.03, 0.1)}${travel}</rect><rect ${rect} stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="${fixed(segment * 0.5, 0)} ${fixed(perimeter - segment * 0.5, 0)}" stroke-linecap="round">${pulse(0.1, 0.35)}${travel}</rect>`;
};

const aurora = ({ width: w, height: h, prefix }: AnimationFrame): string => {
  const cx = w / 2;
  const cy = h / 2;
  const blob = Math.max(w, h) * 0.4;
  const gradient = (id: string, hue: string) =>
    `<radialGradient id="${id}"><stop offset="0%" stop-color="${hue}" stop-opacity="0.3"/><stop offset="60%" stop-color="${hue}" stop-opacity="0.1"/><stop offset="100%" stop-color="${hue}" stop-opacity="0"/></radialGradient>`;
  return `<defs>${gradient(`${prefix}-aurora-a`, '#7C9BF5')}${gradient(`${prefix}-aurora-b`, '#D4A0F5')}</defs><ellipse cx="${cx}" cy="${cy}" rx="${fixed(blob, 0)}" ry="${fixed(blob * 0.7, 0)}" fill="url(#${prefix}-aurora-a)"><animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${cy};360 ${cx} ${cy}" dur="30s" repeatCount="indefinite"/></ellipse><ellipse cx="${cx}" cy="${cy}" rx="${fixed(blob * 0.8, 0)}" ry="${fixed(blob * 0.6, 0)}" fill="url(#${prefix}-aurora-b)"><animateTransform attributeName="transform" type="rotate" values="360 ${cx} ${cy};0 ${cx} ${cy}" dur="24s" repeatCount="indefinite"/></ellipse>`;
};

const drift = ({ width: w, height: h, prefix }: AnimationFrame): string => {
  const sp = 48;
  return `<defs><pattern id="${prefix}-anim-grid" width="${sp}" height="${sp}" patternUnits="userSpaceOnUse"><path d="M${sp},0 V${sp} M0,${sp} H${sp}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.8"/><animateTransform attributeName="patternTransform" type="translate" from="0,0" to="${sp},${sp}" dur="20s" repeatCount="indefinite"/></pattern><linearGradient id="${prefix}-anim-grid-fade" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="white" stop-opacity="1"/><stop offset="50%" stop-color="white" stop-opacity="0.4"/><stop offset="100%" stop-color="white" stop-opacity="1"/><animateTransform attributeName="gradientTransform" type="translate" values="-1,-1;1,1;-1,-1" dur="8s" repeatCount="indefinite"/></linearGradient><mask id="${prefix}-anim-grid-mask"><rect width="${w}" height="${h}" fill="url(#${prefix}-anim-grid-fade)"/></mask></defs><rect width="${w}" height="${h}" fill="url(#${prefix}-anim-grid)" mask="url(#${prefix}-anim-grid-mask)"/>`;
};

const GENERATORS: Record<BackgroundAnimation, (frame: AnimationFrame) => string> = {
  particles,
  'border-pulse': borderPulse,
  waves,
  'border-gradient': borderGradient,
  'border-shimmer': borderShimmer,
  aurora,
  grid: drift,
};

export const backgroundAnimation = (animation: BackgroundAnimation | null, frame: AnimationFrame): string =>
  animation ? GENERATORS[animation](frame) : '';

export const ANIMATION_OPTIONS: ReadonlyArray<{ value: BackgroundAnimation | 'none'; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'particles', label: 'Particles' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'waves', label: 'Waves' },
  { value: 'grid', label: 'Drifting grid' },
  { value: 'border-pulse', label: 'Pulsing border' },
  { value: 'border-gradient', label: 'Border gradient' },
  { value: 'border-shimmer', label: 'Border shimmer' },
];
