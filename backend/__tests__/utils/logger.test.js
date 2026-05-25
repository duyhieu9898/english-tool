import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger.js';
import { SystemLog } from '../../models/SystemLog.js';

// Mock SystemLog model to avoid real DB connections in unit tests
vi.mock('../../models/SystemLog.js', () => {
  return {
    SystemLog: {
      create: vi.fn().mockResolvedValue({}),
    }
  };
});

describe('Logger Utility (MongoDB & Console)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Spy on console methods to verify their calls and keep clean output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    
    // Mock mongoose.connection state
    if (!mongoose.connection) {
      mongoose.connection = {};
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should write an INFO message to console.log', async () => {
    // Force readyState to 0 (disconnected) so it doesn't write to DB in this test
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    await logger.info('Test info message', { userId: 123 });
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Test info message {"userId":123}')
    );
  });

  it('should write an ERROR message to console.error and format error details', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const testError = new Error('Something went wrong');
    testError.stack = 'MockStack';
    
    await logger.error('Test error message', testError);
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] Test error message MockStack')
    );
  });

  it('should not save to MongoDB if mongoose is not connected', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);
    
    await logger.info('Test log without DB', { test: true });
    
    expect(SystemLog.create).not.toHaveBeenCalled();
  });

  it('should save to MongoDB if mongoose is connected', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
    
    await logger.info('Test log with DB', { test: true });
    
    expect(SystemLog.create).toHaveBeenCalledWith({
      level: 'INFO',
      message: 'Test log with DB',
      meta: { test: true }
    });
  });
});
