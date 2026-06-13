import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

type ButtonBaseProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: never;
  };

type ButtonAsLink = ButtonBaseProps & {
  to: string;
  disabled?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover hover:scale-105 disabled:hover:scale-100',
  secondary:
    'bg-muted text-foreground hover:bg-border hover:scale-105 disabled:hover:scale-100',
  outline:
    'border-4 border-primary bg-transparent text-primary hover:bg-primary hover:text-white hover:scale-105 disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-primary',
};

const baseClasses =
  'inline-flex h-14 cursor-pointer items-center justify-center rounded-md px-6 text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', children, className = '' } = props;
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if ('to' in props && props.to) {
    return (
      <Link to={props.to} className={classes} aria-disabled={props.disabled}>
        {children}
      </Link>
    );
  }

  const { type = 'button', disabled, ...rest } = props as ButtonAsButton;

  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}
