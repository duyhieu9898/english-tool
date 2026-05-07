import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface QuickNavItem {
  title: string;
  subtitle: string;
  path: string;
  icon: LucideIcon;
  color: 'blue' | 'yellow' | 'orange' | 'green';
  titleColor?: string;
}

interface QuickNavCardProps {
  item: QuickNavItem;
}

const colorStyles = {
  blue: {
    hover: 'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconText: 'text-blue-500',
  },
  yellow: {
    hover: 'hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-300',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconText: 'text-yellow-500',
  },
  orange: {
    hover: 'hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconText: 'text-orange-500',
  },
  green: {
    hover: 'hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconText: 'text-green-500',
  },
};

export const QuickNavCard: React.FC<QuickNavCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const Icon = item.icon;
  const style = colorStyles[item.color];

  return (
    <button
      onClick={() => navigate(item.path)}
      className={`p-4 md:p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 ${style.hover} flex items-center gap-3 transition-all text-left group`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}
      >
        <Icon className={`w-6 h-6 ${style.iconText}`} />
      </div>
      <div>
        <div className={`font-bold ${item.titleColor || ''}`}>{item.title}</div>
        <div className="text-sm text-gray-500">{item.subtitle}</div>
      </div>
    </button>
  );
};
