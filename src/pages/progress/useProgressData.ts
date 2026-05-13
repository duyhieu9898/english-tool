import {
  useStats,
  useWordProgressAll,
  useAllStudyLogs,
  useLessonProgressAll,
  useSettings,
} from '@/hooks/useApi';

export interface CompletedModulesStats {
  vocabulary: number;
  grammar: number;
  reading: number;
  listening: number;
}

export const useProgressData = () => {
  const { data: stats, isLoading: isStatsLoading } = useStats();
  const { data: words = [], isLoading: isWordsLoading } = useWordProgressAll();
  const { data: logs = [], isLoading: isLogsLoading } = useAllStudyLogs();
  const { data: lessons = [], isLoading: isLessonsLoading } = useLessonProgressAll();
  const { data: settings } = useSettings();

  const dailyGoal = settings?.dailyGoal ?? 20;

  const totalWordsActive = words.length;
  const masteredWords = Math.max(0, (stats?.totalWordsLearned ?? 0) - totalWordsActive);
  
  const byLevel = [1, 2, 3, 4, 5].map((lvl) => ({
    level: lvl,
    count: words.filter((w) => w.level === lvl).length,
  }));

  const completedVocab = lessons.filter((l) => l.type === 'vocabulary').length;
  const completedGrammar = lessons.filter((l) => l.type === 'grammar').length;
  const completedReading = lessons.filter((l) => l.type === 'reading').length;
  const completedListening = lessons.filter((l) => l.type === 'listening').length;

  return {
    stats,
    logs,
    dailyGoal,
    masteredWords,
    totalWordsActive,
    byLevel,
    completedModules: {
      vocabulary: completedVocab,
      grammar: completedGrammar,
      reading: completedReading,
      listening: completedListening,
    },
    isLoading: isStatsLoading || isWordsLoading || isLogsLoading || isLessonsLoading,
  };
};
