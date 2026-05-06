import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  WordProgress, LessonProgress, SessionProgress, 
  StudyLog, Stats, Settings 
} from '../models/UserModels.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DB_PATH = path.join(__dirname, '../data/user_db.json');
const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  if (!fs.existsSync(USER_DB_PATH)) {
    console.error('❌ user_db.json not found');
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected.');

    const data = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf-8'));

    // --- Migrate Word Progress ---
    if (data.wordProgress?.length > 0) {
      console.log(`📦 Migrating ${data.wordProgress.length} wordProgress items...`);
      await WordProgress.deleteMany({}); // Clear existing
      await WordProgress.insertMany(data.wordProgress.map(w => ({
        ...w,
        id: w.id || w.term // Ensure id exists
      })));
    }

    // --- Migrate Lesson Progress ---
    if (data.lessonProgress?.length > 0) {
      console.log(`📦 Migrating ${data.lessonProgress.length} lessonProgress items...`);
      await LessonProgress.deleteMany({});
      await LessonProgress.insertMany(data.lessonProgress);
    }

    // --- Migrate Session Progress ---
    if (data.sessionProgress?.length > 0) {
      console.log(`📦 Migrating ${data.sessionProgress.length} sessionProgress items...`);
      await SessionProgress.deleteMany({});
      await SessionProgress.insertMany(data.sessionProgress);
    }

    // --- Migrate Study Log ---
    if (data.studyLog?.length > 0) {
      console.log(`📦 Migrating ${data.studyLog.length} studyLog items...`);
      await StudyLog.deleteMany({});
      await StudyLog.insertMany(data.studyLog);
    }

    // --- Migrate Stats ---
    if (data.stats) {
      console.log('📦 Migrating stats...');
      await Stats.findOneAndUpdate({ id: 1 }, data.stats, { upsert: true });
    }

    // --- Migrate Settings ---
    if (data.settings) {
      console.log('📦 Migrating settings...');
      await Settings.findOneAndUpdate({ id: 1 }, data.settings, { upsert: true });
    }

    console.log('🚀 Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
