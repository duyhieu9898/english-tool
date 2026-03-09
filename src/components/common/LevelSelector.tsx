import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookType, Book, BookOpen, Stars, Zap, Flame, Crown, Diamond } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';

interface LevelSelectorProps {
  moduleType: 'vocabulary' | 'grammar' | 'reading';
  title: string;
  description: string;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({ moduleType, title, description }) => {
  const navigate = useNavigate();

  const levels = [
    { id: 'a1', name: 'Beginner', color: 'bg-lime-300', icon: Stars },
    { id: 'a2', name: 'Elementary', color: 'bg-yellow-300', icon: Zap },
    { id: 'b1', name: 'Intermediate', color: 'bg-orange-400', icon: Flame },
    { id: 'b2', name: 'Upper Intermediate', color: 'bg-red-400', icon: Crown },
    { id: 'c1', name: 'Advanced', color: 'bg-blue-400', icon: Diamond },
  ];

  const icons = {
    vocabulary: BookType,
    grammar: Book,
    reading: BookOpen,
  };

  const ModuleIcon = icons[moduleType];

  return (
    <PageContainer>
      <div>
        <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3 mb-2 tracking-tight">
          <span className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-lg transform -rotate-6 border-2 border-transparent">
            <ModuleIcon className="w-8 h-8" strokeWidth={2.5} />
          </span>
          {title.toUpperCase()} MAP
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">{description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {levels.map((level) => {
          const Icon = level.icon;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => navigate(`/${moduleType}/${level.id}`)}
              className={`
                group flex flex-col relative overflow-hidden p-6 cursor-pointer text-left
                ${level.color} 
                border-4 border-black dark:border-white 
                rounded-2xl 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]
                hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]
                active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[0px_0px_0px_0px_rgba(255,255,255,1)]
                transition-all duration-200 min-h-[160px] w-full
              `}
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-12 -translate-y-12 rounded-full opacity-20 bg-white transition-transform group-hover:scale-125 duration-500" />

              <div className="flex justify-between items-start mb-6 text-black relative z-10">
                <span className="text-5xl font-black uppercase tracking-tighter">{level.id}</span>
                <div className="p-3 bg-white/40 backdrop-blur-sm border-2 border-black rounded-xl transform group-hover:rotate-12 transition-transform">
                  <Icon className="w-8 h-8" strokeWidth={2.5} />
                </div>
              </div>

              <div className="mt-auto relative z-10 text-black">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-1">{level.name}</h3>
                <p className="font-bold opacity-80 uppercase text-sm tracking-wider">
                  Tap to Start
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </PageContainer>
  );
};

