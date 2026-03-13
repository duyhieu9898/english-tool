/**
 * db/paths.js — single source of truth for all file paths
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

export const CLASSIFIED_PATH = path.join(ROOT, 'oxford_classified.json');
export const GRAMMAR_DIR     = path.join(ROOT, 'data', 'grammar');
export const READING_DIR     = path.join(ROOT, 'data', 'reading');
export const USER_DB_PATH    = process.env.VERCEL ? path.join('/tmp', 'user_db.json') : path.join(__dirname, '..', 'user_db.json');
export const ACTIVITY_LOG    = process.env.VERCEL ? path.join('/tmp', 'activity_log.json') : path.join(__dirname, '..', 'activity_log.json');
