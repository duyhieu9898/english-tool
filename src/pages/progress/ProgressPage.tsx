import React from 'react';
import {
  useStats,
  useWordProgressAll,
  useAllStudyLogs,
  useLessonProgressAll,
} from '../../hooks/useApi';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { HeatmapCalendar } from '../../components/common/HeatmapCalendar';
import { Layers, Activity, Star, BookOpen, BookType, Hash } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';

export const ProgressPage: React.FC = () => {
  const { data: stats }            = useStats();
  const { data: words = [] }       = useWordProgressAll();
  const { data: logs = [] }        = useAllStudyLogs();
  const { data: lessons = [] }     = useLessonProgressAll();

  const totalWordsActive = words.length;
  const masteredWords    = Math.max(0, (stats?.totalWordsLearned ?? 0) - totalWordsActive);
  const byLevel          = [1, 2, 3, 4, 5].map((lvl) => ({
    level: lvl,
    count: words.filter((w) => w.level === lvl).length,
  }));

  const completedVocab   = lessons.filter((l) => l.type === 'vocabulary').length;
  const completedGrammar = lessons.filter((l) => l.type === 'grammar').length;
  const completedReading = lessons.filter((l) => l.type === 'reading').length;

  return (
    <PageContainer className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500" /> My Progress
        </h1>
        <p className="text-gray-500 text-lg">
          Track your learning journey and view detailed statistics.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-1">
            {stats?.totalWordsLearned ?? 0}
          </div>
          <div className="text-sm font-bold text-blue-800/60 dark:text-blue-200 uppercase tracking-wide">
            Total Learned
          </div>
        </Card>
        <Card className="text-center bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <div className="text-4xl font-black text-green-600 dark:text-green-400 mb-1">
            {masteredWords}
          </div>
          <div className="text-sm font-bold text-green-800/60 dark:text-green-200 uppercase tracking-wide">
            Mastered
          </div>
        </Card>
        <Card className="text-center bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
          <div className="text-4xl font-black text-orange-600 dark:text-orange-400 mb-1">
            {stats?.currentStreak ?? 0}
          </div>
          <div className="text-sm font-bold text-orange-800/60 dark:text-orange-200 uppercase tracking-wide">
            Day Streak
          </div>
        </Card>
        <Card className="text-center bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
          <div className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-1">
            {stats?.totalStudyDays ?? 0}
          </div>
          <div className="text-sm font-bold text-purple-800/60 dark:text-purple-200 uppercase tracking-wide">
            Study Days
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <Card padding="lg">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> Completed Modules
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg">
                  <BookType className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">Vocabulary</span>
              </div>
              <span className="text-2xl font-black">{completedVocab}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 rounded-lg">
                  <Hash className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">Grammar</span>
              </div>
              <span className="text-2xl font-black">{completedGrammar}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/40 text-orange-600 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">Reading</span>
              </div>
              <span className="text-2xl font-black">{completedReading}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-6">Activity History</h2>
        <HeatmapCalendar logs={logs} days={180} />
      </Card>
    </PageContainer>
  );
};
