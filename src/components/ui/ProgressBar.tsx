import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'blue' | 'green' | 'orange' | 'teal' | 'lime' | string;
  height?: 'sm' | 'md' | 'lg' | 'xl' | string;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'blue',
  height = 'md',
  label,
  showValue = false,
  className = '',
}) => {
  const safeProgress = Math.max(0, Math.min(100, progress));

  const heights: Record<string, string> = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-4',
    xl: 'h-6',
  };

  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    lime: 'bg-lime-400',
  };

  const resolvedHeight = heights[height] || height;
  const resolvedColor = colors[color] || color;

  const containerClasses = [
    'w-full',
    className
  ].filter(Boolean).join(' ');

  const barContainerClasses = [
    'relative bg-white dark:bg-gray-800 border-3 border-black dark:border-gray-600 rounded-full overflow-hidden',
    resolvedHeight
  ].filter(Boolean).join(' ');

  const barClasses = [
    'absolute inset-y-0 left-0 border-r-4 border-black transition-all duration-300 ease-out',
    resolvedColor
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-sm font-black uppercase tracking-tight">
          {label && <span className="text-black dark:text-white">{label}</span>}
          {showValue && (
            <span className="text-black dark:text-white">{Math.round(safeProgress)}%</span>
          )}
        </div>
      )}
      <div className={barContainerClasses}>
        <div
          className={barClasses}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};
