import { useId, useState, type KeyboardEvent } from 'react';
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

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function NumberSlider({ label, value, onChange, min, max, step = 1, suffix = '', className = '' }: NumberSliderProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const safeValue = value ?? min;
  const decimals = decimalsOf(step);
  const percentage = ((safeValue - min) / (max - min)) * 100;
  const snap = (next: number): number => Number(clamp(next, min, max).toFixed(decimals));

  const commitDraft = (text: string) => {
    setDraft(text);
    const parsed = Number(text.replace(',', '.'));
    if (text.trim() !== '' && Number.isFinite(parsed)) onChange(snap(parsed));
  };

  const nudge = (event: KeyboardEvent<HTMLInputElement>) => {
    const direction = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
    if (direction === 0) return;
    event.preventDefault();
    setDraft(null);
    onChange(snap(safeValue + direction * step * (event.shiftKey ? 10 : 1)));
  };

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
            onChange={(e) => {
              setDraft(null);
              onChange(Number(e.target.value));
            }}
            min={min}
            max={max}
            step={step}
          />
          <div className={styles.sliderTrack}>
            <div className={styles.sliderFill} style={{ width: `${percentage}%` }} />
          </div>
        </div>
        <label className={styles.value}>
          <input
            className={styles.valueInput}
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            value={draft ?? safeValue.toFixed(decimals)}
            onChange={(e) => commitDraft(e.target.value)}
            onKeyDown={nudge}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => setDraft(null)}
            aria-label={label ? `${label} value` : 'Value'}
            size={Math.max(2, String(max).length + decimals)}
          />
          {suffix && <span className={styles.suffix}>{suffix}</span>}
        </label>
      </div>
    </div>
  );
}
