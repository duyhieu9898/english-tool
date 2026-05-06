import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'blue' | 'green' | 'orange' | 'teal';
  height?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'blue',
  height = 'md',
  label,
  showValue = false,
}) => {
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-sm font-medium">
          {label && <span className="text-gray-700 dark:text-gray-300">{label}</span>}
          {showValue && (
            <span className="text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ${heights[height]}`}
      >
        <div
          className={`${colors[color]} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
};
