import type { WordProgress } from '../types';

// The 5-level Spaced Repetition intervals in days
const INTERVALS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30, // Level 5 usually means graduated/removed, but keeping it here for reference
};

export const calculateNextReview = (
  currentLevel: number,
  isCorrect: boolean,
): { newLevel: 1 | 2 | 3 | 4 | 5; nextReviewDate: string } => {
  let newLevel = currentLevel;

  if (isCorrect) {
    newLevel = Math.min(currentLevel + 1, 5);
  } else {
    newLevel = 1;
  }

  const daysToAdd = INTERVALS[newLevel as keyof typeof INTERVALS] || 1;

  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);

  // Return ISO string without time portion or complete ISO string
  return {
    newLevel: newLevel as 1 | 2 | 3 | 4 | 5,
    nextReviewDate: date.toISOString().split('T')[0], // YYYY-MM-DD
  };
};

export const createInitialWordProgress = (
  term: string,
  lessonId: string,
  initialLevel: 1 | 2 | 3 | 4 | 5 = 1,
): Omit<WordProgress, 'id'> => {
  const { newLevel, nextReviewDate } = calculateNextReview(initialLevel - 1, true);

  return {
    term,
    lessonId,
    level: newLevel,
    lastStudied: new Date().toISOString().split('T')[0],
    nextReview: nextReviewDate,
    correctCount: 1, // Count the initial batch review success
    incorrectCount: 0,
  };
};
