import { calculateNextReview, createInitialWordProgress } from './spacedRepetition.js';

/**
 * Returns the YYYY-MM-DD string for the day immediately preceding the given date string.
 */
function getYesterdayString(dateString) {
  const d = new Date(dateString);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Handles bulk session finalization, including word progression, streaks, and study logs.
 * Mutable operation: Updates the `dbSnapshot` in-place.
 *
 * @param {Object} dbSnapshot - The current database snapshot.
 * @param {string} clientDate - The local YYYY-MM-DD string from the client.
 * @param {Array} reviews - Array of review items: { term, lessonId, isCorrect, isGeneralReview }.
 * @returns {Object} Summary counts of the processed session.
 */
export function processSessionFinish({ existingWords, stats, todayLog }, clientDate, reviews) {
  let wordsLearned = 0;
  let wordsReviewed = 0;

  const updatedWords = [];
  const graduatedWords = [];

  const existingWordsMap = new Map(existingWords.map((w) => [String(w.id), w]));

  // 1. Process all word reviews
  reviews.forEach(({ term, lessonId, isCorrect, isGeneralReview }) => {
    const termStr = String(term);
    const existingWord = existingWordsMap.get(termStr);

    if (existingWord) {
      // Reviewing an existing word
      wordsReviewed++;
      const { newLevel, nextReviewDate } = calculateNextReview(existingWord.level, isCorrect);

      if (newLevel === 5) {
        // Graduate word (Level 5)
        graduatedWords.push(existingWord);
      } else {
        const updatedWord = {
          ...existingWord,
          level: newLevel,
          nextReview: nextReviewDate,
          lastStudied: new Date().toISOString().split('T')[0],
          correctCount: (existingWord.correctCount || 0) + (isCorrect ? 1 : 0),
          incorrectCount: (existingWord.incorrectCount || 0) + (isCorrect ? 0 : 1),
        };
        updatedWords.push(updatedWord);
      }
    } else {
      // Learning a new word
      wordsLearned++;
      const initialLevel = isCorrect && isGeneralReview ? 2 : 1;
      const newItem = createInitialWordProgress(term, lessonId, initialLevel);

      newItem.correctCount = isCorrect ? 1 : 0;
      newItem.incorrectCount = isCorrect ? 0 : 1;
      updatedWords.push(newItem);
    }
  });

  // 2. Update stats (Streak calculations)
  const newStats = stats
    ? { ...stats }
    : { id: 1, totalWordsLearned: 0, currentStreak: 0, lastStudyDate: '', totalStudyDays: 0 };

  if (wordsLearned > 0 || wordsReviewed > 0) {
    newStats.totalWordsLearned = (newStats.totalWordsLearned || 0) + wordsLearned;

    const yesterday = getYesterdayString(clientDate);

    if (newStats.lastStudyDate === yesterday) {
      newStats.currentStreak = (newStats.currentStreak || 0) + 1;
      newStats.totalStudyDays = (newStats.totalStudyDays || 0) + 1;
    } else if (newStats.lastStudyDate !== clientDate) {
      // Gap in studying or completely new tracking history
      newStats.currentStreak = 1;
      newStats.totalStudyDays = (newStats.totalStudyDays || 0) + 1;
    }

    newStats.lastStudyDate = clientDate;
  }

  // 3. Update Study Log
  let newLog = todayLog;
  if (wordsLearned > 0 || wordsReviewed > 0) {
    if (newLog) {
      newLog = {
        ...newLog,
        wordsLearned: (newLog.wordsLearned || 0) + wordsLearned,
        wordsReviewed: (newLog.wordsReviewed || 0) + wordsReviewed,
      };
    } else {
      newLog = {
        id: clientDate,
        date: clientDate,
        wordsLearned,
        wordsReviewed,
      };
    }
  }

  return {
    wordsLearned,
    wordsReviewed,
    updatedWords,
    graduatedWords,
    updatedStats: newStats,
    updatedLog: newLog,
  };
}
