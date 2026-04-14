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
export function processSessionFinish(dbSnapshot, clientDate, reviews) {
  if (!dbSnapshot.wordProgress) dbSnapshot.wordProgress = [];
  const wordsData = dbSnapshot.wordProgress;

  let wordsLearned = 0;
  let wordsReviewed = 0;
  const graduatedItems = [];

  // 1. Process all word reviews
  reviews.forEach(({ term, lessonId, isCorrect, isGeneralReview }) => {
    const existingIdx = wordsData.findIndex(d => String(d.id) === String(term));
    
    if (existingIdx !== -1) {
      // Reviewing an existing word
      wordsReviewed++;
      const word = wordsData[existingIdx];
      const { newLevel, nextReviewDate } = calculateNextReview(word.level, isCorrect);
      
      if (newLevel === 5) {
        // Graduate word (Level 5)
        const [deleted] = wordsData.splice(existingIdx, 1);
        graduatedItems.push(deleted);
      } else {
        word.level = newLevel;
        word.nextReview = nextReviewDate;
        word.lastStudied = new Date().toISOString().split('T')[0];
        
        if (isCorrect) {
          word.correctCount = (word.correctCount || 0) + 1;
        } else {
          word.incorrectCount = (word.incorrectCount || 0) + 1;
        }
      }
    } else {
      // Learning a new word
      wordsLearned++;
      const initialLevel = (isCorrect && isGeneralReview) ? 2 : 1;
      const newItem = createInitialWordProgress(term, lessonId, initialLevel);
      
      newItem.correctCount = isCorrect ? 1 : 0;
      newItem.incorrectCount = isCorrect ? 0 : 1;
      wordsData.push(newItem);
    }
  });

  // 2. Update stats (Streak calculations)
  if (!dbSnapshot.stats) {
    dbSnapshot.stats = { totalWordsLearned: 0, currentStreak: 0, lastStudyDate: '', totalStudyDays: 0 };
  }
  const stats = dbSnapshot.stats;

  if (wordsLearned > 0 || wordsReviewed > 0) {
    stats.totalWordsLearned = (stats.totalWordsLearned || 0) + wordsLearned;

    const yesterday = getYesterdayString(clientDate);

    if (stats.lastStudyDate === yesterday) {
      stats.currentStreak = (stats.currentStreak || 0) + 1;
      stats.totalStudyDays = (stats.totalStudyDays || 0) + 1;
    } else if (stats.lastStudyDate !== clientDate) {
      // Gap in studying or completely new tracking history
      stats.currentStreak = 1;
      stats.totalStudyDays = (stats.totalStudyDays || 0) + 1;
    }
    
    stats.lastStudyDate = clientDate;

    // 3. Upsert studyLog
    if (!dbSnapshot.studyLog) dbSnapshot.studyLog = [];
    const logData = dbSnapshot.studyLog;
    
    const existingLogIdx = logData.findIndex(l => String(l.date) === String(clientDate));
    if (existingLogIdx !== -1) {
      logData[existingLogIdx].wordsLearned = (logData[existingLogIdx].wordsLearned || 0) + wordsLearned;
      logData[existingLogIdx].wordsReviewed = (logData[existingLogIdx].wordsReviewed || 0) + wordsReviewed;
    } else {
      logData.push({
        id: clientDate,
        date: clientDate,
        wordsLearned,
        wordsReviewed
      });
    }
  }

  return { wordsLearned, wordsReviewed, graduatedItems };
}
