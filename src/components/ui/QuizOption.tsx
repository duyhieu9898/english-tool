import React from 'react';

interface QuizOptionProps {
  label: string;
  isSelected?: boolean;
  isCorrect?: boolean;
  showResult?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'grammar' | 'reading';
}

export const QuizOption: React.FC<QuizOptionProps> = ({
  label,
  isSelected,
  isCorrect,
  showResult,
  onClick,
  disabled,
  className = '',
}) => {
  // Determine background color based on state
  let bgColor = 'bg-white dark:bg-gray-800 text-black dark:text-white';

  if (showResult && isCorrect) {
    bgColor = 'bg-emerald-300 dark:bg-emerald-900/60 text-black dark:text-emerald-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
  } else if (isSelected) {
    bgColor = 'bg-yellow-400/50 dark:bg-yellow-500 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || showResult}
      className={`
        w-full text-left p-4 rounded-2xl border-4 border-black dark:border-white
        transition-all font-bold text-lg cursor-pointer
        ${bgColor}
        ${!disabled && !showResult && !isSelected ? 'hover:bg-yellow-400/50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none' : ''}
        ${isSelected || (showResult && isCorrect) ? 'translate-y-0.5 shadow-none' : ''}
        ${disabled && !isSelected && !isCorrect ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {label}
    </button>
  );
};
