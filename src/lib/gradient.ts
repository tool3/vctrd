import { element } from 'vctrfx';
import type { SvgElement } from 'vctrfx';
import type { GradientConfig, GradientKind, GradientStop } from '@/types';
import { hexToRgba, mixHex, normalizeHex } from './color';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GradientPreset {
  label: string;
  kind: GradientKind;
  angle: number;
  colors: readonly string[];
}

const CONIC_WEDGES = 180;

const round = (value: number): number => Math.round(value * 1000) / 1000;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const newStopId = (): string => crypto.randomUUID().slice(0, 8);

export const createStop = (color: string, offset: number, opacity = 1): GradientStop => ({
  id: newStopId(),
  color: normalizeHex(color),
  offset: clamp01(offset),
  opacity: clamp01(opacity),
});

export const evenStops = (colors: readonly string[]): GradientStop[] =>
  colors.map((color, index) => createStop(color, colors.length > 1 ? index / (colors.length - 1) : 0));

export const createGradient = (colors: readonly string[], kind: GradientKind = 'linear', angle = 135): GradientConfig => ({
  kind,
  angle,
  center: { x: 0.5, y: 0.5 },
  stops: evenStops(colors),
});

export const fromPreset = (preset: GradientPreset, current: GradientConfig): GradientConfig => ({
  ...current,
  kind: preset.kind,
  angle: preset.angle,
  stops: evenStops(preset.colors),
});

export const sortedStops = (stops: readonly GradientStop[]): GradientStop[] => stops.toSorted((a, b) => a.offset - b.offset);

export const sampleAt = (stops: readonly GradientStop[], t: number): { color: string; opacity: number } => {
  const sorted = sortedStops(stops);
  const first = sorted[0];
  const last = sorted.at(-1);
  if (!first || !last) return { color: '#000000', opacity: 1 };
  if (t <= first.offset) return { color: first.color, opacity: first.opacity };
  if (t >= last.offset) return { color: last.color, opacity: last.opacity };
  const upper = sorted.findIndex((stop) => stop.offset >= t);
  const a = sorted[upper - 1] ?? first;
  const b = sorted[upper] ?? last;
  const span = b.offset - a.offset;
  const local = span > 0 ? (t - a.offset) / span : 0;
  return { color: mixHex(a.color, b.color, local), opacity: a.opacity + (b.opacity - a.opacity) * local };
};

export const reverseStops = (gradient: GradientConfig): GradientConfig => ({
  ...gradient,
  stops: gradient.stops.map((stop) => ({ ...stop, offset: round(1 - stop.offset) })),
});

export const distributeStops = (gradient: GradientConfig): GradientConfig => {
  const order = sortedStops(gradient.stops).map((stop) => stop.id);
  const step = order.length > 1 ? 1 / (order.length - 1) : 0;
  return { ...gradient, stops: gradient.stops.map((stop) => ({ ...stop, offset: round(order.indexOf(stop.id) * step) })) };
};

const cssStop = (stop: GradientStop): string =>
  `${stop.opacity >= 1 ? stop.color : hexToRgba(stop.color, stop.opacity)} ${round(stop.offset * 100)}%`;

export const stripCss = (gradient: GradientConfig): string =>
  `linear-gradient(90deg, ${sortedStops(gradient.stops).map(cssStop).join(', ')})`;

export const gradientCss = (gradient: GradientConfig): string => {
  const stops = sortedStops(gradient.stops).map(cssStop).join(', ');
  const at = `${round(gradient.center.x * 100)}% ${round(gradient.center.y * 100)}%`;
  switch (gradient.kind) {
    case 'linear':
      return `linear-gradient(${gradient.angle}deg, ${stops})`;
    case 'radial':
      return `radial-gradient(circle farthest-corner at ${at}, ${stops})`;
    case 'conic':
      return `conic-gradient(from ${gradient.angle}deg at ${at}, ${stops})`;
  }
};

const svgStops = (gradient: GradientConfig): SvgElement[] =>
  sortedStops(gradient.stops).map((stop) =>
    element('stop', {
      offset: round(stop.offset),
      'stop-color': stop.color,
      'stop-opacity': stop.opacity < 1 ? round(stop.opacity) : undefined,
    }),
  );

const centerOf = (gradient: GradientConfig, box: Box): { x: number; y: number } => ({
  x: box.x + box.width * gradient.center.x,
  y: box.y + box.height * gradient.center.y,
});

const farthestCorner = (point: { x: number; y: number }, box: Box): number =>
  Math.max(
    ...[
      [box.x, box.y],
      [box.x + box.width, box.y],
      [box.x, box.y + box.height],
      [box.x + box.width, box.y + box.height],
    ].map(([x = 0, y = 0]) => Math.hypot(x - point.x, y - point.y)),
  );

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

