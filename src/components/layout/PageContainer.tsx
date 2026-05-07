import React from 'react';

interface PageProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-4 py-6 md:p-8 max-w-5xl mx-auto ${className}`}>
      {children}
    </div>
  );
};
