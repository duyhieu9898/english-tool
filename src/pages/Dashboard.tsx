import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useStats,
  useSettings,
  useWordProgressAll,
  useAllSessionProgress,
  useAllStudyLogs,
  useLessons,
  useLessonProgressAll,
  useGrammarLessons,
  useReadingLessons,
  useListeningLessons,
} from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PageContainer } from '../components/layout/PageContainer';
import { QuickNavCard, QuickNavItem } from '../components/common/QuickNavCard';
import { Flame, Play, Clock, BookType, Book, Map, Sparkles, Headphones } from 'lucide-react';

const NAV_ITEMS_CONFIG = [
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    path: '/vocabulary',
    icon: BookType,
    color: 'blue' as const,
  },
  {
    id: 'listening',
    title: 'Listening',
    path: '/listening',
    icon: Headphones,
    color: 'yellow' as const,
  },
  {
    id: 'review',
    title: 'Boss Battle',
    path: '/review/general',
    icon: Sparkles,
    color: 'orange' as const,
    titleColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'progress',
    title: 'Progress',
    path: '/progress',
    icon: Map,
    color: 'green' as const,
  },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: isLoadingStats } = useStats();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: wordProgress = [], isLoading: isLoadingWP } = useWordProgressAll();
  const { data: vocabLessons = [] } = useLessons();
  const { data: grammarLessons = [] } = useGrammarLessons();
  const { data: readingLessons = [] } = useReadingLessons();
  const { data: listeningLessons = [] } = useListeningLessons();
  const { data: studyLogs = [], isLoading: isLoadingLogs } = useAllStudyLogs();
  const { data: sessions = [], isLoading: isLoadingSessions } = useAllSessionProgress();
  const { data: lessonProgress = [], isLoading: isLoadingLP } = useLessonProgressAll();

  const isLoading =
    isLoadingStats ||
    isLoadingSettings ||
    isLoadingWP ||
    isLoadingLogs ||
    isLoadingSessions ||
    isLoadingLP;

  const today = new Date().toISOString().split('T')[0];
  const dueWords = wordProgress.filter((p) => p.nextReview <= today);
  const dailyGoal = settings?.dailyGoal ?? 20;

  const todayLog = studyLogs.find((l) => l.date === today);
  const todayLearned = todayLog?.wordsLearned ?? 0;
  const todayReviewed = todayLog?.wordsReviewed ?? 0;
  const todayTotal = todayLearned + todayReviewed;

  const completedListening = lessonProgress.filter((l) => l.type === 'listening').length;

  const contentMap = React.useMemo(() => {
    const m: Record<string, { id: string; name: string; level: string; type: string; count: number }> = {};
    vocabLessons.forEach((l) => (m[l.id] = { id: l.id, name: l.name, level: l.level, type: 'vocabulary', count: l.words?.length || 0 }));
    grammarLessons.forEach((l) => (m[l.id] = { id: l.id, name: l.title, level: l.level, type: 'grammar', count: l.practice?.length || 0 }));
    readingLessons.forEach((l) => (m[l.id] = { id: l.id, name: l.title, level: l.level, type: 'reading', count: l.questions?.length || 0 }));
    listeningLessons.forEach((l) => (m[l.id] = { id: l.id, name: l.title, level: l.level, type: 'listening', count: l.questions?.length || 0 }));
    return m;
  }, [vocabLessons, grammarLessons, readingLessons, listeningLessons]);

  const activeSession = React.useMemo(() => {
    if (!sessions.length) return null;
    return [...sessions].sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    )[0];
  }, [sessions]);

  const navItems: QuickNavItem[] = React.useMemo(
    () => [
      {
        ...NAV_ITEMS_CONFIG[0],
        subtitle: `${stats?.totalWordsLearned ?? 0} learned`,
      },
      {
        ...NAV_ITEMS_CONFIG[1],
        subtitle: `${completedListening} completed`,
      },
      {
        ...NAV_ITEMS_CONFIG[2],
        subtitle: 'General Review',
      },
      {
        ...NAV_ITEMS_CONFIG[3],
        subtitle: `${stats?.totalStudyDays ?? 0} study days`,
      },
    ],
    [stats, completedListening],
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );

  return (
    <PageContainer className="space-y-6 md:space-y-8">
      {/* Welcome & Streak */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Welcome back! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400">Ready to learn something new today?</p>
        </div>
        <Card className="flex items-center gap-3 md:py-4">
          <Flame
            className={`w-8 h-8 ${stats?.currentStreak ? 'text-orange-500' : 'text-gray-300 dark:text-gray-700'}`}
          />
          <div>
            <div className="text-2xl font-black leading-none">{stats?.currentStreak ?? 0}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Day Streak
            </div>
          </div>
        </Card>
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
      {activeSession && contentMap[activeSession.id] && (
        <Card
          padding="lg"
          className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">
                <Clock className="w-3 h-3 inline mr-1" /> Continue Learning
              </div>
              <h3 className="text-xl md:text-lg font-black">{contentMap[activeSession.id].name}</h3>
              <p className="text-sm text-gray-500">
                {contentMap[activeSession.id].type === 'vocabulary' ? 'Card' : 'Question'} {activeSession.currentIndex + 1} of {contentMap[activeSession.id].count}
              </p>
            </div>
            <Button
              onClick={() => {
                const l = contentMap[activeSession.id];
                navigate(`/${l.type}/${l.level}/${l.id}`);
              }}
            >
              <Play className="w-5 h-5 mr-2" /> Resume
            </Button>
          </div>
        </Card>
      )}

      {/* Due Words */}
      {dueWords.length > 0 && (
        <Card
          padding="lg"
          className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {navItems.map((item) => (
          <QuickNavCard key={item.path} item={item} />
        ))}
      </div>
    </PageContainer>
  );
};
