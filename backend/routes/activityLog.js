/**
 * routes/activityLog.js
 * Simple append-only log for FE activity events (debug/analytics).
 * Stored as a JSON array in activity_log.json.
 *
 * POST /activityLog   — append one event
 * GET  /activityLog   — retrieve all events (newest first), optional ?limit=N
 * DELETE /activityLog — clear all events
 */
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { ACTIVITY_LOG_DIR } from '../db/paths.js';

const router = Router();

/** Helper for today's log file path */
function getTodayPath() {
  const today = new Date().toISOString().split('T')[0];
  if (!fs.existsSync(ACTIVITY_LOG_DIR)) fs.mkdirSync(ACTIVITY_LOG_DIR, { recursive: true });
  return path.join(ACTIVITY_LOG_DIR, `${today}.json`);
}

function readLog(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLog(filePath, entries) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);
}

// GET /activityLog — retrieve today's events (newest first)
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 500;
  const filePath = getTodayPath();
  const entries = readLog(filePath);
  res.json(entries.slice(-limit).reverse());
});

// GET /activityLog/files — list all available log dates
router.get('/files', (req, res) => {
  if (!fs.existsSync(ACTIVITY_LOG_DIR)) return res.json([]);
  const files = fs.readdirSync(ACTIVITY_LOG_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort((a, b) => b.localeCompare(a)); // Newest date first
  res.json(files);
});

// GET /activityLog/:date — get log for a specific date
router.get('/:date', (req, res) => {
  const targetPath = path.join(ACTIVITY_LOG_DIR, `${req.params.date}.json`);
  if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Log not found' });
  const entries = readLog(targetPath);
  res.json(entries.reverse());
});

// POST /activityLog
router.post('/', (req, res) => {
  const filePath = getTodayPath();
  const entries = readLog(filePath);
  const entry = { ts: new Date().toISOString(), ...req.body };
  entries.push(entry);

  // Still cap at 2000 per day or something? Let's say 2000 for safety.
  if (entries.length > 2000) entries.splice(0, entries.length - 2000);

  writeLog(filePath, entries);
  res.status(201).json(entry);
});

// DELETE /activityLog — clear today's log
router.delete('/', (req, res) => {
  const filePath = getTodayPath();
  writeLog(filePath, []);
  res.json({ cleared: true });
});

export default router;
