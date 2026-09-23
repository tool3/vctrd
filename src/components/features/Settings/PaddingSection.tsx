import { memo, useState } from 'react';
import { NumberSlider, Toggle } from '@/components/common';
import { PADDING_MAX, PADDING_MIN } from '@/constants/defaults';
import { useStore } from '@/store';
import type { PaddingTuple } from '@/types';
import styles from './Settings.module.scss';

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;

const QUICK_SIZES = [0, 1, 4, 8, 16, 32, 64] as const;

const withSide = ([top, right, bottom, left]: PaddingTuple, index: number, value: number): PaddingTuple => [
  index === 0 ? value : top,
  index === 1 ? value : right,
  index === 2 ? value : bottom,
  index === 3 ? value : left,
];

export const PaddingSection = memo(function PaddingSection() {
  const padding = useStore((s) => s.padding);
  const setPadding = useStore((s) => s.setPadding);
  const trim = useStore((s) => s.artwork.trim);
  const setArtwork = useStore((s) => s.setArtwork);
  const trimmed = useStore((s) => (s.measured?.source === s.source ? s.measured.box : null) !== null);
  const [individual, setIndividual] = useState(false);
  const uniform = padding.every((side) => side === padding[0]);
  const average = Math.round(padding.reduce((sum, side) => sum + side, 0) / padding.length);

  return (
    <div className={styles.stack}>
      <div className={styles.segmented} role="group" aria-label="Quick padding">
        {QUICK_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            className={`${styles.segment} ${uniform && padding[0] === size ? styles.segmentActive : ''}`}
            onClick={() => setPadding([size, size, size, size])}
            aria-pressed={uniform && padding[0] === size}
          >
            {size === 0 ? 'None' : size}
          </button>
        ))}
      </div>
      <NumberSlider
        label="All"
        value={uniform ? padding[0] : average}
        onChange={(value) => setPadding([value, value, value, value])}
        min={PADDING_MIN}
        max={PADDING_MAX}
        suffix="px"
      />
      <button type="button" className={styles.individualToggle} onClick={() => setIndividual(!individual)}>
        <span>{individual ? 'Hide' : 'Individual'}</span>
        {!uniform && !individual && <span className={styles.mixedBadge}>Mixed</span>}
      </button>
      {individual && (
        <div className={styles.stack}>
          {SIDES.map((label, index) => (
            <NumberSlider
              key={label}
              label={label}
              value={padding[index]}
              onChange={(value) => setPadding(withSide(padding, index, value))}
              min={PADDING_MIN}
              max={PADDING_MAX}
              suffix="px"
            />
          ))}
        </div>
      )}
      <div className={styles.section}>
        <Toggle checked={trim} onChange={(value) => setArtwork({ trim: value })} label="Trim empty space inside the SVG" />
      </div>
      <p className={styles.hint}>
        {trim
          ? trimmed
            ? "The SVG's own built-in margin is trimmed, so padding is the only space around the artwork."
            : 'This SVG has no built-in margin to trim.'
          : "The SVG's own margin is kept and padding is added on top of it."}{' '}
        Click a value to type it; arrow keys nudge by 1, Shift by 10.
      </p>
    </div>
  );
});
