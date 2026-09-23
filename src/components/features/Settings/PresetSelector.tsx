import { memo } from 'react';
import { SCENE_PRESETS } from '@/constants/presets';
import { LOOKS, expandLook } from '@/lib/effects';
import { useStore } from '@/store';
import styles from './PresetSelector.module.scss';

const LOOK_SWATCHES: Record<string, { bg: string; fg: string }> = {
  crt: { bg: 'repeating-linear-gradient(#0c1f14 0 2px, #07120b 2px 4px)', fg: '#39ff88' },
  vhs: { bg: 'linear-gradient(90deg, #2b0f3a, #0f2b3a)', fg: '#ff9ad5' },
  cyberpunk: { bg: 'linear-gradient(135deg, #12002e, #3a0066)', fg: '#00f0ff' },
  film: { bg: 'radial-gradient(circle, #3b3226, #14110d)', fg: '#f2e8d5' },
  newsprint: { bg: 'radial-gradient(#1c1c1c 22%, transparent 24%) 0 0 / 6px 6px, #f2ede2', fg: '#1c1c1c' },
  xerox: { bg: '#f6f4ef', fg: '#101010' },
  riso: { bg: 'linear-gradient(135deg, #ff5a5f 50%, #2b3a67 50%)', fg: '#ffffff' },
  neon: { bg: '#07070c', fg: '#4cc9f0' },
};

export const PresetSelector = memo(function PresetSelector() {
  const applyPreset = useStore((s) => s.applyPreset);
  const activePreset = useStore((s) => s.activePreset);
  const setEffects = useStore((s) => s.setEffects);

  return (
    <div className={styles.presetSelector}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Scenes</h4>
        <div className={styles.grid}>
          {SCENE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`${styles.presetCard} ${activePreset === preset.id ? styles.selected : ''}`}
              onClick={() => applyPreset(preset.id)}
              aria-label={`Apply ${preset.name} scene`}
              aria-pressed={activePreset === preset.id}
              title={preset.description}
            >
              <div className={styles.preview} style={{ background: preset.previewBg, color: preset.previewFg }}>
                <span className={styles.previewText}>{preset.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          Looks <span className={styles.sectionNote}>replace the effect stack, keep the background</span>
        </h4>
        <div className={styles.grid}>
          {LOOKS.map((look) => {
            const swatch = LOOK_SWATCHES[look.id] ?? { bg: '#202020', fg: '#e7e5e4' };
            return (
              <button
                key={look.id}
                type="button"
                className={styles.presetCard}
                onClick={() => setEffects(expandLook(look))}
                aria-label={`Apply ${look.label} look`}
                title={look.description}
              >
                <div className={styles.preview} style={{ background: swatch.bg, color: swatch.fg }}>
                  <span className={styles.previewText}>{look.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
