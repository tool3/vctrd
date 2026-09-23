import { element, withAttributes } from 'vctrfx';
import type { SvgElement, SvgNode } from 'vctrfx';
import type { ArtworkConfig, AspectRatio, BackgroundConfig, PaddingTuple } from '@/types';
import { backgroundAnimation } from './backgroundAnimations';
import { gradientLayer } from './gradient';
import { SVG_NAMESPACE, XLINK_NAMESPACE, round, sizeOf, type Size } from './svg';

const PREFIX = 'vctrd';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const raw = (value: string): SvgNode => ({ type: 'raw', value });

const url = (id: string): string => `url(#${id})`;

export interface CanvasLayout {
  width: number;
  height: number;
  x: number;
  y: number;
  artwork: Size;
}

const ratioOf = (aspect: AspectRatio): number | null => {
  if (aspect === 'auto') return null;
  const [w, h] = aspect.split(':').map(Number);
  return w && h ? w / h : null;
};

const fitToRatio = (size: Size, ratio: number | null): Size => {
  if (ratio === null || Math.abs(size.width / size.height - ratio) < 0.001) return size;
  return size.width / size.height > ratio
    ? { width: size.width, height: size.width / ratio }
    : { width: size.height * ratio, height: size.height };
};

export const layoutCanvas = (artwork: Size, padding: PaddingTuple, aspect: AspectRatio): CanvasLayout => {
  const [top, right, bottom, left] = padding;
  const inner = { width: artwork.width + left + right, height: artwork.height + top + bottom };
  const canvas = fitToRatio(inner, ratioOf(aspect));
  return {
    width: round(canvas.width),
    height: round(canvas.height),
    x: round(left + (canvas.width - inner.width) / 2),
    y: round(top + (canvas.height - inner.height) / 2),
    artwork,
  };
};

export const needsCanvas = (background: BackgroundConfig, padding: PaddingTuple, artwork: ArtworkConfig): boolean =>
  background.type !== 'none' ||
  background.animation !== null ||
  background.aspectRatio !== 'auto' ||
  padding.some((side) => side > 0) ||
  artwork.radius > 0 ||
  artwork.shadow.enabled;

const usesGradient = (background: BackgroundConfig): boolean =>
  background.type === 'gradient' || (background.type === 'pattern' && background.patternBaseType === 'gradient');

const TO_ALPHA = '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0';

const tintedFilter = (id: string, color: string, primitives: readonly SvgElement[]): SvgElement =>
  element('filter', { id, x: '0', y: '0', width: '1', height: '1' }, [
    ...primitives,
    element('feFlood', { 'flood-color': color, result: 'ink' }),
    element('feComposite', { in: 'ink', in2: 'shape', operator: 'in' }),
  ]);

interface PatternLayer {
  defs: readonly SvgElement[];
  paint: Record<string, string>;
}

const tile = (id: string, size: number, children: readonly SvgElement[], extra: Record<string, string> = {}): SvgElement =>
  element('pattern', { id, x: '0', y: '0', width: size, height: size, patternUnits: 'userSpaceOnUse', ...extra }, children);

const patternLayer = (background: BackgroundConfig): PatternLayer => {
  const id = `${PREFIX}-pattern`;
  const color = background.patternColor;
  const size = clamp(background.patternSize, 1, 512);
  const thickness = clamp(background.patternThickness, 0, 64);
  switch (background.patternType) {
    case 'dotted':
      return {
        defs: [
          tile(id, size, [
            element('circle', { cx: size / 2, cy: size / 2, r: clamp(thickness / 2, 0.25, size / 2 - 0.5), fill: color }),
          ]),
        ],
        paint: { fill: url(id) },
      };
    case 'grid':
      return {
        defs: [
          tile(id, size, [
            element('path', { d: `M ${size} 0 L 0 0 0 ${size}`, fill: 'none', stroke: color, 'stroke-width': clamp(thickness, 0.25, size / 2) }),
          ]),
        ],
        paint: { fill: url(id) },
      };
    case 'lines':
      return {
        defs: [
          tile(
            id,
            size,
            [element('path', { d: `M 0 0 L 0 ${size}`, fill: 'none', stroke: color, 'stroke-width': clamp(thickness, 0.25, size / 2) })],
            { patternTransform: 'rotate(45)' },
          ),
        ],
        paint: { fill: url(id) },
      };
    case 'noise':
      return {
        defs: [
          tintedFilter(id, color, [
            element('feTurbulence', {
              type: 'fractalNoise',
              baseFrequency: clamp(2 / size, 0.02, 1.5).toFixed(4),
              numOctaves: '2',
              stitchTiles: 'stitch',
              result: 'noise',
            }),
            element('feColorMatrix', { in: 'noise', type: 'matrix', values: TO_ALPHA, result: 'shape' }),
          ]),
        ],
        paint: { filter: url(id) },
      };
    case 'topographic': {
      const dilate = clamp((thickness - 0.5) / 2, 0, 4);
      return {
        defs: [
          tintedFilter(id, color, [
            element('feTurbulence', {
              type: 'fractalNoise',
              baseFrequency: clamp(0.6 / size, 0.003, 0.06).toFixed(4),
              numOctaves: '3',
              seed: '4',
              stitchTiles: 'stitch',
              result: 'noise',
            }),
            element('feColorMatrix', { in: 'noise', type: 'matrix', values: TO_ALPHA, result: 'alpha' }),
            element('feComponentTransfer', { in: 'alpha', result: dilate > 0 ? 'bands' : 'shape' }, [
              element('feFuncA', { type: 'discrete', tableValues: '0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0' }),
            ]),
            ...(dilate > 0 ? [element('feMorphology', { in: 'bands', operator: 'dilate', radius: dilate.toFixed(2), result: 'shape' })] : []),
          ]),
        ],
        paint: { filter: url(id) },
      };
    }
  }
};

