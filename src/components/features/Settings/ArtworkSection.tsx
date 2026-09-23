import { memo } from 'react';
import { ColorPicker, Slider, Toggle } from '@/components/common';
import { RADIUS_MAX, SCALE_MAX, SCALE_MIN } from '@/constants/defaults';
import { useStore } from '@/store';
import styles from './Settings.module.scss';

const SCALE_STEPS = [0.5, 1, 2, 3, 4] as const;

export const ArtworkSection = memo(function ArtworkSection({ size }: { size: { width: number; height: number } | null }) {
  const artwork = useStore((s) => s.artwork);
  const setArtwork = useStore((s) => s.setArtwork);
  const setShadow = useStore((s) => s.setShadow);
  const { shadow } = artwork;
  const dimensions = size ? ` · ${Math.round(size.width)}×${Math.round(size.height)}` : '';

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>Size</span>
          <span className={styles.hint}>
            {artwork.scale}×{dimensions}
          </span>
        </div>
        <div className={styles.stack}>
          <div className={styles.segmented} role="group" aria-label="Scale presets">
            {SCALE_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                className={`${styles.segment} ${artwork.scale === step ? styles.segmentActive : ''}`}
                onClick={() => setArtwork({ scale: step })}
              >
                {step}×
              </button>
            ))}
          </div>
          <Slider
            label="Scale"
            value={artwork.scale}
            onChange={(scale) => setArtwork({ scale })}
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.25}
            formatValue={(v) => `${v}×`}
          />
          <p className={styles.hint}>Vector all the way through: scaling changes the output size, not the sharpness.</p>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Frame</div>
        <div className={styles.stack}>
          <Slider
            label="Corner radius"
            value={artwork.radius}
            onChange={(radius) => setArtwork({ radius })}
            min={0}
            max={RADIUS_MAX}
            formatValue={(v) => `${v}px`}
          />
          <Toggle checked={shadow.enabled} onChange={(enabled) => setShadow({ enabled })} label="Drop shadow" />
          {shadow.enabled && (
            <>
              <Slider label="Blur" value={shadow.blur} onChange={(blur) => setShadow({ blur })} min={0} max={96} formatValue={(v) => `${v}px`} />
              <Slider
                label="Offset"
                value={shadow.offsetY}
                onChange={(offsetY) => setShadow({ offsetY })}
                min={-48}
                max={48}
                formatValue={(v) => `${v}px`}
              />
              <Slider
                label="Opacity"
                value={shadow.opacity}
                onChange={(opacity) => setShadow({ opacity })}
                min={0}
                max={1}
                step={0.05}
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />
              <ColorPicker label="Colour" value={shadow.color} onChange={(color) => setShadow({ color })} fullWidth />
            </>
          )}
        </div>
      </div>
    </>
  );
});
