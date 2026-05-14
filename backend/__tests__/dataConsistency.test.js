import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { Lesson } from '../models/ContentModels.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables for the test
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

describe('Data Consistency Tests', () => {
  beforeAll(async () => {
    // Connect to the actual database or test database
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/english_tool_test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should ensure all vocabulary lessons have unique word terms', async () => {
    const vocabLessons = await Lesson.find({ type: 'vocabulary' }).lean();

    expect(vocabLessons.length).toBeGreaterThan(0);

    for (const lesson of vocabLessons) {
      if (!lesson.words) continue;

      const terms = lesson.words.map(w => w.term);
      const uniqueTerms = new Set(terms);

      // Compare the length of the original array with the Set
      // If they don't match, there are duplicate terms in the database!
      expect(
        terms.length,
        `Lesson "${lesson.name}" (${lesson.id}) has duplicate terms! Expected ${uniqueTerms.size} unique words but got ${terms.length}.`
      ).toBe(uniqueTerms.size);
    }
  });
});
