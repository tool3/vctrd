import { createGradient } from '@/lib/gradient';
import type { ArtworkConfig, BackgroundConfig, ExportSettings, PaddingTuple, PipelineSettings } from '@/types';

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'none',
  color: '#101014',
  gradient: createGradient(['#ff69b4', '#7c2bff'], 'linear', 135),
  image: null,
  imageFit: 'cover',
  patternType: 'dotted',
  patternBaseType: 'solid',
  patternColor: 'rgba(255,255,255,0.35)',
  patternSize: 24,
  patternThickness: 2,
  patternOpacity: 1,
  animation: null,
  radius: 16,
  aspectRatio: 'auto',
};

export const DEFAULT_ARTWORK: ArtworkConfig = {
  trim: true,
  scale: 2,
  radius: 0,
  shadow: {
    enabled: false,
    blur: 24,
    offsetY: 12,
    opacity: 0.45,
    color: '#000000',
  },
};

export const DEFAULT_PADDING: PaddingTuple = [48, 48, 48, 48];

export const DEFAULT_PIPELINE: PipelineSettings = {
  seed: 'vctrfx',
  animate: true,
  clip: 'shape',
  scope: 'artwork',
};

export const DEFAULT_EXPORT: ExportSettings = {
  format: 'svg',
  scale: 2,
  quality: 0.92,
  minify: false,
  fps: 30,
  duration: null,
  matte: '#000000',
  filename: '',
};

export const PADDING_MIN = 0;
export const PADDING_MAX = 256;

export const SCALE_MIN = 0.25;
export const SCALE_MAX = 8;

export const RADIUS_MAX = 96;

export const PATTERN_SIZE_MIN = 4;
export const PATTERN_SIZE_MAX = 96;
export const PATTERN_THICKNESS_MIN = 0.5;
export const PATTERN_THICKNESS_MAX = 8;
