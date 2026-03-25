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
import type {
  VocabWord,
  Lesson,
  LessonProgress,
  SessionProgress,
  StudyLog,
  AppStats,
  AppSettings,
  ReviewResult,
} from '../types';

// ── Lessons ────────────────────────────────────────────────────────────────
export const useLessons = (level?: string) =>
  useQuery({
    queryKey: level ? queryKeys.lessons.byLevel(level) : queryKeys.lessons.all(),
    queryFn: () => level ? api.getLessonsByLevel(level) : api.getAllLessons(),
  });

/** Helper to merge duplicate terms (same word, different class/meaning) */
export const consolidateLessonWords = (data: Lesson): Lesson => {
  const consolidatedWords: VocabWord[] = [];
  data.words.forEach((current) => {
    const existing = consolidatedWords.find(
      (w) => w.term.toLowerCase() === current.term.toLowerCase(),
    );
    if (existing) {
      // Merge classes (modifiers)
      if (!existing.modifiers.toLowerCase().includes(current.modifiers.toLowerCase())) {
        existing.modifiers += `, ${current.modifiers}`;
      }
      // Merge meanings
      if (!existing.meaning.includes(current.meaning)) {
        existing.meaning += `; ${current.meaning}`;
      }
      // Convert full_sentence to a list if it's the second sentence
      if (!existing.full_sentence.includes(current.full_sentence)) {
        if (!existing.full_sentence.startsWith('•')) {
          existing.full_sentence = `• ${existing.full_sentence}\n• ${current.full_sentence}`;
        } else {
          existing.full_sentence += `\n• ${current.full_sentence}`;
        }
      }
    } else {
      consolidatedWords.push({ ...current });
    }
  });
  return { ...data, words: consolidatedWords };
};

export const useLesson = (id: string, options?: { consolidate?: boolean }) =>
  useQuery({
    queryKey: queryKeys.lessons.detail(id),
    queryFn: () => api.getLessonById(id),
    enabled: !!id,
    select: options?.consolidate ? consolidateLessonWords : undefined,
  });

/** Flat list of every word in every lesson — used by SearchVocab */
export const useAllLessonWords = () =>
  useQuery({
    queryKey: [...queryKeys.lessons.all(), 'words'] as const,
    queryFn: api.getAllLessonWords,
    staleTime: Infinity, // static content — never changes at runtime
  });


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
export const useFinishSessionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.finishSession>[0]) => api.finishSession(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wordProgress.all() });
      qc.invalidateQueries({ queryKey: queryKeys.stats() });
      qc.invalidateQueries({ queryKey: queryKeys.studyLog.all() });
    },
  });
};

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
    refetchOnWindowFocus: false,
  });


export const useSaveSessionProgressMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (progress: SessionProgress) => api.saveSessionProgress(progress),
    onSuccess: (data, vars) => {
      qc.setQueryData(queryKeys.sessionProgress.byLesson(vars.id), data);
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

      // 1-4. Run independent writes in parallel
      const uniqueContinueTerms = [...new Map(wordsToSave.map((w) => [w.term, w])).values()];
      const uniqueRememberedTerms = [...new Map(rememberedWords.map((w) => [w.term, w])).values()];
      
      const newWordsCount = uniqueContinueTerms.length; // Actually, the BE handles exact new/old, but for stats we just count all continue terms as learned 

      const reviews: ReviewResult[] = [];
      uniqueContinueTerms.forEach(w => reviews.push({ term: w.term, lessonId, isCorrect: false, isBossBattle: false }));
      uniqueRememberedTerms.forEach(w => reviews.push({ term: w.term, lessonId, isCorrect: true, isBossBattle: false }));

      await Promise.all([
        // 2 & 5. Process word progress, stats, and study log atomically on backend
        api.finishSession({ clientDate: today, reviews }),

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

      return { newWordsCount, wordsSaved: uniqueContinueTerms.map((w) => w.term) };
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wordProgress.all() });
      qc.invalidateQueries({ queryKey: queryKeys.lessonProgress.all() });
      qc.invalidateQueries({ queryKey: queryKeys.sessionProgress.all() });
      qc.invalidateQueries({ queryKey: queryKeys.stats() });
    },
  });
};
