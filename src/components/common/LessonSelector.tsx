import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useLessons,
  useGrammarLessons,
  useReadingLessons,
  useLessonProgressAll,
} from '../../hooks/useApi';
import { Lesson, GrammarLesson, ReadingLesson } from '../../types';
import { PageContainer } from '../layout/PageContainer';
import {
  ArrowLeft,
  Play,
  Sword,
  Shield,
  Scroll,
  Gem,
  Trophy,
  Target,
  Compass,
  Map,
  Key,
  Ghost,
  Flame,
  Sparkles,
  PenTool,
  BookOpen,
  Feather,
  Search,
  Lightbulb,
  Glasses,
  Newspaper,
  Library,
} from 'lucide-react';

interface LessonSelectorProps {
  moduleType: 'vocabulary' | 'grammar' | 'reading';
}

const MODULE_CONFIG = {
  vocabulary: {
    hook: useLessons,
    backPath: '/vocabulary',
    icons: [Sword, Shield, Scroll, Gem, Trophy, Target, Compass, Map, Key, Ghost, Flame, Sparkles],
    bgColors: [
      'bg-rose-300',
      'bg-amber-300',
      'bg-emerald-300',
      'bg-sky-300',
      'bg-orange-400',
      'bg-lime-300',
      'bg-cyan-300',
      'bg-pink-400',
    ],
  },
  grammar: {
    hook: useGrammarLessons,
    backPath: '/grammar',
    icons: [PenTool, BookOpen, Feather, Search, Lightbulb, Compass],
    bgColors: [
      'bg-amber-300',
      'bg-cyan-300',
      'bg-sky-400',
      'bg-fuchsia-300',
      'bg-indigo-300',
      'bg-orange-300',
    ],
  },
  reading: {
    hook: useReadingLessons,
    backPath: '/reading',
    icons: [Glasses, Newspaper, Library, Map, Search, BookOpen],
    bgColors: [
      'bg-rose-300',
      'bg-blue-300',
      'bg-violet-300',
      'bg-pink-300',
      'bg-teal-300',
      'bg-red-300',
    ],
  },
};

export const LessonSelector: React.FC<LessonSelectorProps> = ({ moduleType }) => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const config = MODULE_CONFIG[moduleType];

  const { data: rawLessons = [], isLoading } = config.hook(level);
  const { data: progressData = [] } = useLessonProgressAll();

  const lessons = React.useMemo(() => {
    return (rawLessons as Array<Lesson | GrammarLesson | ReadingLesson>)
      .map((l) => {
        const isVocab = moduleType === 'vocabulary';
        const isGrammar = moduleType === 'grammar';
        const isReading = moduleType === 'reading';

        const vocab = isVocab ? (l as Lesson) : null;
        const grammar = isGrammar ? (l as GrammarLesson) : null;
        const reading = isReading ? (l as ReadingLesson) : null;

        return {
          id: l.id,
          slug: l.slug || l.id,
          title: grammar?.title || reading?.title || vocab?.name || '',
          description: grammar?.description || '',
          badgeLabel: isVocab
            ? `${vocab?.wordCount || 0} words`
            : isGrammar
              ? 'GRAMMAR'
              : reading?.topic || 'General',
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [rawLessons, moduleType]);

  const progress = React.useMemo(() => {
    const m: Record<string, boolean> = {};
    progressData.forEach((p) => {
      if (p.type === moduleType) m[p.id] = true;
    });
    return m;
  }, [progressData, moduleType]);

  if (isLoading)
    return (
      <div className="p-6 md:p-8 flex justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-black dark:border-white border-t-transparent animate-spin" />
      </div>
    );

  return (
    <PageContainer className="space-y-6">
      <Link
        to={config.backPath}
        className="inline-flex items-center text-sm font-black uppercase text-black dark:text-white hover:-translate-x-1 transition-transform mb-2 px-4 py-2 border-2 border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px]"
      >
        <ArrowLeft className="w-5 h-5 mr-2 stroke-3" /> Back to Map
      </Link>

      <div>
        <h1 className="text-5xl font-black uppercase tracking-tight text-black dark:text-white leading-none">
          World {level}
        </h1>
        <div className="inline-block mt-3 px-3 py-1 bg-black text-white dark:bg-white dark:text-black font-bold uppercase rounded-md transform -skew-x-12">
          {lessons.length} Stages Available
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {lessons.map((lesson, index) => {
          const isCompleted = progress[lesson.slug] || progress[lesson.id];
          const Icon = config.icons[index % config.icons.length];
          const colorClass = config.bgColors[index % config.bgColors.length];

          return (
            <button
              key={lesson.id}
              type="button"
              className={`
                group flex flex-col p-5 cursor-pointer text-left w-full
                ${isCompleted ? 'bg-lime-400 dark:bg-lime-500' : 'bg-white dark:bg-gray-800'}
                border-4 border-black dark:border-white 
                rounded-2xl 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]
                hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]
                active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[0px_0px_0px_0px_rgba(255,255,255,1)]
                transition-all duration-200
              `}
              onClick={() => navigate(`/${moduleType}/${level}/${lesson.id}`)}
            >
              <div className="flex justify-between items-start mb-6">
                <div
                  className={`
                  w-14 h-14 flex items-center justify-center rounded-xl border-4 border-black dark:border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                  ${isCompleted ? 'bg-white' : colorClass}
                `}
                >
                  <Icon className="w-8 h-8 text-black dark:text-gray-900" strokeWidth={2.5} />
                </div>

                {isCompleted ? (
                  <div className="bg-black text-lime-400 px-3 py-1.5 font-black text-xs uppercase border-2 border-black rounded-lg transform rotate-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                    CLEARED
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-1 font-bold text-sm border-2 border-black dark:border-gray-500 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]">
                    {lesson.badgeLabel}
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-black mb-2 line-clamp-2 text-black dark:text-white tracking-tight leading-tight">
                {lesson.title}
              </h3>

              {lesson.description && (
                <p className="text-sm font-medium text-black/70 dark:text-white/70 line-clamp-2 mb-4">
                  {lesson.description}
                </p>
              )}

              <div className="mt-auto pt-4 flex justify-between items-center text-black dark:text-white border-t-2 border-dashed border-black/20 dark:border-white/20">
                <span className="text-base font-black uppercase tracking-wider flex items-center gap-2 group-hover:translate-x-2 transition-transform mt-4">
                  {isCompleted
                    ? moduleType === 'vocabulary'
                      ? 'Replay Stage'
                      : 'Review'
                    : 'Start Play'}
                  <Play className="w-6 h-6 fill-current" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </PageContainer>
  );
};
