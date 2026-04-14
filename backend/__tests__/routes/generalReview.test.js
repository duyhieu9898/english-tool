import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import userDataRouter from '../../routes/userData.js';
import db from '../../db/userDb.js';

// Mock the database
vi.mock('../../db/userDb.js', () => ({
  default: {
    load: vi.fn(),
    save: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/', userDataRouter);

describe('General Review Backend API Integration', () => {
  let mockDbSnapshot;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup a clean DB snapshot BEFORE each test.
    mockDbSnapshot = {
      wordProgress: [],
      stats: {
        id: 1,
        totalWordsLearned: 0, // Starts at 0 matching empty wordProgress
        currentStreak: 2,
        lastStudyDate: '2026-03-23',
        totalStudyDays: 2,
      },
      studyLog: [],
    };

    // Return the controlled snapshot
    db.load.mockReturnValue(mockDbSnapshot);
  });

  describe('General Word Submissions & Stats', () => {
    it('should ADD new words and UPDATE stats in a single transaction via POST /session/finish', async () => {
      const payload = {
        clientDate: '2026-03-24', // next day
        reviews: [
          { term: 'victory', lessonId: '1', isCorrect: true, isGeneralReview: true },
          { term: 'defeat', lessonId: '1', isCorrect: false, isGeneralReview: true },
        ],
      };

      const response = await request(app).post('/session/finish').send(payload);

      expect(response.status).toBe(200);
      expect(response.body.wordsLearned).toBe(2);
      expect(response.body.wordsReviewed).toBe(0);

      expect(db.save).toHaveBeenCalledTimes(1);
      const savedSnapshot = db.save.mock.calls[0][0];

      // Words are successfully persisted in the mock DB
      expect(savedSnapshot.wordProgress).toHaveLength(2);

      const savedVictory = savedSnapshot.wordProgress.find((w) => w.term === 'victory');
      expect(savedVictory.level).toBe(2); // General review + correct = Level 2
      expect(savedVictory.correctCount).toBe(1);

      const savedDefeat = savedSnapshot.wordProgress.find((w) => w.term === 'defeat');
      expect(savedDefeat.level).toBe(1); // General review + incorrect = Level 1
      expect(savedDefeat.incorrectCount).toBe(1);

      // Stats are updated
      expect(savedSnapshot.stats.totalWordsLearned).toBe(2); // 0 + 2
      expect(savedSnapshot.stats.currentStreak).toBe(3); // Consecutive day
      expect(savedSnapshot.stats.totalStudyDays).toBe(3);

      // Study log is created natively
      expect(savedSnapshot.studyLog).toHaveLength(1);
      expect(savedSnapshot.studyLog[0].wordsLearned).toBe(2);
      expect(savedSnapshot.studyLog[0].wordsReviewed).toBe(0);
    });
  });
});
