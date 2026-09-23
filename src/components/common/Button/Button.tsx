import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const ICON_SIZES: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 22 };

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ref,
  ...props
}: ButtonProps) {
  const iconOnly = !children && icon !== undefined;
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    iconOnly ? styles.iconOnly : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span className={styles.spinner} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <Icon name={icon} size={ICON_SIZES[size]} />}
          {children && <span className={styles.label}>{children}</span>}
          {icon && iconPosition === 'right' && <Icon name={icon} size={ICON_SIZES[size]} />}
        </>
      )}
    </button>
  );
}
