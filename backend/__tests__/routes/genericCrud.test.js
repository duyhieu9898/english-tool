import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import userDataRouter from '../../routes/userData.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../utils/dbSetup.js';
import { WordProgress, Settings } from '../../models/UserModels.js';

const app = express();
app.use(express.json());
app.use('/', userDataRouter);

describe('Generic CRUD & Filtering Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Seed data for filtering tests
    await WordProgress.insertMany([
      { id: 'apple', term: 'apple', level: 1, lessonId: 'L1' },
      { id: 'banana', term: 'banana', level: 3, lessonId: 'L1' },
      { id: 'cherry', term: 'cherry', level: 5, lessonId: 'L2' },
      { id: 'date', term: 'date', level: 4, lessonId: 'L2' },
    ]);

    await Settings.create({
      id: 1,
      theme: 'dark',
      notifications: true
    });
  });

  describe('Filtering Logic (_lte, _gte, _ne, _like)', () => {
    it('should filter by level_lte (less than or equal)', async () => {
      const response = await request(app).get('/wordProgress?level_lte=3');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2); // apple (1), banana (3)
      const terms = response.body.map(i => i.term);
      expect(terms).toContain('apple');
      expect(terms).toContain('banana');
    });

    it('should filter by level_gte (greater than or equal)', async () => {
      const response = await request(app).get('/wordProgress?level_gte=4');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2); // cherry (5), date (4)
    });

    it('should filter by _ne (not equal)', async () => {
      const response = await request(app).get('/wordProgress?id_ne=apple');
      expect(response.status).toBe(200);
      const terms = response.body.map(i => i.term);
      expect(terms).not.toContain('apple');
      expect(terms).toHaveLength(3);
    });

    it('should filter by _like (regex search)', async () => {
      const response = await request(app).get('/wordProgress?term_like=an');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1); // banana
      expect(response.body[0].term).toBe('banana');
    });

    it('should combine multiple filters', async () => {
      const response = await request(app).get('/wordProgress?level_gte=3&lessonId=L1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1); // Only banana (level 3, L1)
      expect(response.body[0].term).toBe('banana');
    });
  });

  describe('Standard CRUD for Settings', () => {
    it('should GET settings by id', async () => {
      const response = await request(app).get('/settings/1');
      expect(response.status).toBe(200);
      expect(response.body.theme).toBe('dark');
    });

    it('should UPDATE settings using PUT', async () => {
      const payload = { theme: 'light', notifications: false };
      const response = await request(app).put('/settings/1').send(payload);
      
      expect(response.status).toBe(200);
      expect(response.body.theme).toBe('light');

      const updated = await Settings.findOne({ id: 1 });
      expect(updated.theme).toBe('light');
    });

    it('should DELETE settings entry', async () => {
      const response = await request(app).delete('/settings/1');
      expect(response.status).toBe(200);

      const count = await Settings.countDocuments();
      expect(count).toBe(0);
    });
  });

  describe('Pagination Headers', () => {
    it('should return X-Total-Count header', async () => {
      const response = await request(app).get('/wordProgress');
      expect(response.headers['x-total-count']).toBe('4');
    });
  });
});
