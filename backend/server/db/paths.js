/**
 * db/paths.js — single source of truth for all file paths
 */
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

module.exports = {
  CLASSIFIED_PATH : path.join(ROOT, 'oxford_classified.json'),
  GRAMMAR_DIR     : path.join(ROOT, 'data', 'grammar'),
  READING_DIR     : path.join(ROOT, 'data', 'reading'),
  USER_DB_PATH    : process.env.VERCEL ? path.join('/tmp', 'user_db.json') : path.join(__dirname, '..', 'user_db.json'),
  ACTIVITY_LOG    : process.env.VERCEL ? path.join('/tmp', 'activity_log.json') : path.join(__dirname, '..', 'activity_log.json'),
};
