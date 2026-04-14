/**
 * hooks/queryKeys.ts
 * Single source of truth for all React Query cache keys.
 * Structured as factories so dependent queries can be precisely invalidated.
 */

export const queryKeys = {
  // ── Content (read-only) ───────────────────────────────────────────────
  lessons: {
    all: () => ['lessons'] as const,
    byLevel: (level: string) => ['lessons', 'level', level] as const,
    detail: (id: string) => ['lessons', 'detail', id] as const,
  },
  grammar: {
    all: () => ['grammar'] as const,
    byLevel: (level: string) => ['grammar', 'level', level] as const,
    detail: (id: string) => ['grammar', 'detail', id] as const,
  },
  reading: {
    all: () => ['reading'] as const,
    byLevel: (level: string) => ['reading', 'level', level] as const,
    detail: (id: string) => ['reading', 'detail', id] as const,
  },
  listening: {
    all: () => ['listening'] as const,
    byLevel: (level: string) => ['listening', 'level', level] as const,
    detail: (id: string) => ['listening', 'detail', id] as const,
  },

  // ── User data (mutable) ───────────────────────────────────────────────
  wordProgress: {
    all: () => ['wordProgress'] as const,
    byLesson: (id: string) => ['wordProgress', 'lesson', id] as const,
  },
  lessonProgress: {
    all: () => ['lessonProgress'] as const,
  },
  sessionProgress: {
    all: () => ['sessionProgress'] as const,
    byLesson: (id: string) => ['sessionProgress', 'lesson', id] as const,
  },
  studyLog: {
    all: () => ['studyLog'] as const,
    byDate: (date: string) => ['studyLog', 'date', date] as const,
  },
  stats: () => ['stats'] as const,
  settings: () => ['settings'] as const,
} as const;
