import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, BookType, Book, CheckSquare, Layers, Settings, Activity } from 'lucide-react';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const navItems = [
    { to: '/', icon: <Activity className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/vocabulary', icon: <BookType className="w-5 h-5" />, label: 'Vocabulary' },
    { to: '/grammar', icon: <Book className="w-5 h-5" />, label: 'Grammar' },
    { to: '/reading', icon: <BookOpen className="w-5 h-5" />, label: 'Reading' },
    { to: '/review', icon: <CheckSquare className="w-5 h-5" />, label: 'Review' },
    { to: '/progress', icon: <Layers className="w-5 h-5" />, label: 'Progress' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:h-screen md:sticky md:top-0`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <NavLink to="/" className="flex items-center gap-3 w-full" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              E
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              EnglishFlow
            </span>
          </NavLink>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            Settings
          </NavLink>
        </div>
      </aside>
    </>
  );
};
