import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useStats,
  useSettings,
  useWordProgressAll,
  useAllSessionProgress,
  useAllStudyLogs,
  useLessons,
} from '../hooks/useApi';
import { Lesson } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { HeatmapCalendar } from '../components/common/HeatmapCalendar';
import { PageContainer } from '../components/layout/PageContainer';
import { Flame, Play, Clock, BookType, Book, Map, Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: isLoadingStats }           = useStats();
  const { data: settings, isLoading: isLoadingSettings }     = useSettings();
  const { data: wordProgress = [], isLoading: isLoadingWP }  = useWordProgressAll();
  const { data: lessons = [], isLoading: isLoadingLessons }  = useLessons();
  const { data: studyLogs = [], isLoading: isLoadingLogs }   = useAllStudyLogs();
  const { data: sessions = [], isLoading: isLoadingSessions } = useAllSessionProgress();

  const isLoading = isLoadingStats || isLoadingSettings || isLoadingWP || isLoadingLessons || isLoadingLogs || isLoadingSessions;

  const today        = new Date().toISOString().split('T')[0];
  const dueWords     = wordProgress.filter((p) => p.nextReview <= today);
  const dailyGoal    = settings?.dailyGoal ?? 20;
  
  const todayLog      = studyLogs.find((l) => l.date === today);
  const todayLearned  = todayLog?.wordsLearned ?? 0;
  const todayReviewed = todayLog?.wordsReviewed ?? 0;
  const todayTotal    = todayLearned + todayReviewed;

  const lessonMap = React.useMemo(() => {
    const m: Record<string, Lesson> = {};
    lessons.forEach((l) => (m[l.id] = l));
    return m;
  }, [lessons]);

  const activeSession = React.useMemo(() => {
    if (!sessions.length) return null;
    return [...sessions].sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    )[0];
  }, [sessions]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );

  return (
    <PageContainer className="space-y-8">
      {/* Welcome & Streak */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Welcome back! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400">Ready to learn something new today?</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 py-2 px-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <Flame
            className={`w-8 h-8 ${stats?.currentStreak ? 'text-orange-500' : 'text-gray-300 dark:text-gray-700'}`}
          />
          <div>
            <div className="text-2xl font-black leading-none">{stats?.currentStreak ?? 0}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Day Streak
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goal Bar */}
      <Card padding="lg">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookType className="w-5 h-5 text-blue-500" /> Daily Goal
            </h2>
            {todayReviewed > 0 && (
              <p className="text-[12px] uppercase font-black text-gray-400 tracking-tighter ml-7">
                + {todayReviewed} words
              </p>
            )}
          </div>
          <span className="text-sm font-bold text-gray-500">
            {todayTotal}/{dailyGoal} words
          </span>
        </div>
        <ProgressBar progress={Math.min((todayTotal / dailyGoal) * 100, 100)} />
      </Card>

      {/* Continue Learning */}
      {activeSession && lessonMap[activeSession.id] && (
        <Card padding="lg" className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">
                <Clock className="w-3 h-3 inline mr-1" /> Continue Learning
              </div>
              <h3 className="text-lg font-black">{lessonMap[activeSession.id].name}</h3>
              <p className="text-sm text-gray-500">
                Card {activeSession.currentIndex + 1} of{' '}
                {lessonMap[activeSession.id].wordCount}
              </p>
            </div>
            <Button
              onClick={() => {
                const l = lessonMap[activeSession.id];
                navigate(`/vocabulary/${l.level}/${l.id}`);
              }}
            >
              <Play className="w-5 h-5 mr-2" /> Resume
            </Button>
          </div>
        </Card>
      )}

      {/* Due Words */}
      {dueWords.length > 0 && (
        <Card padding="lg" className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">
                Review Due
              </div>
              <h3 className="text-lg font-black">{dueWords.length} words need review</h3>
            </div>
            <Button variant="outline" onClick={() => navigate('/review')}>
              <Book className="w-5 h-5 mr-2" /> Review Now
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/vocabulary')}
          className="p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookType className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="font-bold">Vocabulary</div>
            <div className="text-xs text-gray-500">{stats?.totalWordsLearned ?? 0} learned</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/review/general')}
          className="p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <div className="font-bold text-orange-600 dark:text-orange-400">Boss Battle</div>
            <div className="text-xs text-gray-500">General Review</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/progress')}
          className="p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Map className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <div className="font-bold">Progress</div>
            <div className="text-xs text-gray-500">{stats?.totalStudyDays ?? 0} study days</div>
          </div>
        </button>
      </div>

      {/* Heatmap */}
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-6">Study Activity</h2>
        <HeatmapCalendar logs={studyLogs} dailyGoal={dailyGoal} />
      </Card>
    </PageContainer>
  );
};
