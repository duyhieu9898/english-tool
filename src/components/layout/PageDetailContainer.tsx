import React from 'react';

interface PageDetailProps {
  children: React.ReactNode;
  className?: string;
}

export const PageDetail: React.FC<PageDetailProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col h-full  p-4 md:p-8 bg-[#f4f4f0] dark:bg-gray-950 transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
};
