import React, { forwardRef } from 'react';

interface AnswerInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'blue' | 'yellow' | 'orange';
  size?: 'md' | 'lg';
}

export const AnswerInput = forwardRef<HTMLInputElement, AnswerInputProps>(
  ({ className, variant = 'blue', size = 'md', ...props }, ref) => {
    const variantStyles = {
      blue: 'focus:bg-blue-50 dark:focus:bg-blue-900/30',
      yellow: 'focus:bg-yellow-100 dark:focus:bg-yellow-500',
      orange: 'focus:bg-orange-100 dark:focus:bg-orange-500/50',
    };

    const sizeStyles = {
      md: 'text-xl md:text-3xl py-2.5 md:py-3 px-3',
    };

    return (
      <input
        ref={ref}
        type="text"
        className={`w-full text-center font-black bg-gray-100 dark:bg-gray-900 border-4 border-black dark:border-white rounded-2xl outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-black dark:text-white lowercase placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all mb-6 ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        {...props}
      />
    );
  },
);

AnswerInput.displayName = 'AnswerInput';
