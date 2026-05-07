import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'black' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  shadow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  shadow = true,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-black uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none';

  const variants = {
    primary:
      'bg-blue-500 text-white dark:bg-blue-400 dark:text-black border-black dark:border-white',
    secondary: 'bg-amber-300 text-black border-black',
    success: 'bg-lime-400 dark:bg-lime-500 text-black border-black',
    danger: 'bg-red-500 text-white border-black',
    outline: 'bg-white text-black dark:bg-black dark:text-white border-black dark:border-white',
    ghost:
      'border-transparent text-gray-600 dark:text-gray-400 translate-y-0 hover:translate-y-0 active:translate-y-0',
    black: 'bg-black text-white dark:bg-white dark:text-black border-transparent',
  };

  const sizes = {
    sm: 'h-10 px-4 text-xs border-2 rounded-lg',
    md: 'h-14 px-4 md:px-6 text-base border-4 rounded-xl',
    lg: 'h-17 px-6 md:px-8 text-xl border-4 rounded-2xl',
  };

  const shadowDimensions = {
    sm: 'shadow-[3px_3px_0px_0px_var(--tw-shadow-color)] hover:shadow-[5px_5px_0px_0px_var(--tw-shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
    md: 'shadow-[4px_4px_0px_0px_var(--tw-shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--tw-shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    lg: 'shadow-[5px_5px_0px_0px_var(--tw-shadow-color)] hover:shadow-[7px_7px_0px_0px_var(--tw-shadow-color)] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-[5px] active:translate-y-[5px] active:shadow-none',
    none: '',
  };

  const shadowColors =
    variant === 'black' ? 'shadow-gray-400 dark:shadow-gray-600' : 'shadow-black dark:shadow-white';

  const hasShadow = shadow && variant !== 'ghost';

  const classes = [
    baseStyles,
    variants[variant],
    sizes[size],
    hasShadow && shadowDimensions[size],
    hasShadow && shadowColors,
    fullWidth && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