const shadowFilter = (id: string, artwork: ArtworkConfig, layout: CanvasLayout): SvgElement =>
  element(
    'filter',
    { id, filterUnits: 'userSpaceOnUse', x: 0, y: 0, width: layout.width, height: layout.height, 'color-interpolation-filters': 'sRGB' },
    [
      element('feDropShadow', {
        dx: 0,
        dy: artwork.shadow.offsetY,
        stdDeviation: round(artwork.shadow.blur / 2),
        'flood-color': artwork.shadow.color,
        'flood-opacity': artwork.shadow.opacity,
      }),
    ],
  );

const roundedRect = (box: { x: number; y: number; width: number; height: number }, radius: number): Record<string, number> => {
  const r = clamp(radius, 0, Math.min(box.width, box.height) / 2);
  return { x: box.x, y: box.y, width: box.width, height: box.height, rx: r, ry: r };
};

export interface ComposeOptions {
  background: BackgroundConfig;
  padding: PaddingTuple;
  artwork: ArtworkConfig;
  overflow: boolean;
  silhouette: SvgElement | null;
}

const WHITE_WITH_ALPHA = '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0';

const silhouetteMask = (id: string, silhouette: SvgElement, box: { x: number; y: number; width: number; height: number }): SvgElement[] => [
  element('filter', { id: `${id}-alpha`, filterUnits: 'userSpaceOnUse', ...box, 'color-interpolation-filters': 'sRGB' }, [
    element('feColorMatrix', { type: 'matrix', values: WHITE_WITH_ALPHA }),
  ]),
  element('mask', { id, maskUnits: 'userSpaceOnUse', ...box }, [
    element('g', { filter: url(`${id}-alpha`) }, [withAttributes(silhouette, box)]),
  ]),
];

export const composeCanvas = (root: SvgElement, { background, padding, artwork, overflow, silhouette }: ComposeOptions): SvgElement => {
  const layout = layoutCanvas(sizeOf(root), padding, background.aspectRatio);
  const canvasBox = { x: 0, y: 0, width: layout.width, height: layout.height };
  const artworkBox = { x: layout.x, y: layout.y, ...layout.artwork };
  const canvasClipId = `${PREFIX}-canvas-clip`;
  const artworkClipId = `${PREFIX}-artwork-clip`;
  const shadowId = `${PREFIX}-shadow`;
  const maskId = `${PREFIX}-artwork-mask`;
  const pattern = background.type === 'pattern' ? patternLayer(background) : null;
  const clipToCanvas = { 'clip-path': url(canvasClipId) };
  const backdrop = roundedRect(canvasBox, background.radius);
  const paint = usesGradient(background)
    ? gradientLayer(`${PREFIX}-paint`, background.gradient, canvasBox, backdrop, clipToCanvas)
    : { defs: [], node: element('rect', { ...backdrop, fill: background.color }) };

  const defs = element('defs', {}, [
    element('clipPath', { id: canvasClipId }, [element('rect', backdrop)]),
    ...paint.defs,
    ...(pattern?.defs ?? []),
    ...(artwork.shadow.enabled ? [shadowFilter(shadowId, artwork, layout)] : []),
    ...(silhouette ? silhouetteMask(maskId, silhouette, artworkBox) : []),
    ...(artwork.radius > 0 ? [element('clipPath', { id: artworkClipId }, [element('rect', roundedRect(artworkBox, artwork.radius))])] : []),
  ]);

  const base: SvgNode[] =
    background.type === 'solid' || background.type === 'gradient' || background.type === 'pattern'
      ? [paint.node]
      : background.type === 'image' && background.image
        ? [
            element('image', {
              href: background.image,
              ...canvasBox,
              preserveAspectRatio: background.imageFit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet',
              ...clipToCanvas,
            }),
          ]
        : [];

  const overlay: SvgNode[] = pattern
    ? [element('rect', { ...backdrop, ...pattern.paint, opacity: clamp(background.patternOpacity, 0, 1) })]
    : [];

  const motion = backgroundAnimation(background.animation, {
    width: layout.width,
    height: layout.height,
    inset: artworkBox,
    radius: artwork.radius,
    prefix: PREFIX,
  });
  const animation: SvgNode[] = motion ? [element('g', clipToCanvas, [raw(motion)])] : [];

  const nested = withAttributes(root, {
    ...artworkBox,
    overflow: overflow ? 'visible' : undefined,
  });
  const contained = silhouette
    ? element('g', { mask: url(maskId), style: 'isolation:isolate' }, [nested])
    : element('g', { style: 'isolation:isolate' }, [nested]);
  const clipped = artwork.radius > 0 ? element('g', { 'clip-path': url(artworkClipId) }, [contained]) : contained;
  const shadowed = artwork.shadow.enabled ? element('g', { filter: url(shadowId) }, [clipped]) : clipped;

  return element(
    'svg',
    {
      xmlns: SVG_NAMESPACE,
      'xmlns:xlink': XLINK_NAMESPACE,
      width: layout.width,
      height: layout.height,
      viewBox: `0 0 ${layout.width} ${layout.height}`,
    },
    [defs, ...base, ...overlay, ...animation, shadowed],
  );
};
