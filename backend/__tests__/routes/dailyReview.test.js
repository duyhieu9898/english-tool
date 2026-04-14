import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import userDataRouter from '../../routes/userData.js';
import db from '../../db/userDb.js';

// Mock the database read/write mechanism
vi.mock('../../db/userDb.js', () => ({
  default: {
    load: vi.fn(),
    save: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/', userDataRouter);

describe('Daily Review Backend API Integration (userData Router)', () => {
  let mockDbSnapshot;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup a clean DB snapshot before each test
    mockDbSnapshot = {
      wordProgress: [
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
      ],
      stats: {
        id: 1,
        totalWordsLearned: 2, // Matches the 2 words in wordProgress above
        currentStreak: 5,
        lastStudyDate: '2026-03-23',
        totalStudyDays: 5,
      },
      studyLog: [],
    };

    // Mock db.load to return our controlled snapshot
    db.load.mockReturnValue(mockDbSnapshot);
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

      expect(db.save).toHaveBeenCalledTimes(1);
      const savedSnapshot = db.save.mock.calls[0][0];

      // Word checks
      expect(savedSnapshot.wordProgress).toHaveLength(3); // apple, banana, orange
      const savedApple = savedSnapshot.wordProgress.find((w) => w.id === 'apple');
      const savedOrange = savedSnapshot.wordProgress.find((w) => w.id === 'orange');
      expect(savedApple.level).toBe(2);
      expect(savedOrange.level).toBe(2);

      // Streak & Stats checks
      expect(savedSnapshot.stats.currentStreak).toBe(6);
      expect(savedSnapshot.stats.totalStudyDays).toBe(6);
      expect(savedSnapshot.stats.totalWordsLearned).toBe(3); // 2 + 1 new word
      expect(savedSnapshot.stats.lastStudyDate).toBe('2026-03-24');

      // Study Log checks
      expect(savedSnapshot.studyLog).toHaveLength(1);
      expect(savedSnapshot.studyLog[0].wordsLearned).toBe(1);
      expect(savedSnapshot.studyLog[0].wordsReviewed).toBe(1);
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

      const savedSnapshot = db.save.mock.calls[0][0];

      expect(savedSnapshot.wordProgress).toHaveLength(1); // Only apple remains
      const savedApple = savedSnapshot.wordProgress.find((w) => w.id === 'apple');
      expect(savedApple.level).toBe(1);
      expect(savedApple.incorrectCount).toBe(1);

      // Streak should be reset to 1 because of the gap day
      expect(savedSnapshot.stats.currentStreak).toBe(1);
      expect(savedSnapshot.stats.totalStudyDays).toBe(6);
    });

    it('should MAINTAIN streak and LOG properly when studying multiple times the same day', async () => {
      const payload = {
        clientDate: '2026-03-23', // Same day as mock lastStudyDate
        reviews: [{ term: 'apple', lessonId: '1', isCorrect: true, isGeneralReview: false }],
      };

      const response = await request(app).post('/session/finish').send(payload);

      expect(response.status).toBe(200);

      const savedSnapshot = db.save.mock.calls[0][0];

      // Streak should remain 5
      expect(savedSnapshot.stats.currentStreak).toBe(5);
      expect(savedSnapshot.stats.totalStudyDays).toBe(5);
    });
  });
});
