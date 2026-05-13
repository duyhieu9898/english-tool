import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateNextReview, createInitialWordProgress } from '../../services/spacedRepetition.js';

describe('Spaced Repetition Service Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Setting fixed date: 2026-03-24 (Tuesday)
    vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateNextReview logic', () => {
    it('should promote Level 1 to Level 2 and set review to tomorrow (+1 day)', () => {
      const result = calculateNextReview(1, true);
      expect(result.newLevel).toBe(2);
      expect(result.nextReviewDate).toBe('2026-03-25');
    });

    it('should promote Level 2 to Level 3 and set review to +3 days', () => {
      const result = calculateNextReview(2, true);
      expect(result.newLevel).toBe(3);
      expect(result.nextReviewDate).toBe('2026-03-27');
    });

    it('should promote Level 3 to Level 4 and set review to +7 days', () => {
      const result = calculateNextReview(3, true);
      expect(result.newLevel).toBe(4);
      expect(result.nextReviewDate).toBe('2026-03-31');
    });

    it('should promote Level 4 to Level 5 and set review to +14 days', () => {
      const result = calculateNextReview(4, true);
      expect(result.newLevel).toBe(5);
      expect(result.nextReviewDate).toBe('2026-04-07');
    });

    it('should cap at Level 5 and set review to +30 days', () => {
      const result = calculateNextReview(5, true);
      expect(result.newLevel).toBe(5);
      expect(result.nextReviewDate).toBe('2026-04-23');
    });

    it('should reset any Level to 1 and set review to TODAY if answer is incorrect', () => {
      [1, 2, 3, 4, 5].forEach(level => {
        const result = calculateNextReview(level, false);
        expect(result.newLevel).toBe(1);
        expect(result.nextReviewDate).toBe('2026-03-24'); // Review ASAP
      });
    });
  });

  describe('createInitialWordProgress initialization', () => {
    it('should initialize a new word at Level 1 with review scheduled for tomorrow', () => {
      const word = createInitialWordProgress('apple', 'lesson-1');
      
      expect(word.id).toBe('apple');
      expect(word.term).toBe('apple');
      expect(word.level).toBe(1);
      expect(word.correctCount).toBe(1);
      expect(word.incorrectCount).toBe(0);
      expect(word.lastStudied).toBe('2026-03-24');
      expect(word.nextReview).toBe('2026-03-25');
    });

    it('should initialize at Level 2 if specified (correct in general review)', () => {
      const word = createInitialWordProgress('banana', 'lesson-2', 2);
      
      expect(word.level).toBe(2);
      expect(word.nextReview).toBe('2026-03-25'); // calculateNextReview(1, true) -> +1 day
    });
  });
});
