import { useId } from 'react';
import styles from './NumberSlider.module.scss';

interface NumberSliderProps {
  label?: string;
  value?: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  className?: string;
}

const decimalsOf = (step: number): number => (String(step).split('.')[1] ?? '').length;

export function NumberSlider({ label, value, onChange, min, max, step = 1, suffix = '', className = '' }: NumberSliderProps) {
  const id = useId();
  const safeValue = value ?? min;
  const percentage = ((safeValue - min) / (max - min)) * 100;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.sliderContainer}>
        <div className={styles.sliderWrapper}>
          <input
            type="range"
            id={id}
            className={styles.slider}
            value={safeValue}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
          />
          <div className={styles.sliderTrack}>
            <div className={styles.sliderFill} style={{ width: `${percentage}%` }} />
          </div>
        </div>
        <span className={styles.value}>
          {safeValue.toFixed(decimalsOf(step))}
          {suffix}
        </span>
      </div>
    </div>
  );
}
