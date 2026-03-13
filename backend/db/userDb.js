/**
 * db/userDb.js — load / save user_db.json
 *
 * Improvements over naive read/write:
 *  1. Atomic write  — write to temp file then rename (prevents data corruption on crash)
 *  2. Schema migration — merges DEFAULT_DB with stored data so new fields are
 *     always present even for users who have an older user_db.json
 */
import fs from 'fs';
import path from 'path';
import { USER_DB_PATH } from './paths.js';

const DEFAULT_DB = {
  wordProgress:    [],
  lessonProgress:  [],
  sessionProgress: [],
  studyLog:        [],
  stats: {
    id:                1,
    totalWordsLearned: 0,
    currentStreak:     0,
    lastStudyDate:     '',
    totalStudyDays:    0,
  },
  settings: {
    id:           1,
    dailyGoal:    20,
    theme:        'dark',
    soundEnabled: true,
  },
};

/**
 * Deep-merge NEW fields from `defaults` into `stored`.
 * - Arrays are kept as-is from stored (user data wins).
 * - Plain objects are merged key-by-key (missing keys added from defaults).
 * - Primitives in stored always win over defaults.
 */
function mergeDefaults(stored, defaults) {
  if (Array.isArray(defaults)) return Array.isArray(stored) ? stored : defaults;
  if (typeof defaults !== 'object' || defaults === null) return stored ?? defaults;

  const result = { ...stored };
  for (const key of Object.keys(defaults)) {
    if (!(key in result)) {
      // New field not in stored db — add default value
      result[key] = structuredClone(defaults[key]);
    } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      // Recurse into nested objects (e.g. stats, settings)
      result[key] = mergeDefaults(result[key], defaults[key]);
    }
    // Primitives and arrays: stored value wins — no change
  }
  return result;
}

function load() {
  if (!fs.existsSync(USER_DB_PATH)) return structuredClone(DEFAULT_DB);
  try {
    const stored = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf-8'));
    // Apply schema migration: add any missing fields introduced in DEFAULT_DB
    return mergeDefaults(stored, DEFAULT_DB);
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}

function save(data) {
  // Atomic write: write to a temp file first, then rename.
  // rename() is atomic on most OSes — a crash mid-write won't corrupt the DB.
  const tmpPath = `${USER_DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, USER_DB_PATH);
}

export default { load, save };
