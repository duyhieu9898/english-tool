import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Layers, Star, BookOpen, BookType, Hash, Headphones } from 'lucide-react';
import type { AppStats } from '@/types';
import type { CompletedModulesStats } from '@/pages/progress/useProgressData';

export const ProgressSummaryCards = ({
  stats,
  masteredWords,
}: {
  stats: AppStats | undefined;
  masteredWords: number;
}) => {
  const summaryData = [
    {
      value: stats?.totalWordsLearned ?? 0,
      label: 'Total Learned',
      bgClass: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30',
      textClass: 'text-blue-600 dark:text-blue-400',
      labelClass: 'text-blue-800/60 dark:text-blue-200',
    },
    {
      value: masteredWords,
      label: 'Mastered',
      bgClass: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30',
      textClass: 'text-green-600 dark:text-green-400',
      labelClass: 'text-green-800/60 dark:text-green-200',
    },
    {
      value: stats?.currentStreak ?? 0,
      label: 'Day Streak',
      bgClass: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30',
      textClass: 'text-orange-600 dark:text-orange-400',
      labelClass: 'text-orange-800/60 dark:text-orange-200',
    },
    {
      value: stats?.totalStudyDays ?? 0,
      label: 'Study Days',
      bgClass: 'bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30',
      textClass: 'text-teal-600 dark:text-teal-400',
      labelClass: 'text-teal-800/60 dark:text-teal-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryData.map((item, idx) => (
        <Card key={idx} className={`text-center ${item.bgClass}`}>
          <div className={`text-4xl font-black mb-1 ${item.textClass}`}>
            {item.value}
          </div>
          <div className={`text-sm font-bold uppercase tracking-wide ${item.labelClass}`}>
            {item.label}
          </div>
        </Card>
      ))}
    </div>
  );
};

export const CompletedModulesCard = ({
  completedModules,
}: {
  completedModules: CompletedModulesStats;
}) => {
  const modulesData = [
    {
      label: 'Vocabulary',
      value: completedModules.vocabulary,
      icon: <BookType className="w-5 h-5" />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',
    },
    {
      label: 'Grammar',
      value: completedModules.grammar,
      icon: <Hash className="w-5 h-5" />,
      iconBg: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600',
    },
    {
      label: 'Reading',
      value: completedModules.reading,
      icon: <BookOpen className="w-5 h-5" />,
      iconBg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600',
    },
    {
      label: 'Listening',
      value: completedModules.listening,
      icon: <Headphones className="w-5 h-5" />,
      iconBg: 'bg-yellow-100 dark:bg-yellow-300 text-yellow-600',
    },
  ];

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" /> Completed Modules
      </h2>
      <div className="space-y-6">
        {modulesData.map((mod, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${mod.iconBg}`}>
                {mod.icon}
              </div>
              <span className="font-bold text-lg">{mod.label}</span>
            </div>
            <span className="text-2xl font-black">{mod.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const RetentionLevelsCard = ({
  totalWordsActive,
  byLevel,
}: {
  totalWordsActive: number;
  byLevel: { level: number; count: number }[];
}) => (
  <Card padding="lg">
    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
      <Layers className="w-5 h-5 text-indigo-500" /> Retention Levels
    </h2>
    <div className="space-y-4">
      {byLevel.map((lvl) => (
        <div key={lvl.level}>
          <ProgressBar
            progress={totalWordsActive > 0 ? (lvl.count / totalWordsActive) * 100 : 0}
            label={`Level ${lvl.level} (${lvl.count})`}
            color={lvl.level === 5 ? 'green' : lvl.level > 3 ? 'blue' : 'orange'}
          />
        </div>
      ))}
    </div>
  </Card>
);