const linearDef = (id: string, gradient: GradientConfig, box: Box): SvgElement => {
  const angle = radians(gradient.angle);
  const direction = { x: Math.sin(angle), y: -Math.cos(angle) };
  const length = Math.abs(box.width * direction.x) + Math.abs(box.height * direction.y);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return element(
    'linearGradient',
    {
      id,
      gradientUnits: 'userSpaceOnUse',
      x1: round(cx - (direction.x * length) / 2),
      y1: round(cy - (direction.y * length) / 2),
      x2: round(cx + (direction.x * length) / 2),
      y2: round(cy + (direction.y * length) / 2),
    },
    svgStops(gradient),
  );
};

const radialDef = (id: string, gradient: GradientConfig, box: Box): SvgElement => {
  const center = centerOf(gradient, box);
  return element(
    'radialGradient',
    { id, gradientUnits: 'userSpaceOnUse', cx: round(center.x), cy: round(center.y), r: round(farthestCorner(center, box)) },
    svgStops(gradient),
  );
};

const conicWedges = (gradient: GradientConfig, box: Box, attributes: Record<string, string>): SvgElement => {
  const center = centerOf(gradient, box);
  const radius = farthestCorner(center, box) + 2;
  const step = 360 / CONIC_WEDGES;
  const pointAt = (degrees: number): string => {
    const angle = radians(gradient.angle + degrees);
    return `${round(center.x + radius * Math.sin(angle))} ${round(center.y - radius * Math.cos(angle))}`;
  };
  const wedges = Array.from({ length: CONIC_WEDGES }, (_, index) => {
    const sample = sampleAt(gradient.stops, (index + 0.5) / CONIC_WEDGES);
    return element('path', {
      d: `M${round(center.x)} ${round(center.y)}L${pointAt(index * step)}L${pointAt((index + 1) * step + 0.4)}Z`,
      fill: sample.color,
      'fill-opacity': sample.opacity < 1 ? round(sample.opacity) : undefined,
    });
  });
  return element('g', attributes, wedges);
};

export interface GradientLayer {
  defs: SvgElement[];
  node: SvgElement;
}

export const gradientLayer = (
  id: string,
  gradient: GradientConfig,
  box: Box,
  shape: Record<string, number>,
  clip: Record<string, string>,
): GradientLayer => {
  if (gradient.kind === 'conic') {
    const base = sampleAt(gradient.stops, 0);
    return {
      defs: [],
      node: element('g', {}, [element('rect', { ...shape, fill: base.color, 'fill-opacity': base.opacity < 1 ? 0 : undefined }), conicWedges(gradient, box, clip)]),
    };
  }
  const def = gradient.kind === 'linear' ? linearDef(id, gradient, box) : radialDef(id, gradient, box);
  return { defs: [def], node: element('rect', { ...shape, fill: `url(#${id})` }) };
};

export const GRADIENT_PRESETS: readonly GradientPreset[] = [
  { label: 'Hot pink', kind: 'linear', angle: 135, colors: ['#ff69b4', '#7c2bff'] },
  { label: 'Synth', kind: 'linear', angle: 135, colors: ['#FF1B6B', '#45CAFF'] },
  { label: 'Vaporwave', kind: 'linear', angle: 180, colors: ['#2b1055', '#d53a9d', '#ffbd59'] },
  { label: 'Deep blue', kind: 'linear', angle: 135, colors: ['#30C5D2', '#471069'] },
  { label: 'Orange gold', kind: 'linear', angle: 120, colors: ['#F9655B', '#EE821A'] },
  { label: 'Emerald', kind: 'linear', angle: 160, colors: ['#71B280', '#134E5E'] },
  { label: 'Ember', kind: 'radial', angle: 0, colors: ['#ff8c42', '#8a1c3b', '#12060c'] },
  { label: 'Midnight', kind: 'radial', angle: 0, colors: ['#3a4a8c', '#10122b', '#050508'] },
  { label: 'Aurora', kind: 'linear', angle: 200, colors: ['#0b1d3a', '#1f7a8c', '#7fe3c5', '#f4f1bb'] },
  { label: 'Spectrum', kind: 'conic', angle: 0, colors: ['#ff4d6d', '#ffbe0b', '#3ddc97', '#3a86ff', '#b5179e', '#ff4d6d'] },
  { label: 'Chrome', kind: 'conic', angle: 45, colors: ['#e6e6e6', '#8c8c8c', '#f5f5f5', '#6e6e6e', '#e6e6e6'] },
  { label: 'Charcoal', kind: 'linear', angle: 135, colors: ['#1e1e1e', '#3b3b3b'] },
];
