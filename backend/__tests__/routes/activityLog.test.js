import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import activityLogRouter from '../../routes/activityLog.js';
import { ACTIVITY_LOG_DIR } from '../../db/paths.js';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      renameSync: vi.fn(),
      readdirSync: vi.fn(),
    },
  };
});

const app = express();
app.use(express.json());
app.use('/activityLog', activityLogRouter);

describe('activityLog Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const todayStr = '2026-03-24';
  const mockFilePath = path.join(ACTIVITY_LOG_DIR, `${todayStr}.json`);

  it('GET /activityLog - should return empty array if no file exists', async () => {
    fs.existsSync.mockReturnValue(false); // No file exists

    const response = await request(app).get('/activityLog');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('GET /activityLog - should return parsed entries reversed', async () => {
    fs.existsSync.mockImplementation((targetPath) => targetPath === mockFilePath);
    const mockData = [{ id: 1 }, { id: 2 }];
    fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

    const response = await request(app).get('/activityLog');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 2 }, { id: 1 }]); // Reversed
    expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf-8');
  });

  it('GET /activityLog/files - should list available log files sorted newest first', async () => {
    fs.existsSync.mockImplementation((targetPath) => targetPath === ACTIVITY_LOG_DIR);
    fs.readdirSync.mockReturnValue([
      '2026-03-20.json',
      '2026-03-24.json',
      '2026-03-22.json',
      'other.txt',
    ]);

    const response = await request(app).get('/activityLog/files');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(['2026-03-24', '2026-03-22', '2026-03-20']); // Sorted reverse alphabetical, txt filtered out
  });

  it('GET /activityLog/:date - should return 404 if log not found', async () => {
    fs.existsSync.mockReturnValue(false);

    const response = await request(app).get('/activityLog/2026-01-01');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Log not found' });
  });

  it('POST /activityLog - should write new entry and return it', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('[]'); // Empty initially

    const payload = { action: 'test_action' };
    const response = await request(app).post('/activityLog').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.action).toBe('test_action');
    expect(response.body.ts).toBe('2026-03-24T12:00:00.000Z');

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.renameSync).toHaveBeenCalledWith(`${mockFilePath}.tmp`, mockFilePath);

    const writeArg = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(writeArg).toHaveLength(1);
    expect(writeArg[0].action).toBe('test_action');
  });

  it('DELETE /activityLog - should clear today log contents', async () => {
    const response = await request(app).delete('/activityLog');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ cleared: true });

    // Check that it wrote an empty array
    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeArg = fs.writeFileSync.mock.calls[0][1];
    expect(writeArg).toBe('[]'); // Beautified empty array
  });
});
