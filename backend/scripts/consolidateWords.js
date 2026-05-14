import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lesson } from '../models/ContentModels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const consolidateLessonWords = (words) => {
  const consolidatedWords = [];
  words.forEach((current) => {
    const existing = consolidatedWords.find(
      (w) => w.term.toLowerCase() === current.term.toLowerCase(),
    );
    if (existing) {
      if (!existing.modifiers.toLowerCase().includes(current.modifiers.toLowerCase())) {
        existing.modifiers += `, ${current.modifiers}`;
      }
      if (!existing.meaning.includes(current.meaning)) {
        existing.meaning += `; ${current.meaning}`;
      }
      if (!existing.full_sentence.includes(current.full_sentence)) {
        if (!existing.full_sentence.startsWith('•')) {
          existing.full_sentence = `• ${existing.full_sentence}\n• ${current.full_sentence}`;
        } else {
          existing.full_sentence += `\n• ${current.full_sentence}`;
        }
      }
    } else {
      consolidatedWords.push({ ...current });
    }
  });
  return consolidatedWords;
};

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const lessons = await Lesson.find({ type: 'vocabulary' });
    let totalUpdated = 0;

    for (const lesson of lessons) {
      if (!lesson.words || lesson.words.length === 0) continue;

      const originalLength = lesson.words.length;
      const consolidatedWords = consolidateLessonWords(lesson.words);

      if (consolidatedWords.length !== originalLength) {
        await Lesson.updateOne(
          { _id: lesson._id },
          { $set: { words: consolidatedWords } }
        );
        console.log(`Updated ${lesson.name}: ${originalLength} -> ${consolidatedWords.length}`);
        totalUpdated++;
      }
    }

    console.log(`Successfully updated ${totalUpdated} lessons.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
