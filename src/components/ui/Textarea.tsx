import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  variant?: 'default' | 'compact';
}

export const Textarea: React.FC<TextareaProps> = ({
  error,
  variant = 'default',
  className = '',
  ...props
}) => {
  const borderWeight = variant === 'compact' ? 'border-2' : 'border-4';

  return (
    <textarea
      className={`
        w-full p-4 text-xl font-bold bg-gray-50 dark:bg-gray-900 
        ${borderWeight} border-black dark:border-gray-700 rounded-2xl 
        focus:outline-none focus:ring-0 min-h-[120px] resize-none
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
        transition-all focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none
        ${error ? 'border-red-500 shadow-red-200 dark:shadow-red-900/30' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
};
