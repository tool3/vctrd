import type { EffectConfig } from '@/lib/effects';

export type BackgroundType = 'none' | 'solid' | 'gradient' | 'pattern' | 'image';

export type PatternType = 'dotted' | 'grid' | 'lines' | 'noise' | 'topographic';

export type PatternBaseType = 'solid' | 'gradient';

export type GradientKind = 'linear' | 'radial' | 'conic';

export interface GradientStop {
  id: string;
  color: string;
  offset: number;
  opacity: number;
}

export interface GradientConfig {
  kind: GradientKind;
  angle: number;
  center: { x: number; y: number };
  stops: GradientStop[];
}

export type AspectRatio = 'auto' | '1:1' | '4:3' | '3:2' | '16:9' | '9:16' | '3:4' | '2:3' | '4:5';

export type BackgroundAnimation =
  | 'particles'
  | 'border-pulse'
  | 'waves'
  | 'border-gradient'
  | 'border-shimmer'
  | 'aurora'
  | 'grid';

export type ImageFit = 'cover' | 'contain';

export type PaddingTuple = readonly [number, number, number, number];

export interface BackgroundConfig {
  type: BackgroundType;
  color: string;
  gradient: GradientConfig;
  image: string | null;
  imageFit: ImageFit;
  patternType: PatternType;
  patternBaseType: PatternBaseType;
  patternColor: string;
  patternSize: number;
  patternThickness: number;
  patternOpacity: number;
  animation: BackgroundAnimation | null;
  radius: number;
  aspectRatio: AspectRatio;
}

export interface ShadowConfig {
  enabled: boolean;
  blur: number;
  offsetY: number;
  opacity: number;
  color: string;
}

export interface ContentBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArtworkConfig {
  trim: boolean;
  scale: number;
  radius: number;
  shadow: ShadowConfig;
}

export type EffectScope = 'artwork' | 'canvas';

export interface PipelineSettings {
  seed: string;
  animate: boolean;
  clip: 'shape' | 'none';
  scope: EffectScope;
}

export type RasterFormat = 'png' | 'webp' | 'jpeg';

export type ExportFormat = 'svg' | RasterFormat | 'mp4';

export type ExportScale = 1 | 2 | 3 | 4;

export type VideoFps = 24 | 30 | 60;

export interface ExportSettings {
  format: ExportFormat;
  scale: ExportScale;
  quality: number;
  minify: boolean;
  fps: VideoFps;
  duration: number | null;
  matte: string;
  filename: string;
}

export interface RenderRequest {
  source: string;
  effects: readonly EffectConfig[];
  pipeline: PipelineSettings;
  background: BackgroundConfig;
  padding: PaddingTuple;
  artwork: ArtworkConfig;
  crop: ContentBox | null;
}

export interface RenderOutput {
  before: string;
  after: string;
  width: number;
  height: number;
  animated: boolean;
}

export type RenderResult =
  | ({ ok: true; ms: number } & RenderOutput)
  | { ok: false; ms: number; error: string };
