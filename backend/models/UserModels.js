import mongoose from 'mongoose';

// --- Word Progress ---
const WordProgressSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  term: { type: String, required: true },
  lessonId: { type: String, required: true },
  level: Number,
  lastStudied: String,
  nextReview: String,
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { collection: 'wordProgress', strict: false }); // strict: false allows flexibility

// --- Lesson Progress ---
const LessonProgressSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: String,
  isCompleted: Boolean,
  lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { collection: 'lessonProgress', strict: false });

// --- Session Progress ---
const SessionProgressSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  currentIndex: Number,
  lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { collection: 'sessionProgress', strict: false });

// --- Study Log ---
const StudyLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: String,
  wordsLearned: Number,
  wordsReviewed: Number,
  graduatedItems: Number,
  minutesStudied: Number,
  lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { collection: 'studyLog', strict: false });

// --- Stats ---
const StatsSchema = new mongoose.Schema({
  id: { type: Number, default: 1, unique: true },
  totalWordsLearned: Number,
  currentStreak: Number,
  lastStudyDate: String,
  totalStudyDays: Number
}, { collection: 'stats', strict: false });

// --- Settings ---
const SettingsSchema = new mongoose.Schema({
  id: { type: Number, default: 1, unique: true },
  dailyGoal: Number,
  theme: String,
  soundEnabled: Boolean
}, { collection: 'settings', strict: false });

export const WordProgress = mongoose.model('WordProgress', WordProgressSchema);
export const LessonProgress = mongoose.model('LessonProgress', LessonProgressSchema);
export const SessionProgress = mongoose.model('SessionProgress', SessionProgressSchema);
export const StudyLog = mongoose.model('StudyLog', StudyLogSchema);
export const Stats = mongoose.model('Stats', StatsSchema);
export const Settings = mongoose.model('Settings', SettingsSchema);
