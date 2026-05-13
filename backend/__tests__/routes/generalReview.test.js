import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import userDataRouter from '../../routes/userData.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../utils/dbSetup.js';
import { WordProgress, Stats, StudyLog } from '../../models/UserModels.js';

const app = express();
app.use(express.json());
app.use('/', userDataRouter);

describe('General Review Backend API Integration', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearTestDB();

    // Setup a clean DB snapshot BEFORE each test.
    await Stats.create({
      id: 1,
      totalWordsLearned: 0, // Starts at 0 matching empty wordProgress
      currentStreak: 2,
      lastStudyDate: '2026-03-23',
      totalStudyDays: 2,
    });
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

      // Words are successfully persisted in the mock DB
      const words = await WordProgress.find({}).lean();
      expect(words).toHaveLength(2);

      const savedVictory = words.find((w) => w.term === 'victory');
      expect(savedVictory.level).toBe(2); // General review + correct = Level 2
      expect(savedVictory.correctCount).toBe(1);

      const savedDefeat = words.find((w) => w.term === 'defeat');
      expect(savedDefeat.level).toBe(1); // General review + incorrect = Level 1
      expect(savedDefeat.incorrectCount).toBe(1);

      // Stats are updated
      const stats = await Stats.findOne({ id: 1 }).lean();
      expect(stats.totalWordsLearned).toBe(2); // 0 + 2
      expect(stats.currentStreak).toBe(3); // Consecutive day
      expect(stats.totalStudyDays).toBe(3);

      // Study log is created natively
      const studyLogs = await StudyLog.find({}).lean();
      expect(studyLogs).toHaveLength(1);
      expect(studyLogs[0].wordsLearned).toBe(2);
      expect(studyLogs[0].wordsReviewed).toBe(0);
    });
  });
});
