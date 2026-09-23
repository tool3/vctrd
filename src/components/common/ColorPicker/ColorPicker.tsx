import { useId } from 'react';
import styles from './ColorPicker.module.scss';

interface ColorPickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  className?: string;
}

const HEX6 = /^#[0-9A-Fa-f]{6}$/;
const HEX3 = /^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/;

const toPickerValue = (value: string): string => {
  const short = HEX3.exec(value);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return HEX6.test(value) ? value : '#000000';
};

export function ColorPicker({ label, value = '', onChange, placeholder = '#000000', fullWidth = false, className = '' }: ColorPickerProps) {
  const id = useId();

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputGroup}>
        <div className={styles.colorPreview} style={{ background: value || 'transparent' }}>
          <input
            type="color"
            aria-label={label ? `${label} picker` : 'Colour picker'}
            className={styles.colorInput}
            value={toPickerValue(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input
          type="text"
          id={id}
          className={styles.textInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
