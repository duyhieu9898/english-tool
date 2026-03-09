/**
 * hooks/useApi.ts
 * All React Query hooks for this app.
 *
 * Convention:
 *   useXxx()          → useQuery  (GET, cached)
 *   useXxxMutation    → useMutation (POST/PUT/PATCH/DELETE, with cache invalidation)
 *   useXxxFetcher     → returns an imperative fetchQuery fn (use inside effects/handlers)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { queryKeys } from './queryKeys';
import { createInitialWordProgress, calculateNextReview } from '../services/spacedRepetition';
import type {
  VocabWord,
  WordProgress,
  LessonProgress,
  SessionProgress,
  StudyLog,
  AppStats,
  AppSettings,
} from '../types';

// ── Lessons ────────────────────────────────────────────────────────────────
export const useLessons = (level?: string) =>
  useQuery({
    queryKey: level ? queryKeys.lessons.byLevel(level) : queryKeys.lessons.all(),
    queryFn: () => level ? api.getLessonsByLevel(level) : api.getAllLessons(),
  });

export const useLesson = (id: string) =>
  useQuery({
    queryKey: queryKeys.lessons.detail(id),
    queryFn: () => api.getLessonById(id),
    enabled: !!id,
  });

/** Flat list of every word in every lesson — used by SearchVocab */
export const useAllLessonWords = () =>
  useQuery({
    queryKey: [...queryKeys.lessons.all(), 'words'] as const,
    queryFn: api.getAllLessonWords,
    staleTime: Infinity, // static content — never changes at runtime
  });

/** Imperative fetcher — use inside effects or async handlers */
export const useLessonFetcher = () => {
  const qc = useQueryClient();
  return (id: string) =>
    qc.fetchQuery({
      queryKey: queryKeys.lessons.detail(id),
      queryFn: () => api.getLessonById(id),
    });
};

// ── Grammar ────────────────────────────────────────────────────────────────
export const useGrammarLessons = (level?: string) =>
  useQuery({
    queryKey: level ? queryKeys.grammar.byLevel(level) : queryKeys.grammar.all(),
    queryFn: () => level ? api.getGrammarLessonsByLevel(level) : api.getGrammarLessonsByLevel(''),
  });

export const useGrammarLesson = (id: string) =>
  useQuery({
    queryKey: queryKeys.grammar.detail(id),
    queryFn: () => api.getGrammarLessonById(id),
    enabled: !!id,
  });

// ── Reading ────────────────────────────────────────────────────────────────
export const useReadingLessons = (level?: string) =>
  useQuery({
    queryKey: level ? queryKeys.reading.byLevel(level) : queryKeys.reading.all(),
    queryFn: () => level ? api.getReadingLessonsByLevel(level) : api.getReadingLessonsByLevel(''),
  });

export const useReadingLesson = (id: string) =>
  useQuery({
    queryKey: queryKeys.reading.detail(id),
    queryFn: () => api.getReadingLessonById(id),
    enabled: !!id,
  });

// ── Word Progress ──────────────────────────────────────────────────────────
export const useWordProgressAll = () =>
  useQuery({
    queryKey: queryKeys.wordProgress.all(),
    queryFn: api.getWordProgressAll,
  });

export const useWordProgressByLesson = (lessonId: string) =>
  useQuery({
    queryKey: queryKeys.wordProgress.byLesson(lessonId),
    queryFn: () => api.getWordProgressByLesson(lessonId),
    enabled: !!lessonId,
  });

export const useAddWordProgressMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (progress: Omit<WordProgress, 'id'>) => api.addWordProgress(progress),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wordProgress.all() }),
  });
};

export const useUpdateWordProgressMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (progress: WordProgress) => api.updateWordProgress(progress),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wordProgress.all() }),
  });
};

export const useDeleteWordProgressMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteWordProgress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wordProgress.all() }),
  });
};

// ── Lesson Progress ────────────────────────────────────────────────────────
export const useLessonProgressAll = () =>
  useQuery({
    queryKey: queryKeys.lessonProgress.all(),
    queryFn: api.getLessonProgressAll,
  });

export const useAddLessonProgressMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (progress: LessonProgress) => api.addLessonProgress(progress),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lessonProgress.all() }),
  });
};

// ── Session Progress ───────────────────────────────────────────────────────
export const useAllSessionProgress = () =>
  useQuery({
    queryKey: queryKeys.sessionProgress.all(),
    queryFn: api.getAllSessionProgress,
    staleTime: 0,
  });

export const useSessionProgress = (lessonId: string) =>
  useQuery({
    queryKey: queryKeys.sessionProgress.byLesson(lessonId),
    queryFn: () => api.getSessionProgress(lessonId),
    enabled: !!lessonId,
    staleTime: 0,
  });

