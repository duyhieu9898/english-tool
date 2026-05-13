import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import userDataRouter from '../../routes/userData.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../utils/dbSetup.js';
import { WordProgress, Stats, StudyLog } from '../../models/UserModels.js';

const app = express();
app.use(express.json());
app.use('/', userDataRouter);

describe('Daily Review Backend API Integration (userData Router)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearTestDB();

    // Setup a clean DB snapshot before each test directly in MongoDB
    await WordProgress.insertMany([
      {
        id: 'apple',
        term: 'apple',
        lessonId: '1',
        level: 1,
        lastStudied: '2026-03-20',
        nextReview: '2026-03-21',
        correctCount: 1,
        incorrectCount: 0,
      },
      {
        id: 'banana',
        term: 'banana',
        lessonId: '1',
        level: 4,
        lastStudied: '2026-03-10',
        nextReview: '2026-03-24',
        correctCount: 4,
        incorrectCount: 0,
      },
    ]);

    await Stats.create({
      id: 1,
      totalWordsLearned: 2,
      currentStreak: 5,
      lastStudyDate: '2026-03-23',
      totalStudyDays: 5,
    });
  });

  describe('Unified Bulk Session Processing', () => {
    it('should UPGRADE existing words and LEARN new words while maintaining Streaks', async () => {
      const payload = {
        clientDate: '2026-03-24', // yesterday is '2026-03-23' which matches the mock lastStudyDate
        reviews: [
          { term: 'apple', lessonId: '1', isCorrect: true, isGeneralReview: false }, // Existing word: UPGRADE
          { term: 'orange', lessonId: '1', isCorrect: true, isGeneralReview: true }, // New word: LEARN (level 2)
        ],
      };

      const response = await request(app).post('/session/finish').send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.wordsReviewed).toBe(1);
      expect(response.body.wordsLearned).toBe(1);
      expect(response.body.graduatedItems).toHaveLength(0);

      // Word checks
      const words = await WordProgress.find({}).lean();
      expect(words).toHaveLength(3); // apple, banana, orange
      
      const savedApple = words.find((w) => w.id === 'apple');
      const savedOrange = words.find((w) => w.id === 'orange');
      expect(savedApple.level).toBe(2);
      expect(savedOrange.level).toBe(2);

      // Streak & Stats checks
      const stats = await Stats.findOne({ id: 1 }).lean();
      expect(stats.currentStreak).toBe(6);
      expect(stats.totalStudyDays).toBe(6);
      expect(stats.totalWordsLearned).toBe(3); // 2 + 1 new word
      expect(stats.lastStudyDate).toBe('2026-03-24');

      // Study Log checks
      const studyLogs = await StudyLog.find({}).lean();
      expect(studyLogs).toHaveLength(1);
      expect(studyLogs[0].wordsLearned).toBe(1);
      expect(studyLogs[0].wordsReviewed).toBe(1);
    });

    it('should DOWNGRADE a word and GRADUATE a word in a single transaction', async () => {
      const payload = {
        clientDate: '2026-03-26', // Gap day, 2 days after '2026-03-23'
        reviews: [
          { term: 'apple', lessonId: '1', isCorrect: false, isGeneralReview: false }, // Level 1 -> 1 (incorrect)
          { term: 'banana', lessonId: '1', isCorrect: true, isGeneralReview: false }, // Level 4 -> 5 (graduate)
        ],
      };

      const response = await request(app).post('/session/finish').send(payload);

      expect(response.status).toBe(200);
      expect(response.body.wordsReviewed).toBe(2);
      expect(response.body.graduatedItems).toHaveLength(1);
      expect(response.body.graduatedItems[0].id).toBe('banana');

      const words = await WordProgress.find({}).lean();
      expect(words).toHaveLength(1); // Only apple remains
      
      const savedApple = words.find((w) => w.id === 'apple');
      expect(savedApple.level).toBe(1);
      expect(savedApple.incorrectCount).toBe(1);

      // Streak should be reset to 1 because of the gap day
      const stats = await Stats.findOne({ id: 1 }).lean();
      expect(stats.currentStreak).toBe(1);
      expect(stats.totalStudyDays).toBe(6);
    });

    it('should MAINTAIN streak and LOG properly when studying multiple times the same day', async () => {
      const payload = {
        clientDate: '2026-03-23', // Same day as mock lastStudyDate
        reviews: [{ term: 'apple', lessonId: '1', isCorrect: true, isGeneralReview: false }],
      };

      const response = await request(app).post('/session/finish').send(payload);

      expect(response.status).toBe(200);

      const stats = await Stats.findOne({ id: 1 }).lean();

      // Streak should remain 5
      expect(stats.currentStreak).toBe(5);
      expect(stats.totalStudyDays).toBe(5);
    });
    it('should ACCUMULATE StudyLog if an entry for the clientDate already exists', async () => {
      // Setup: Create a StudyLog for the same date before the test
      await StudyLog.create({
        id: '2026-03-24',
        date: '2026-03-24',
        wordsLearned: 5,
        wordsReviewed: 10,
      });

      const payload = {
        clientDate: '2026-03-24',
        reviews: [
          { term: 'orange', lessonId: '1', isCorrect: true, isGeneralReview: true }, // 1 new learned
          { term: 'apple', lessonId: '1', isCorrect: true, isGeneralReview: false }, // 1 reviewed
        ],
      };

      const response = await request(app).post('/session/finish').send(payload);
      expect(response.status).toBe(200);

      const logs = await StudyLog.find({}).lean();
      expect(logs).toHaveLength(1);
      expect(logs[0].wordsLearned).toBe(6); // 5 + 1
      expect(logs[0].wordsReviewed).toBe(11); // 10 + 1
    });

    it('should return 400 Bad Request if clientDate or reviews are missing', async () => {
      const responseMissingDate = await request(app).post('/session/finish').send({ reviews: [] });
      expect(responseMissingDate.status).toBe(400);
      expect(responseMissingDate.body.error).toBe('Missing clientDate or reviews array');

      const responseMissingReviews = await request(app).post('/session/finish').send({ clientDate: '2026-03-24' });
      expect(responseMissingReviews.status).toBe(400);
      expect(responseMissingReviews.body.error).toBe('Missing clientDate or reviews array');
    });

    it('should return 500 Internal Server Error if a database query fails', async () => {
      // Force an error
      const spy = vi.spyOn(WordProgress, 'find').mockImplementationOnce(() => {
        throw new Error('Database Error');
      });

      const payload = {
        clientDate: '2026-03-24',
        reviews: [],
      };

      const response = await request(app).post('/session/finish').send(payload);
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error');

      spy.mockRestore();
    });
  });
});
