import type { FC, HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: FC<CardProps> = ({
  children,
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden';

  const paddings = {
    none: '',
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'px-4 py-6 md:p-8',
  };

  const classes = cn(
    baseStyles,
    paddings[padding],
    hoverable && 'transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-gray-700 cursor-pointer',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
