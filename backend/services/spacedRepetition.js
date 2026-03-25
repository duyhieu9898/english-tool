// The 5-level Spaced Repetition intervals in days
const INTERVALS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30, // Level 5 usually means graduated/removed
};

/**
 * Calculates the next review date and new level based on performance.
 * @param {number} currentLevel 
 * @param {boolean} isCorrect 
 * @returns {{ newLevel: number, nextReviewDate: string }}
 */
export const calculateNextReview = (currentLevel, isCorrect) => {
  let newLevel = currentLevel;

  if (isCorrect) {
    newLevel = Math.min(currentLevel + 1, 5);
  } else {
    newLevel = 1;
  }

  const daysToAdd = INTERVALS[newLevel] || 1;

  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);

  return {
    newLevel,
    nextReviewDate: date.toISOString().split('T')[0], // YYYY-MM-DD
  };
};

/**
 * Creates the initial object for a new word added to the system.
 * @param {string} term 
 * @param {string} lessonId 
 * @param {number} initialLevel 
 * @returns {Object}
 */
export const createInitialWordProgress = (term, lessonId, initialLevel = 1) => {
  // If it's correct right off the bat, we might pass initialLevel 2. The formula calculates the *next* interval based on this level.
  // We pass (initialLevel - 1) to `calculateNextReview` to pretend it correctly advanced from the previous level.
  const { newLevel, nextReviewDate } = calculateNextReview(initialLevel - 1, true);

  return {
    id: term, // Simple id formulation as per existing generic system
    term,
    lessonId,
    level: newLevel,
    lastStudied: new Date().toISOString().split('T')[0],
    nextReview: nextReviewDate,
    correctCount: 1, 
    incorrectCount: 0,
  };
};
