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
import { ACTIVITY_LOG } from '../db/paths.js';

const router = Router();

function readLog() {
  try {
    if (!fs.existsSync(ACTIVITY_LOG)) return [];
    const raw = fs.readFileSync(ACTIVITY_LOG, 'utf-8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  const tmp = `${ACTIVITY_LOG}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf-8');
  fs.renameSync(tmp, ACTIVITY_LOG);
}

// GET /activityLog
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 500;
  const entries = readLog();
  res.json(entries.slice(-limit).reverse()); // newest first
});

// POST /activityLog
router.post('/', (req, res) => {
  const entries = readLog();
  const entry = { ts: new Date().toISOString(), ...req.body };
  entries.push(entry);

  // Keep at most 1000 entries to prevent unbounded growth
  if (entries.length > 1000) entries.splice(0, entries.length - 1000);

  writeLog(entries);
  res.status(201).json(entry);
});

// DELETE /activityLog
router.delete('/', (req, res) => {
  writeLog([]);
  res.json({ cleared: true });
});

export default router;