/** Imperative fetcher — use inside effects or async handlers */
export const useSessionProgressFetcher = () => {
  const qc = useQueryClient();
  return (lessonId: string) =>
    qc.fetchQuery({
      queryKey: queryKeys.sessionProgress.byLesson(lessonId),
      queryFn: () => api.getSessionProgress(lessonId),
      staleTime: 0,
    });
};

export const useSaveSessionProgressMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (progress: SessionProgress) => api.saveSessionProgress(progress),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.sessionProgress.byLesson(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.sessionProgress.all() });
    },
  });
};

export const useDeleteSessionProgressMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => api.deleteSessionProgressByLessonId(lessonId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessionProgress.all() }),
  });
};

// ── Study Log ──────────────────────────────────────────────────────────────
export const useAllStudyLogs = () =>
  useQuery({
    queryKey: queryKeys.studyLog.all(),
    queryFn: api.getAllStudyLogs,
  });

export const useStudyLogByDate = (date: string) =>
  useQuery({
    queryKey: queryKeys.studyLog.byDate(date),
    queryFn: () => api.getStudyLogByDate(date),
    enabled: !!date,
  });

export const useAddStudyLogMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (log: StudyLog) => api.addStudyLog(log),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.studyLog.all() }),
  });
};

export const useUpdateStudyLogMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (log: StudyLog) => api.updateStudyLog(log),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.studyLog.all() }),
  });
};

// ── Stats ──────────────────────────────────────────────────────────────────
export const useStats = () =>
  useQuery({
    queryKey: queryKeys.stats(),
    queryFn: api.getStats,
    staleTime: 0,
  });

export const useUpdateStatsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stats: AppStats) => api.updateStats(stats),
    onSuccess: (data) => qc.setQueryData(queryKeys.stats(), data),
  });
};

// ── Settings ───────────────────────────────────────────────────────────────
export const useSettings = () =>
  useQuery({
    queryKey: queryKeys.settings(),
    queryFn: api.getSettings,
  });

export const useUpdateSettingsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: AppSettings) => api.updateSettings(settings),
    onSuccess: (data) => qc.setQueryData(queryKeys.settings(), data),
  });
};

// ── Backup / Import / Reset ────────────────────────────────────────────────
export const useResetAllDataMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.resetAllData,
    onSuccess: () => qc.clear(),
  });
};

export const useImportBackupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.importBackup(data),
    onSuccess: () => qc.clear(),
  });
};

// ── Vocab Session — compound finish mutation ───────────────────────────────
/**
 * Orchestrates the entire "finish lesson" side-effect sequence:
 *  1. Save word progress for unknown words (continueQueue)
 *  2. Add lesson progress record
 *  3. Delete saved session checkpoint
 *  4. Update aggregate stats (streak, totalWordsLearned, etc.)
 *  5. Upsert today's study log
 * Then invalidates all affected caches in onSuccess.
 */
