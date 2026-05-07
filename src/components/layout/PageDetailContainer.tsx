import React from 'react';

interface PageDetailProps {
  children: React.ReactNode;
  className?: string;
}

export const PageDetail: React.FC<PageDetailProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex-1 p-4 md:p-8 ${className}`}>
      {children}
    </div>
  );
};
