import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 flex flex-col overflow-x-hidden relative pb-24 md:pb-0 bg-[#f4f4f0] dark:bg-gray-950 transition-colors duration-300">
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
      <BottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
};
