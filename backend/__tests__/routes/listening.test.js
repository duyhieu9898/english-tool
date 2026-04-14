import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import listeningRouter from '../../routes/listening.js';

// Mock the contentDb module
vi.mock('../../db/contentDb.js', () => ({
  loadListening: vi.fn(),
}));

import { loadListening } from '../../db/contentDb.js';

const app = express();
app.use(express.json());
app.use('/listening', listeningRouter);

describe('Listening Router', () => {
  const mockListeningData = [
    {
      id: 1,
      slug: 'a1-listening-1',
      level: 'a1',
      title: 'A Day in the Life of a Student',
      topic: 'Daily Routine',
      questions: [
        { id: '1', sentence: 'My name is John.' },
        { id: '2', sentence: 'I am a student.' },
      ],
    },
    {
      id: 2,
      slug: 'a1-listening-2',
      level: 'a1',
      title: 'At the Supermarket',
      topic: 'Shopping',
      questions: [
        { id: '1', sentence: 'I need to buy some milk.' },
        { id: '2', sentence: 'Where is the bread?' },
      ],
    },
    {
      id: 3,
      slug: 'a2-listening-1',
      level: 'a2',
      title: 'Planning a Vacation',
      topic: 'Travel',
      questions: [
        { id: '1', sentence: 'My family wants to go on a vacation.' },
        { id: '2', sentence: 'We need to choose a place.' },
      ],
    },
    {
      id: 4,
      slug: 'b1-listening-1',
      level: 'b1',
      title: 'The Power of Good Sleep',
      topic: 'Health',
      questions: [
        { id: '1', sentence: 'We all know sleep is important.' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    loadListening.mockReturnValue(mockListeningData);
  });

  describe('GET /listening', () => {
    it('should return all listening lessons when no level filter is provided', async () => {
      const response = await request(app).get('/listening');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(4);
      expect(response.body).toEqual(mockListeningData);
      expect(response.headers['x-total-count']).toBe('4');
    });

    it('should filter listening lessons by level when level query param is provided', async () => {
      const response = await request(app).get('/listening?level=a1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].level).toBe('a1');
      expect(response.body[1].level).toBe('a1');
      expect(response.headers['x-total-count']).toBe('2');
    });

    it('should return empty array when filtering by non-existent level', async () => {
      const response = await request(app).get('/listening?level=c2');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
      expect(response.headers['x-total-count']).toBe('0');
    });

    it('should filter correctly for level a2', async () => {
      const response = await request(app).get('/listening?level=a2');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].slug).toBe('a2-listening-1');
      expect(response.body[0].title).toBe('Planning a Vacation');
    });

    it('should filter correctly for level b1', async () => {
      const response = await request(app).get('/listening?level=b1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].slug).toBe('b1-listening-1');
    });

    it('should call loadListening once per request', async () => {
      await request(app).get('/listening');

      expect(loadListening).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /listening/:id', () => {
    it('should return a listening lesson by numeric id', async () => {
      const response = await request(app).get('/listening/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.slug).toBe('a1-listening-1');
      expect(response.body.title).toBe('A Day in the Life of a Student');
    });

    it('should return a listening lesson by slug', async () => {
      const response = await request(app).get('/listening/a2-listening-1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(3);
      expect(response.body.slug).toBe('a2-listening-1');
      expect(response.body.title).toBe('Planning a Vacation');
    });

    it('should return 404 when lesson is not found by id', async () => {
      const response = await request(app).get('/listening/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });

    it('should return 404 when lesson is not found by slug', async () => {
      const response = await request(app).get('/listening/non-existent-slug');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });

    it('should return lesson with all questions', async () => {
      const response = await request(app).get('/listening/1');

      expect(response.status).toBe(200);
      expect(response.body.questions).toHaveLength(2);
      expect(response.body.questions[0].sentence).toBe('My name is John.');
      expect(response.body.questions[1].sentence).toBe('I am a student.');
    });

    it('should return lesson with correct topic', async () => {
      const response = await request(app).get('/listening/a1-listening-2');

      expect(response.status).toBe(200);
      expect(response.body.topic).toBe('Shopping');
    });

    it('should handle string id that matches numeric id', async () => {
      const response = await request(app).get('/listening/2');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(2);
      expect(response.body.slug).toBe('a1-listening-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty listening data', async () => {
      loadListening.mockReturnValue([]);

      const response = await request(app).get('/listening');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
      expect(response.headers['x-total-count']).toBe('0');
    });

    it('should handle malformed level query param', async () => {
      const response = await request(app).get('/listening?level=');

      expect(response.status).toBe(200);
      // Empty level param is treated as no filter, returns all lessons
      expect(response.body).toHaveLength(4);
    });

    it('should handle case-sensitive level filtering', async () => {
      const response = await request(app).get('/listening?level=A1');

      expect(response.status).toBe(200);
      // Should return empty array since levels are lowercase
      expect(response.body).toHaveLength(0);
    });

    it('should handle special characters in slug', async () => {
      const specialLesson = {
        id: 99,
        slug: 'test-lesson-with-special-chars',
        level: 'a1',
        title: 'Test',
        topic: 'Test',
        questions: [],
      };
      loadListening.mockReturnValue([...mockListeningData, specialLesson]);

      const response = await request(app).get('/listening/test-lesson-with-special-chars');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(99);
    });
  });

  describe('Data Integrity', () => {
    it('should return lessons with all required fields', async () => {
      const response = await request(app).get('/listening/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('topic');
      expect(response.body).toHaveProperty('questions');
    });

    it('should return questions with required fields', async () => {
      const response = await request(app).get('/listening/1');

      expect(response.status).toBe(200);
      const question = response.body.questions[0];
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('sentence');
    });

    it('should not modify the original data', async () => {
      const originalData = [...mockListeningData];
      
      await request(app).get('/listening?level=a1');
      
      expect(loadListening()).toEqual(originalData);
    });
  });

  describe('Performance', () => {
    it('should handle large dataset efficiently', async () => {
      const largeDataset = Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        slug: `a1-listening-${i + 1}`,
        level: 'a1',
        title: `Lesson ${i + 1}`,
        topic: 'Test',
        questions: [{ id: '1', sentence: 'Test sentence.' }],
      }));
      loadListening.mockReturnValue(largeDataset);

      const response = await request(app).get('/listening?level=a1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(200);
      expect(response.headers['x-total-count']).toBe('200');
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/listening?level=a1')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
      });
    });
  });

  describe('HTTP Headers', () => {
    it('should set X-Total-Count header correctly', async () => {
      const response = await request(app).get('/listening');

      expect(response.headers['x-total-count']).toBe('4');
    });

    it('should set X-Total-Count header for filtered results', async () => {
      const response = await request(app).get('/listening?level=a1');

      expect(response.headers['x-total-count']).toBe('2');
    });

    it('should set X-Total-Count to 0 for empty results', async () => {
      const response = await request(app).get('/listening?level=c2');

      expect(response.headers['x-total-count']).toBe('0');
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/listening');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
