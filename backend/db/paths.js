/**
 * db/paths.js — single source of truth for all file paths
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const DATA_ROOT = process.env.VERCEL ? '/tmp' : path.join(ROOT, 'data');

export const CLASSIFIED_PATH  = path.join(ROOT, 'oxford_classified.json');
export const GRAMMAR_DIR      = path.join(DATA_ROOT, 'grammar');
export const READING_DIR      = path.join(DATA_ROOT, 'reading');
export const LISTENING_DIR    = path.join(DATA_ROOT, 'listening');

export const USER_DB_PATH     = path.join(DATA_ROOT, 'user_db.json');
export const ACTIVITY_LOG_DIR = path.join(DATA_ROOT, 'activity_log');
export const LOGS_DIR         = path.join(DATA_ROOT, 'server_logs');
