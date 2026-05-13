import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import userDataRouter from '../../routes/userData.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../utils/dbSetup.js';
import { WordProgress, Stats, StudyLog, LessonProgress, SessionProgress } from '../../models/UserModels.js';

const app = express();
app.use(express.json());
app.use('/', userDataRouter);

describe('Vocab Session Backend API Integration (Lessons)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearTestDB();

    // Setup a clean DB snapshot before each test
    await Stats.create({
      id: 1,
      totalWordsLearned: 10,
      currentStreak: 2,
      lastStudyDate: '2026-03-23',
      totalStudyDays: 2,
    });

    await LessonProgress.create({
      id: 'old-lesson-1',
      type: 'vocabulary',
      completedAt: '2026-03-01T00:00:00.000Z'
    });

    await SessionProgress.create({
      id: 'lesson-1',
      currentIndex: 8,
      lastUpdated: '2026-03-24T10:00:00.000Z'
    });
  });

  describe('Completing a Vocab Session', () => {
    it('should correctly process new words, update LessonProgress, and delete Session checkpoint in bulk', async () => {
      // 1. Frontend sends bulk reviews via POST /session/finish
      const finishPayload = {
        clientDate: '2026-03-24',
        reviews: [
          { term: 'hello', lessonId: 'lesson-1', isCorrect: true, isGeneralReview: false }, // Known right away
          { term: 'world', lessonId: 'lesson-1', isCorrect: false, isGeneralReview: false }, // Struggled initially
        ],
      };

      const finishResponse = await request(app).post('/session/finish').send(finishPayload);

      expect(finishResponse.status).toBe(200);
      expect(finishResponse.body.success).toBe(true);
      expect(finishResponse.body.wordsLearned).toBe(2); // Both are new to the DB

      const words = await WordProgress.find({}).lean();

      // Word checks: Both should be Level 1
      expect(words).toHaveLength(2);

      const helloWord = words.find((w) => w.id === 'hello');
      const worldWord = words.find((w) => w.id === 'world');

      expect(helloWord.level).toBe(1);
      expect(helloWord.correctCount).toBe(1);
      expect(helloWord.incorrectCount).toBe(0);

      expect(worldWord.level).toBe(1);
      expect(worldWord.correctCount).toBe(0);
      expect(worldWord.incorrectCount).toBe(1);

      // Streak & Stats checks
      const stats = await Stats.findOne({ id: 1 }).lean();
      expect(stats.currentStreak).toBe(3);
      expect(stats.totalStudyDays).toBe(3);
      expect(stats.totalWordsLearned).toBe(12);

      // 2. Frontend Upserts Lesson Progress via POST /lessonProgress
      const lessonPayload = {
        id: 'lesson-1',
        type: 'vocabulary',
        completedAt: '2026-03-24T10:30:00.000Z',
      };
      const lessonResponse = await request(app).post('/lessonProgress').send(lessonPayload);

      expect(lessonResponse.status).toBe(200); 
      
      const lessonProgress = await LessonProgress.find({}).lean();
      expect(lessonProgress).toHaveLength(2);
      expect(lessonProgress.find((l) => l.id === 'lesson-1')).toBeDefined();

      // 3. Frontend Deletes Session Progress Checkpoint via DELETE /sessionProgress/:id
      const deleteResponse = await request(app).delete('/sessionProgress/lesson-1');
      expect(deleteResponse.status).toBe(200);

      const sessionProgress = await SessionProgress.find({}).lean();
      expect(sessionProgress).toHaveLength(0);
    });

    it('should correctly process a REPLAYED lesson as wordsReviewed without duplicating learned count', async () => {
      // Mock that 'hello' already exists from a previous study
      await WordProgress.create({
        id: 'hello',
        term: 'hello',
        lessonId: 'lesson-1',
        level: 1,
        lastStudied: '2026-03-20',
        nextReview: '2026-03-21',
        correctCount: 1,
        incorrectCount: 0,
      });

      const finishPayload = {
        clientDate: '2026-03-24',
        reviews: [
          { term: 'hello', lessonId: 'lesson-1', isCorrect: true, isGeneralReview: false }, // Already known, re-learning
          { term: 'new-word', lessonId: 'lesson-1', isCorrect: true, isGeneralReview: false }, // Actually new
        ],
      };

      const finishResponse = await request(app).post('/session/finish').send(finishPayload);

      expect(finishResponse.status).toBe(200);
      expect(finishResponse.body.wordsLearned).toBe(1); // Only 'new-word' is learned
      expect(finishResponse.body.wordsReviewed).toBe(1); // 'hello' is reviewed

      const words = await WordProgress.find({}).lean();

      const helloWord = words.find((w) => w.id === 'hello');
      const newWord = words.find((w) => w.id === 'new-word');

      // 'hello' upgrades from level 1 -> 2
      expect(helloWord.level).toBe(2);
      expect(helloWord.correctCount).toBe(2);

      // 'new-word' correctly starts at 1
      expect(newWord.level).toBe(1);
    });

    it('should return 404 safely when attempting to delete a non-existent sessionProgress', async () => {
      // Attempt to delete a checkpoint for a lesson that has no checkpoint saved
      const deleteResponse = await request(app).delete('/sessionProgress/non-existent-lesson');
      expect(deleteResponse.status).toBe(404);
      expect(deleteResponse.body.error).toBe('Not found');
    });
  });
});
