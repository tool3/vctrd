import { parse, serialize, withAttributes } from 'vctrfx';
import type { SvgDocument, SvgElement } from 'vctrfx';
import type { ContentBox } from '@/types';

export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
export const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

export interface Size {
  width: number;
  height: number;
}

interface Box extends Size {
  x: number;
  y: number;
}

export const round = (value: number): number => Math.round(value * 100) / 100;

const parseLength = (value: string | undefined): number | null => {
  const match = /^\s*(\d*\.?\d+)\s*(px)?\s*$/.exec(value ?? '');
  const parsed = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseViewBox = (value: string | undefined): Box | null => {
  const parts = (value ?? '').trim().split(/[\s,]+/).map(Number);
  const [x, y, width, height] = parts;
  return parts.length === 4 &&
    x !== undefined &&
    y !== undefined &&
    width !== undefined &&
    height !== undefined &&
    parts.every(Number.isFinite) &&
    width > 0 &&
    height > 0
    ? { x, y, width, height }
    : null;
};

const deriveSize = (width: number | null, height: number | null, viewBox: Box | null): Size | null => {
  if (width !== null && height !== null) return { width, height };
  if (viewBox === null) return null;
  const ratio = viewBox.height / viewBox.width;
  if (width !== null) return { width, height: width * ratio };
  if (height !== null) return { width: height / ratio, height };
  return { width: viewBox.width, height: viewBox.height };
};

const formatBox = (box: Box): string => [box.x, box.y, box.width, box.height].map(round).join(' ');

export const normalizeArtwork = (root: SvgElement, scale: number, source: string, crop: ContentBox | null): SvgElement => {
  const viewBox = parseViewBox(root.attributes.viewBox);
  const natural = deriveSize(parseLength(root.attributes.width), parseLength(root.attributes.height), viewBox);
  if (natural === null) throw new Error('The SVG needs a viewBox, or a width and a height, to know how big it is.');
  const full = viewBox ?? { x: 0, y: 0, ...natural };
  const box = crop ?? full;
  const unit = natural.width / full.width;
  const size = crop ? { width: crop.width * unit, height: crop.height * natural.height / full.height } : natural;
  const needsXlink = root.attributes['xmlns:xlink'] === undefined && source.includes('xlink:');
  return withAttributes(root, {
    xmlns: root.attributes.xmlns ?? SVG_NAMESPACE,
    'xmlns:xlink': needsXlink ? XLINK_NAMESPACE : undefined,
    viewBox: formatBox(box),
    preserveAspectRatio: crop ? 'none' : undefined,
    width: round(size.width * scale),
    height: round(size.height * scale),
  });
};

export const sizeOf = (root: SvgElement): Size => ({
  width: Number(root.attributes.width) || 0,
  height: Number(root.attributes.height) || 0,
});

export const withoutAttributes = (target: SvgElement, names: readonly string[]): SvgElement => ({
  ...target,
  attributes: Object.fromEntries(Object.entries(target.attributes).filter(([name]) => !names.includes(name))),
});

export const toDocument = (doc: SvgDocument, root: SvgElement): string => serialize({ ...doc, root });

const ANIMATION = /<(?:animate|animateTransform|animateMotion|set)\b|@keyframes|animation\s*:/;

export const isAnimated = (svg: string): boolean => ANIMATION.test(svg);

export const reformat = (svg: string, format: 'pretty' | 'minify'): string => serialize(parse(svg), format);

export const formatBytes = (bytes: number): string =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