export const useFinishVocabSessionMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      wordsToSave,
      rememberedWords = [],
    }: {
      lessonId: string;
      wordsToSave: VocabWord[];
      rememberedWords?: VocabWord[];
    }) => {
      // Local date helper — avoids UTC-offset bugs with toISOString()
      const localDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      const today = localDateStr();

      // 1. Current word progress (uses cache when still fresh)
      const existingProgress = await qc
        .fetchQuery({ queryKey: queryKeys.wordProgress.all(), queryFn: api.getWordProgressAll })
        .catch(() => [] as Awaited<ReturnType<typeof api.getWordProgressAll>>);
      const existingIds = new Set(existingProgress.map((p) => p.id));

      // 2–4. Run independent writes in parallel
      const uniqueContinueTerms = [...new Map(wordsToSave.map((w) => [w.term, w])).values()];
      const uniqueRememberedTerms = [...new Map(rememberedWords.map((w) => [w.term, w])).values()];
      
      const newWordsCount = uniqueContinueTerms.filter(
        (w) => !existingIds.has(w.term.trim().toLowerCase()),
      ).length;

      // Find existing progress for these terms
      const existingMap = new Map(existingProgress.map(p => [p.id, p]));

      await Promise.all([
        // 2. Add word progress for brand new words
        ...uniqueContinueTerms
          .filter((w) => !existingIds.has(w.term.trim().toLowerCase()))
          .map((w) => api.addWordProgress(createInitialWordProgress(w.term, lessonId))),

        // 2b. Update existing progress for words in continue queue (Reinforcement)
        ...uniqueContinueTerms
          .filter(w => existingIds.has(w.term.trim().toLowerCase()))
          .map(w => {
            const p = existingMap.get(w.term.trim().toLowerCase())!;
            return api.updateWordProgress({ ...p, lastStudied: today });
          }),

        // 2c. Promote Level for remembered words already in progress (Manual Promotion)
        ...uniqueRememberedTerms
          .filter(w => existingIds.has(w.term.trim().toLowerCase()))
          .map(w => {
            const p = existingMap.get(w.term.trim().toLowerCase())!;
            const { newLevel, nextReviewDate } = calculateNextReview(p.level, true);
            return api.updateWordProgress({
              ...p,
              level: newLevel,
              nextReview: nextReviewDate,
              lastStudied: today,
              correctCount: p.correctCount + 1
            });
          }),

        // 3. Upsert lesson progress
        api.getLessonProgressAll().then((all) => {
          const existing = all.find((lp) => lp.id === lessonId && lp.type === 'vocabulary');
          const payload: LessonProgress = { id: lessonId, type: 'vocabulary', completedAt: new Date().toISOString() };
          return existing
            ? api.updateLessonProgress(payload)
            : api.addLessonProgress(payload);
        }),
        // 4. Delete session checkpoint
        api.deleteSessionProgressByLessonId(lessonId).catch(() => {}),
      ]);

      // 5. Update stats (uses local date for correct streak calculation)
      const currentStats = await qc.fetchQuery({
        queryKey: queryKeys.stats(),
        queryFn: api.getStats,
      });
      const lastDate = currentStats.lastStudyDate;
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
      const newStreak =
        lastDate === yesterday || lastDate === today
          ? currentStats.currentStreak + (lastDate === today ? 0 : 1)
          : 1;
      const newStudyDays =
        lastDate === today ? currentStats.totalStudyDays : currentStats.totalStudyDays + 1;
      await api.updateStats({
        ...currentStats,
        totalWordsLearned: currentStats.totalWordsLearned + newWordsCount,
        currentStreak: newStreak,
        lastStudyDate: today,
        totalStudyDays: newStudyDays,
      });

      // 6. Upsert study log (staleTime:0 ensures we read the latest count)
      const existingLog = await qc
        .fetchQuery({
          queryKey: queryKeys.studyLog.byDate(today),
          queryFn: () => api.getStudyLogByDate(today),
          staleTime: 0,
        })
        .catch(() => null);
      if (existingLog) {
        await api.updateStudyLog({
          ...existingLog,
          wordsLearned: existingLog.wordsLearned + newWordsCount,
        });
      } else {
        await api.addStudyLog({
          id: today,
          date: today,
          wordsLearned: newWordsCount,
          wordsReviewed: 0,
        });
      }

      return { newWordsCount, wordsSaved: uniqueContinueTerms.map((w) => w.term) };
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wordProgress.all() });
      qc.invalidateQueries({ queryKey: queryKeys.lessonProgress.all() });
      qc.invalidateQueries({ queryKey: queryKeys.sessionProgress.all() });
      qc.invalidateQueries({ queryKey: queryKeys.stats() });
      qc.invalidateQueries({ queryKey: queryKeys.studyLog.all() });
    },
  });
};/**
 * useFinishDailyReviewMutation
 * Updates stats and study log after a review session (Daily or General).
 */
export const useFinishDailyReviewMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewedCount }: { reviewedCount: number }) => {
      const localDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      const today = localDateStr();

      // 1. Update stats
      const currentStats = await qc.fetchQuery({
        queryKey: queryKeys.stats(),
        queryFn: api.getStats,
      });
      const lastDate = currentStats.lastStudyDate;
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
      
      const newStreak =
        lastDate === yesterday || lastDate === today
          ? currentStats.currentStreak + (lastDate === today ? 0 : 1)
          : 1;
      const newStudyDays =
        lastDate === today ? currentStats.totalStudyDays : currentStats.totalStudyDays + 1;

      await api.updateStats({
        ...currentStats,
        currentStreak: newStreak,
        lastStudyDate: today,
        totalStudyDays: newStudyDays,
      });

      // 2. Update study log
      const existingLog = await qc
        .fetchQuery({
          queryKey: queryKeys.studyLog.byDate(today),
          queryFn: () => api.getStudyLogByDate(today),
          staleTime: 0,
        })
        .catch(() => null);

      if (existingLog) {
        await api.updateStudyLog({
          ...existingLog,
          wordsReviewed: (existingLog.wordsReviewed || 0) + reviewedCount,
        });
      } else {
        await api.addStudyLog({
          id: today,
          date: today,
          wordsLearned: 0,
          wordsReviewed: reviewedCount,
        });
      }

      return { reviewedCount };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stats() });
      qc.invalidateQueries({ queryKey: queryKeys.studyLog.all() });
    },
  });
};
