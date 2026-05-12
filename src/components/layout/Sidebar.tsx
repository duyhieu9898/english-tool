import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  BookType,
  Book,
  CheckSquare,
  Layers,
  Settings,
  Activity,
  Headphones,
} from 'lucide-react';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const navItems = [
    { to: '/', icon: <Activity className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/vocabulary', icon: <BookType className="w-5 h-5" />, label: 'Vocabulary' },
    { to: '/grammar', icon: <Book className="w-5 h-5" />, label: 'Grammar' },
    { to: '/reading', icon: <BookOpen className="w-5 h-5" />, label: 'Reading' },
    { to: '/listening', icon: <Headphones className="w-5 h-5" />, label: 'Listening' },
    { to: '/review', icon: <CheckSquare className="w-5 h-5" />, label: 'Review' },
    { to: '/progress', icon: <Layers className="w-5 h-5" />, label: 'Progress' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-51 transition-opacity" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-60 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:h-screen md:sticky md:top-0`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <NavLink to="/" className="flex items-center gap-3" onClick={onClose}>
            <img
              src="/logo.png"
              alt="LingoMe Logo"
              className="w-8 h-8 rounded-lg shadow-xs object-cover"
            />
            <span className="text-xl font-bold bg-linear-to-r from-[#008c89] to-teal-400 bg-clip-text text-transparent">
              LingoMe
            </span>
          </NavLink>

          <button
            onClick={onClose}
            className="md:hidden p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
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
