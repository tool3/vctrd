import { useId, type CSSProperties, type InputHTMLAttributes } from 'react';
import styles from './Slider.module.scss';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value?: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  showValue = true,
  formatValue = String,
  className = '',
  id,
  ...props
}: SliderProps) {
  const generatedId = useId();
  const sliderId = id ?? generatedId;
  const safeValue = value ?? min;
  const percentage = ((safeValue - min) / (max - min)) * 100;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && (
            <label htmlFor={sliderId} className={styles.label}>
              {label}
            </label>
          )}
          {showValue && <span className={styles.value}>{formatValue(safeValue)}</span>}
        </div>
      )}
      <input
        type="range"
        id={sliderId}
        className={styles.slider}
        value={safeValue}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{ '--progress': `${percentage}%` } as CSSProperties}
        {...props}
      />
    </div>
  );
}
