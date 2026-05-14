import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import activityLogRouter from '../../routes/activityLog.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../utils/dbSetup.js';
import { ActivityLog } from '../../models/UserModels.js';

const app = express();
app.use(express.json());
app.use('/activityLog', activityLogRouter);

describe('activityLog Router Integration (MongoDB)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearTestDB();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('GET /activityLog - should return empty array if no logs for today', async () => {
    const response = await request(app).get('/activityLog');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('GET /activityLog - should return today logs newest first', async () => {
    await ActivityLog.create([
      { action: 'first', ts: '2026-03-24T10:00:00Z', date: '2026-03-24' },
      { action: 'second', ts: '2026-03-24T11:00:00Z', date: '2026-03-24' },
      { action: 'other-day', ts: '2026-03-23T12:00:00Z', date: '2026-03-23' },
    ]);

    const response = await request(app).get('/activityLog');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].action).toBe('second');
    expect(response.body[1].action).toBe('first');
  });

  it('GET /activityLog/files - should list unique log dates sorted newest first', async () => {
    await ActivityLog.create([
      { action: 'a', date: '2026-03-20' },
      { action: 'b', date: '2026-03-24' },
      { action: 'c', date: '2026-03-22' },
    ]);

    const response = await request(app).get('/activityLog/files');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(['2026-03-24', '2026-03-22', '2026-03-20']);
  });

  it('GET /activityLog/:date - should return 404 if date has no logs', async () => {
    const response = await request(app).get('/activityLog/2026-01-01');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Log not found');
  });

  it('POST /activityLog - should create new log entry', async () => {
    const payload = { action: 'test_action' };
    const response = await request(app).post('/activityLog').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.action).toBe('test_action');
    expect(response.body.date).toBe('2026-03-24');
    expect(response.body.ts).toBe('2026-03-24T12:00:00.000Z');

    const inDb = await ActivityLog.findOne({ action: 'test_action' });
    expect(inDb).toBeDefined();
  });

  it('DELETE /activityLog - should clear today log', async () => {
    await ActivityLog.create({ action: 'clear-me', date: '2026-03-24' });
    await ActivityLog.create({ action: 'keep-me', date: '2026-03-23' });

    const response = await request(app).delete('/activityLog');
    expect(response.status).toBe(200);
    expect(response.body.cleared).toBe(true);

    const countToday = await ActivityLog.countDocuments({ date: '2026-03-24' });
    const countYesterday = await ActivityLog.countDocuments({ date: '2026-03-23' });
    expect(countToday).toBe(0);
    expect(countYesterday).toBe(1);
  });
});
