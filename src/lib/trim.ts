import { parse } from 'vctrfx';
import type { ContentBox } from '@/types';
import { decodeSvg } from './export';
import { isAnimated, normalizeArtwork, sizeOf, toDocument } from './svg';
import { frameAt, prepareTimeline } from './timeline';

const TARGET_EDGE = 1200;
const ALPHA_THRESHOLD = 6;
const ANIMATION_SAMPLES = 12;
const ANIMATION_SLACK = 0.02;

interface PixelBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const scanAlpha = (data: Uint8ClampedArray, width: number, height: number): PixelBounds | null => {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3]! > ALPHA_THRESHOLD) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return right < 0 ? null : { left, top, right: right + 1, bottom: bottom + 1 };
};

const union = (boxes: readonly PixelBounds[]): PixelBounds | null =>
  boxes.length === 0
    ? null
    : boxes.reduce((acc, box) => ({
        left: Math.min(acc.left, box.left),
        top: Math.min(acc.top, box.top),
        right: Math.max(acc.right, box.right),
        bottom: Math.max(acc.bottom, box.bottom),
      }));

const measureFrame = async (svg: string, width: number, height: number): Promise<PixelBounds | null> => {
  const image = await decodeSvg(svg);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);
  return scanAlpha(context.getImageData(0, 0, width, height).data, width, height);
};

const framesOf = (svg: string): string[] => {
  if (!isAnimated(svg)) return [svg];
  const timeline = prepareTimeline(svg);
  return timeline.animated
    ? Array.from({ length: ANIMATION_SAMPLES }, (_, i) => frameAt(timeline, (timeline.duration * i) / ANIMATION_SAMPLES))
    : [svg];
};

export const measureContentBox = async (source: string): Promise<ContentBox | null> => {
  const document = parse(source);
  const base = normalizeArtwork(document.root, 1, source, null);
  const size = sizeOf(base);
  const [vx = 0, vy = 0, vw = size.width, vh = size.height] = (base.attributes.viewBox ?? '').split(' ').map(Number);
  const factor = Math.min(TARGET_EDGE / Math.max(size.width, size.height), 8);
  const width = Math.max(1, Math.round(size.width * factor));
  const height = Math.max(1, Math.round(size.height * factor));
  const scaled = normalizeArtwork(document.root, factor, source, null);
  const frames = framesOf(toDocument(document, scaled));
  const measured = union(
    (await Promise.all(frames.map((frame) => measureFrame(frame, width, height)))).flatMap((box) => (box ? [box] : [])),
  );
  if (!measured) return null;
  const slack = frames.length > 1 ? Math.round(Math.max(width, height) * ANIMATION_SLACK) : 0;
  const bounds = {
    left: Math.max(0, measured.left - slack),
    top: Math.max(0, measured.top - slack),
    right: Math.min(width, measured.right + slack),
    bottom: Math.min(height, measured.bottom + slack),
  };
  const toUnits = (px: number, total: number, span: number) => (px / total) * span;
  const box = {
    x: vx + toUnits(bounds.left, width, vw),
    y: vy + toUnits(bounds.top, height, vh),
    width: toUnits(bounds.right - bounds.left, width, vw),
    height: toUnits(bounds.bottom - bounds.top, height, vh),
  };
  const untouched = bounds.left <= 1 && bounds.top <= 1 && bounds.right >= width - 1 && bounds.bottom >= height - 1;
  return untouched ? null : box;
};
