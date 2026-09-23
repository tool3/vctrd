import { memo, type ChangeEvent } from 'react';
import { Button, ColorPicker, Select, Slider } from '@/components/common';
import {
  PATTERN_SIZE_MAX,
  PATTERN_SIZE_MIN,
  PATTERN_THICKNESS_MAX,
  PATTERN_THICKNESS_MIN,
  RADIUS_MAX,
} from '@/constants/defaults';
import { ANIMATION_OPTIONS } from '@/lib/backgroundAnimations';
import { readDataUrl } from '@/lib/files';
import { useStore } from '@/store';
import type { AspectRatio, BackgroundAnimation, BackgroundType, ImageFit, PatternBaseType, PatternType } from '@/types';
import { GradientDesigner } from './GradientDesigner';
import styles from './Settings.module.scss';

const TYPE_OPTIONS: ReadonlyArray<{ value: BackgroundType; label: string }> = [
  { value: 'none', label: 'None (transparent)' },
  { value: 'solid', label: 'Solid colour' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'image', label: 'Image' },
];

const PATTERN_OPTIONS: ReadonlyArray<{ value: PatternType; label: string }> = [
  { value: 'dotted', label: 'Dotted' },
  { value: 'grid', label: 'Grid' },
  { value: 'lines', label: 'Diagonal lines' },
  { value: 'noise', label: 'Noise' },
  { value: 'topographic', label: 'Topographic' },
];

export const ASPECT_OPTIONS: ReadonlyArray<{ value: AspectRatio; label: string }> = [
  { value: 'auto', label: 'Auto (fit content)' },
  { value: '1:1', label: '1:1 Square' },
  { value: '4:5', label: '4:5 Portrait post' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
  { value: '16:9', label: '16:9 Widescreen' },
  { value: '9:16', label: '9:16 Story' },
  { value: '3:4', label: '3:4' },
  { value: '2:3', label: '2:3' },
];

const patternSizeLabel = (type: PatternType): string =>
  type === 'grid' ? 'Cell size' : type === 'noise' ? 'Grain' : 'Spacing';

const px = (value: number): string => `${value}px`;

export const BackgroundSection = memo(function BackgroundSection({ size }: { size: { width: number; height: number } | null }) {
  const background = useStore((s) => s.background);
  const setBackground = useStore((s) => s.setBackground);
  const isPattern = background.type === 'pattern';
  const showsColor = background.type === 'solid' || (isPattern && background.patternBaseType === 'solid');
  const showsGradient = background.type === 'gradient' || (isPattern && background.patternBaseType === 'gradient');
  const aspect = size && size.height > 0 ? size.width / size.height : 1.6;

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) setBackground({ image: await readDataUrl(file), type: 'image' });
  };

  return (
    <div className={styles.stack}>
      <Select
        label="Type"
        options={TYPE_OPTIONS}
        value={background.type}
        onChange={(type) => setBackground({ type: type as BackgroundType })}
        fullWidth
      />

      {showsColor && (
        <ColorPicker
          label={isPattern ? 'Base colour' : 'Colour'}
          value={background.color}
          onChange={(color) => setBackground({ color })}
          fullWidth
        />
      )}

      {showsGradient && (
        <GradientDesigner value={background.gradient} onChange={(gradient) => setBackground({ gradient })} aspect={aspect} />
      )}

      {isPattern && (
        <>
          <div className={styles.row}>
            <Select
              label="Pattern"
              options={PATTERN_OPTIONS}
              value={background.patternType}
              onChange={(patternType) => setBackground({ patternType: patternType as PatternType })}
              fullWidth
            />
            <Select
              label="Base"
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'gradient', label: 'Gradient' },
              ]}
              value={background.patternBaseType}
              onChange={(patternBaseType) => setBackground({ patternBaseType: patternBaseType as PatternBaseType })}
              fullWidth
            />
          </div>
          <ColorPicker
            label="Pattern colour"
            value={background.patternColor}
            onChange={(patternColor) => setBackground({ patternColor })}
            placeholder="rgba(255,255,255,0.35)"
            fullWidth
          />
          <Slider
            label={patternSizeLabel(background.patternType)}
            value={background.patternSize}
            onChange={(patternSize) => setBackground({ patternSize })}
            min={PATTERN_SIZE_MIN}
            max={PATTERN_SIZE_MAX}
            formatValue={px}
          />
          {background.patternType !== 'noise' && (
            <Slider
              label={background.patternType === 'dotted' ? 'Dot size' : 'Thickness'}
              value={background.patternThickness}
              onChange={(patternThickness) => setBackground({ patternThickness })}
              min={PATTERN_THICKNESS_MIN}
              max={PATTERN_THICKNESS_MAX}
              step={0.5}
              formatValue={px}
            />
          )}
          <Slider
            label="Opacity"
            value={background.patternOpacity}
            onChange={(patternOpacity) => setBackground({ patternOpacity })}
            min={0}
            max={1}
            step={0.05}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </>
      )}

      {background.type === 'image' && (
        <>
          <div className={styles.imageUpload}>
            {background.image ? (
              <div className={styles.imagePreview}>
                <img src={background.image} alt="Background" />
                <Button
                  variant="ghost"
                  size="sm"
                  icon="x"
                  onClick={() => setBackground({ image: null })}
                  className={styles.removeImage}
                  aria-label="Remove image"
                />
              </div>
            ) : (
              <label className={styles.uploadButton}>
                <input type="file" accept="image/*" onChange={uploadImage} hidden />
                <span>Upload image</span>
              </label>
            )}
          </div>
          <Select
            label="Fit"
            options={[
              { value: 'cover', label: 'Cover' },
              { value: 'contain', label: 'Contain' },
            ]}
            value={background.imageFit}
            onChange={(imageFit) => setBackground({ imageFit: imageFit as ImageFit })}
            fullWidth
          />
        </>
      )}

      <Select
        label="Animation"
        options={ANIMATION_OPTIONS}
        value={background.animation ?? 'none'}
        onChange={(value) => setBackground({ animation: value === 'none' ? null : (value as BackgroundAnimation) })}
        fullWidth
      />

      <Slider
        label="Corner radius"
        value={background.radius}
        onChange={(radius) => setBackground({ radius })}
        min={0}
        max={RADIUS_MAX}
        formatValue={px}
      />

      <Select
        label="Aspect ratio"
        options={ASPECT_OPTIONS}
        value={background.aspectRatio}
        onChange={(aspectRatio) => setBackground({ aspectRatio: aspectRatio as AspectRatio })}
        fullWidth
      />
    </div>
  );
});
