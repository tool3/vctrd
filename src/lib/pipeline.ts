import { VctrfxError, parse, vctrfx } from 'vctrfx';
import type { SvgDocument, SvgElement, VctrfxSettings } from 'vctrfx';
import type { RenderOutput, RenderRequest, RenderResult } from '@/types';
import { composeCanvas, needsCanvas } from './background';
import { buildEffects } from './effects';
import { isAnimated, normalizeArtwork, sizeOf, toDocument } from './svg';

const settingsOf = (request: RenderRequest): VctrfxSettings => ({
  seed: request.pipeline.seed || 'vctrfx',
  animate: request.pipeline.animate,
  clip: request.pipeline.clip,
});

export const renderArtwork = (request: RenderRequest): RenderOutput => {
  const document: SvgDocument = parse(request.source);
  const artwork = normalizeArtwork(document.root, request.artwork.scale, request.source);
  const effects = buildEffects(request.effects);
  const settings = settingsOf(request);
  const apply = (svg: string): string => (effects.length > 0 ? vctrfx(svg, effects, settings) : svg);
  const source = toDocument(document, artwork);
  const framed = needsCanvas(request.background, request.padding, request.artwork);

  const compose = (root: SvgElement): SvgElement =>
    composeCanvas(root, {
      background: request.background,
      padding: request.padding,
      artwork: request.artwork,
      overflow: request.pipeline.clip === 'none',
    });

  const output = (before: SvgElement, after: string): RenderOutput => ({
    before: toDocument(document, before),
    after,
    ...sizeOf(before),
    animated: isAnimated(after),
  });

  if (!framed) return output(artwork, apply(source));

  const canvas = compose(artwork);
  if (request.pipeline.scope === 'canvas') return output(canvas, apply(toDocument(document, canvas)));

  const processed = parse(apply(source)).root;
  return output(canvas, toDocument(document, compose(processed)));
};

const describe = (error: unknown): string =>
  error instanceof VctrfxError || error instanceof Error ? error.message : 'Could not render this SVG.';

export const safeRender = (request: RenderRequest): RenderResult => {
  const started = performance.now();
  try {
    return { ok: true, ...renderArtwork(request), ms: performance.now() - started };
  } catch (error) {
    return { ok: false, error: describe(error), ms: performance.now() - started };
  }
};
