import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');

// Mock fs to avoid writing real files during unit tests
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      appendFileSync: vi.fn(),
    }
  };
});

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console to keep test output clean and verify console behavior
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the logs directory if it does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    logger.ensureLogDir();
    expect(fs.mkdirSync).toHaveBeenCalledWith(LOGS_DIR, { recursive: true });
  });

  it('should not create the logs directory if it already exists', () => {
    fs.existsSync.mockReturnValue(true);
    logger.ensureLogDir();
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('should generate the correct daily log path', () => {
    // Mock Date to ensure deterministic output
    const mockDate = new Date('2026-03-24T12:00:00Z');
    vi.setSystemTime(mockDate);
    
    const expectedPath = path.join(LOGS_DIR, '2026-03-24.log');
    expect(logger.getTodayLogPath()).toBe(expectedPath);
    
    vi.useRealTimers();
  });

  it('should write an INFO message correctly', () => {
    fs.existsSync.mockReturnValue(true);
    
    logger.info('Test info message', { userId: 123 });
    
    expect(fs.appendFileSync).toHaveBeenCalledTimes(1);
    const [filePath, content] = fs.appendFileSync.mock.calls[0];
    
    expect(filePath).toContain('.log');
    expect(content).toContain('[INFO]');
    expect(content).toContain('Test info message');
    expect(content).toContain('{"userId":123}');
    expect(console.log).toHaveBeenCalled();
  });

  it('should write an ERROR message correctly and extract error stack', () => {
    fs.existsSync.mockReturnValue(true);
    
    const testError = new Error('Something went wrong');
    testError.stack = 'MockStack';
    
    logger.error('Test error message', testError);
    
    expect(fs.appendFileSync).toHaveBeenCalledTimes(1);
    const [, content] = fs.appendFileSync.mock.calls[0];
    
    expect(content).toContain('[ERROR]');
    expect(content).toContain('Test error message');
    expect(content).toContain('MockStack');
    expect(console.error).toHaveBeenCalled();
  });
});
