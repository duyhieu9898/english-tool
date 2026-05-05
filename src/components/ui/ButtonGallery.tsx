import React from 'react';
import { Button } from './Button';
import { ArrowLeft, Play, Sword, ChevronRight } from 'lucide-react';

export const ButtonGallery: React.FC = () => {
  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto bg-[#f4f4f0] dark:bg-gray-950 min-h-screen">
      <div className="border-b-4 border-black dark:border-white pb-6">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-black dark:text-white flex items-center gap-4">
          Neo-Brutalism Design System
        </h1>
        <p className="text-xl font-bold text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wide">
          Standardized common components based on project patterns
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase bg-blue-300 dark:bg-blue-500 dark:text-black inline-block px-4 py-1 border-2 border-black">
          Standard Variants (Common Component)
        </h2>
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Primary</span>
            <Button variant="primary">Primary</Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Secondary</span>
            <Button variant="secondary">Secondary</Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Success</span>
            <Button variant="success">Success</Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Danger</span>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Outline</span>
            <Button variant="outline">Outline</Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Black</span>
            <Button variant="black">Black</Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Ghost</span>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase bg-yellow-300 dark:bg-yellow-500 dark:text-black inline-block px-4 py-1 border-2 border-black">
          Size Scale (Common Component)
        </h2>
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Small (sm)</span>
            <Button size="sm" variant="outline">
              <ArrowLeft className="w-5 h-5 mr-2" /> Small
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Medium (md)</span>
            <Button size="md">
              Medium <Play className="w-5 h-5 ml-2 fill-current" />
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Large (lg)</span>
            <Button size="lg" variant="success">
              Large <ChevronRight className="w-8 h-8 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6 pt-12 border-t-4 border-dashed border-black/10">
        <h2 className="text-2xl font-black uppercase text-gray-400">
          Raw Reference (From Codebase)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Action Ref */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">
              Attack Button Pattern
            </p>
            <button className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white dark:bg-blue-400 dark:text-black py-4 px-6 rounded-xl font-black text-xl uppercase tracking-wider border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-none transition-all">
              Attack <Sword className="w-6 h-6 stroke-3 ml-2" />
            </button>
          </div>

          {/* Nav Ref */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">
              Nav Button Pattern
            </p>
            <button className="inline-flex items-center text-sm font-black uppercase text-black dark:text-white bg-white dark:bg-black px-4 py-2 border-2 border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px] transition-all">
              <ArrowLeft className="w-5 h-5 mr-2 stroke-3" /> Retreat
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
