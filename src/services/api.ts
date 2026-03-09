import http from './http';
import {
  Lesson,
  VocabWord,
  WordProgress,
  GrammarLesson,
  ReadingLesson,
  LessonProgress,
  SessionProgress,
  StudyLog,
  AppStats,
  AppSettings,
} from '../types';

const USER_COLLECTIONS = [
  'wordProgress', 'lessonProgress', 'sessionProgress', 'studyLog',
] as const;

export const api = {
  // --- Lessons ---
  getLessonsByLevel: (level: string) =>
    http.get<Lesson[]>(`/lessons?level=${level}`).then((r) => r.data),
  getLessonById: (id: string) =>
    http.get<Lesson>(`/lessons/${id}`).then((r) => r.data),
  getAllLessons: () =>
    http.get<Lesson[]>('/lessons').then((r) => r.data),
  getAllLessonWords: () =>
    http.get<(VocabWord & { lessonId: string; lessonName: string; level: string })[]>('/lessons/words').then((r) => r.data),

  // --- Grammar ---
  getGrammarLessonsByLevel: (level: string) =>
    http.get<GrammarLesson[]>(`/grammar?level=${level}`).then((r) => r.data),
  getGrammarLessonById: (id: string) =>
    http.get<GrammarLesson>(`/grammar/${id}`).then((r) => r.data),

  // --- Reading ---
  getReadingLessonsByLevel: (level: string) =>
    http.get<ReadingLesson[]>(`/reading?level=${level}`).then((r) => r.data),
  getReadingLessonById: (id: string) =>
    http.get<ReadingLesson>(`/reading/${id}`).then((r) => r.data),

  // --- Word Progress ---
  getWordProgressAll: () =>
    http.get<WordProgress[]>('/wordProgress').then((r) => r.data),
  getWordProgressByLesson: (lessonId: string) =>
    http.get<WordProgress[]>(`/wordProgress?lessonId=${lessonId}`).then((r) => r.data),
  addWordProgress: (progress: Omit<WordProgress, 'id'>) =>
    http.post<WordProgress>('/wordProgress', {
      ...progress,
      id: progress.term.trim().toLowerCase(),
    }).then((r) => r.data),
  updateWordProgress: (progress: WordProgress) =>
    http.put<WordProgress>(`/wordProgress/${encodeURIComponent(progress.id)}`, progress)
      .then((r) => r.data),
  deleteWordProgress: (id: string) =>
    http.delete(`/wordProgress/${encodeURIComponent(id)}`),

  // --- Lesson Progress ---
  getLessonProgressAll: () =>
    http.get<LessonProgress[]>('/lessonProgress').then((r) => r.data),
  addLessonProgress: (progress: LessonProgress) =>
    http.post<LessonProgress>('/lessonProgress', progress).then((r) => r.data),
  updateLessonProgress: (progress: LessonProgress) =>
    http.put<LessonProgress>(`/lessonProgress/${encodeURIComponent(progress.id)}`, progress).then((r) => r.data),

  // --- Session Progress ---
  getSessionProgress: (id: string) =>
    http.get<SessionProgress[]>(`/sessionProgress?id=${encodeURIComponent(id)}`)
      .then(({ data }) =>
        data.length > 0
          ? data.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0]
          : null,
      ),
  getAllSessionProgress: () =>
    http.get<SessionProgress[]>('/sessionProgress').then((r) => r.data),
  saveSessionProgress: async (progress: SessionProgress) => {
    const { data: existing } = await http.get<SessionProgress[]>(
      `/sessionProgress?id=${encodeURIComponent(progress.id)}`,
    );
    if (existing.length > 0) {
      const latest = existing.sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      )[0] as SessionProgress & { id: number | string };
      return http.patch<SessionProgress>(`/sessionProgress/${latest.id}`, progress)
        .then((r) => r.data);
    }
    return http.post<SessionProgress>('/sessionProgress', progress).then((r) => r.data);
  },
  deleteSessionProgress: (id: string) =>
    http.delete(`/sessionProgress/${encodeURIComponent(id)}`),
  // Delete all session records matching a business lesson id (may have multiple rows)
  deleteSessionProgressByLessonId: async (lessonId: string) => {
    const { data: records } = await http.get<Array<{ id: number | string }>>(
      `/sessionProgress?id=${encodeURIComponent(lessonId)}`,
    );
    await Promise.all(records.map((rec) => http.delete(`/sessionProgress/${rec.id}`)));
  },

  // --- Study Log ---
  getAllStudyLogs: () =>
    http.get<StudyLog[]>('/studyLog').then((r) => r.data),
  getStudyLogByDate: (date: string) =>
    http.get<StudyLog[]>(`/studyLog?date=${date}`)
      .then(({ data }) => (data.length > 0 ? data[0] : null)),
  addStudyLog: (log: StudyLog) =>
    http.post<StudyLog>('/studyLog', log).then((r) => r.data),
  updateStudyLog: (log: StudyLog) =>
    http.put<StudyLog>(`/studyLog/${log.id}`, log).then((r) => r.data),

  // --- Stats ---
  getStats: () =>
    http.get<AppStats>('/stats').then((r) => r.data),
  updateStats: (stats: AppStats) =>
    http.put<AppStats>('/stats', stats).then((r) => r.data),

  // --- Settings ---
  getSettings: () =>
    http.get<AppSettings>('/settings').then((r) => r.data),
  updateSettings: (settings: AppSettings) =>
    http.put<AppSettings>('/settings', settings).then((r) => r.data),

  // --- Backup / Restore / Reset (used by SettingsPage) ---
  exportBackup: async (): Promise<Record<string, unknown>> => {
    const keys = [...USER_COLLECTIONS, 'stats', 'settings'] as string[];
    const data: Record<string, unknown> = {};
    for (const key of keys) {
      data[key] = await http.get(`/${key}`).then((r) => r.data);
    }
    return data;
  },
  importBackup: async (data: Record<string, unknown>): Promise<void> => {
    const keys = [...USER_COLLECTIONS, 'stats', 'settings'] as string[];
    for (const key of keys) {
      const items = data[key];
      if (Array.isArray(items)) {
        const existing = await http.get<Array<{ id: string | number }>>(`/${key}`).then((r) => r.data);
        for (const item of existing) {
          await http.delete(`/${key}/${encodeURIComponent(item.id)}`);
        }
        for (const item of items) {
          await http.post(`/${key}`, item);
        }
      } else {
        await http.put(`/${key}`, items);
      }
    }
  },
  resetAllData: async (): Promise<void> => {
    for (const col of USER_COLLECTIONS) {
      const items = await http.get<Array<{ id: string | number }>>(`/${col}`).then((r) => r.data);
      await Promise.all(items.map((item) => http.delete(`/${col}/${encodeURIComponent(item.id)}`)));
    }
    await http.put('/stats', {
      totalWordsLearned: 0,
      currentStreak: 0,
      lastStudyDate: '',
      totalStudyDays: 0,
    });
  },
};
