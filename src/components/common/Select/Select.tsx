import { useId, type SelectHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  options: readonly SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

export function Select({ options, value, onChange, label, fullWidth = false, placeholder, className = '', id, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.selectContainer}>
        <select id={selectId} className={styles.select} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={16} className={styles.chevron} />
      </div>
    </div>
  );
}
