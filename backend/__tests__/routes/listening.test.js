import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import listeningRouter from '../../routes/listening.js';
import { Lesson } from '../../models/ContentModels.js';

// Mock the ContentModels module
vi.mock('../../models/ContentModels.js', () => ({
  Lesson: {
    find: vi.fn(),
    findOne: vi.fn(),
    aggregate: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/listening', listeningRouter);

describe('Listening Router', () => {
  const mockListeningData = [
    {
      id: "1",
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
      id: "2",
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
      id: "3",
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
      id: "4",
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
  });

  describe('GET /listening', () => {
    it('should return all listening lessons when no level filter is provided', async () => {
      Lesson.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockListeningData)
      });

      const response = await request(app).get('/listening');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(4);
      expect(response.headers['x-total-count']).toBe('4');
    });

    it('should filter listening lessons by level when level query param is provided', async () => {
      const a1Data = mockListeningData.filter(d => d.level === 'a1');
      Lesson.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue(a1Data)
      });

      const response = await request(app).get('/listening?level=a1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(Lesson.find).toHaveBeenCalledWith(expect.objectContaining({ level: 'a1', type: 'listening' }));
    });
  });

  describe('GET /listening/:id', () => {
    it('should return a listening lesson by id or slug', async () => {
      Lesson.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockListeningData[0])
      });

      const response = await request(app).get('/listening/1');

      expect(response.status).toBe(200);
      expect(response.body.slug).toBe('a1-listening-1');
      expect(Lesson.findOne).toHaveBeenCalledWith(expect.objectContaining({
        $or: [
          { id: '1' },
          { slug: '1' }
        ]
      }));
    });

    it('should return 404 when lesson is not found', async () => {
      Lesson.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      });

      const response = await request(app).get('/listening/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });
  });
});
