import { useId, type InputHTMLAttributes } from 'react';
import styles from './Toggle.module.scss';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label, className = '', id, disabled, ...props }: ToggleProps) {
  const generatedId = useId();
  const toggleId = id ?? generatedId;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <label className={styles.toggle} data-disabled={disabled}>
        <input
          type="checkbox"
          id={toggleId}
          className={styles.input}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          {...props}
        />
        <span className={styles.track}>
          <span className={styles.thumb} />
        </span>
      </label>
      {label && (
        <label htmlFor={toggleId} className={styles.label} data-disabled={disabled}>
          {label}
        </label>
      )}
    </div>
  );
}
