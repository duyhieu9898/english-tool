import type { FC, HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: 'white' | 'blue' | 'green' | 'red' | 'yellow' | 'teal';
  size?: 'sm' | 'md';
  shadow?: boolean;
}

export const Badge: FC<BadgeProps> = ({
  children,
  color = 'white',
  size = 'md',
  shadow = true,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-black uppercase tracking-wider border-2 border-black dark:border-white rounded-full transition-all duration-200';

  const shadowStyles = shadow
    ? 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
    : '';

  const colors = {
    white: 'text-black dark:bg-white-700 dark:text-white',
    blue: 'bg-blue-400 text-black dark:bg-blue-500 dark:text-white',
    green: 'bg-lime-400 text-black dark:bg-lime-500 dark:text-black',
    red: 'bg-red-400 text-black dark:bg-red-500 dark:text-white',
    yellow: 'bg-amber-300 text-black dark:bg-amber-400 dark:text-black',
    teal: 'bg-teal-400 text-black dark:bg-teal-500 dark:text-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  const classes = cn(
    baseStyles,
    colors[color],
    sizes[size],
    shadowStyles,
    className
  );

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};
