import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookType, Hash, BookOpen, Sparkles } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { to: '/vocabulary', icon: <BookType className="w-5 h-5 md:w-6 md:h-6" />, label: 'Vocab' },
    { to: '/grammar', icon: <Hash className="w-5 h-5 md:w-6 md:h-6" />, label: 'Grammar' },
    { to: '/', icon: <Home className="w-5 h-5 md:w-6 md:h-6" />, label: 'Home' },
    { to: '/reading', icon: <BookOpen className="w-5 h-5 md:w-6 md:h-6" />, label: 'Reading' },
    { to: '/review', icon: <Sparkles className="w-5 h-5 md:w-6 md:h-6" />, label: 'Review' },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-50">
      <nav className="bg-white dark:bg-gray-950 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-2xl p-1.5 overflow-hidden">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black font-black scale-105'
                    : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-black uppercase tracking-tighter mt-1 leading-none">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
