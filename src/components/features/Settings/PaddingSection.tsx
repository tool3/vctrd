import { memo, useState } from 'react';
import { NumberSlider } from '@/components/common';
import { PADDING_MAX, PADDING_MIN } from '@/constants/defaults';
import { useStore } from '@/store';
import type { PaddingTuple } from '@/types';
import styles from './Settings.module.scss';

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;

const withSide = ([top, right, bottom, left]: PaddingTuple, index: number, value: number): PaddingTuple => [
  index === 0 ? value : top,
  index === 1 ? value : right,
  index === 2 ? value : bottom,
  index === 3 ? value : left,
];

export const PaddingSection = memo(function PaddingSection() {
  const padding = useStore((s) => s.padding);
  const setPadding = useStore((s) => s.setPadding);
  const [individual, setIndividual] = useState(false);
  const uniform = padding.every((side) => side === padding[0]);
  const average = Math.round(padding.reduce((sum, side) => sum + side, 0) / padding.length);

  return (
    <div className={styles.stack}>
      <NumberSlider
        label="All"
        value={uniform ? padding[0] : average}
        onChange={(value) => setPadding([value, value, value, value])}
        min={PADDING_MIN}
        max={PADDING_MAX}
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
            />
          ))}
        </div>
      )}
      <p className={styles.hint}>Space between the artwork and the edge of the canvas. Transparent when there is no background.</p>
    </div>
  );
});
