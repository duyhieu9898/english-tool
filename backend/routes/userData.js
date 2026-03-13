/**
 * routes/userData.js
 * Generic CRUD for all user collections stored in user_db.json.
 * Handles both singleton objects (stats, settings) and arrays.
 */
import { Router } from 'express';
import db from '../db/userDb.js';

const router = Router({ mergeParams: true });

const COLLECTIONS = ['wordProgress', 'lessonProgress', 'sessionProgress', 'studyLog', 'stats', 'settings'];

COLLECTIONS.forEach(col => {
  // GET all / filtered
  router.get(`/${col}`, (req, res) => {
    const data = db.load()[col];
    if (!Array.isArray(data)) return res.json(data);

    let result = [...data];
    for (const [key, val] of Object.entries(req.query)) {
      if (!key.startsWith('_')) {
        result = result.filter(item => String(item[key]) === String(val));
      }
    }
    res.setHeader('X-Total-Count', result.length);
    res.json(result);
  });

  // GET by id
  router.get(`/${col}/:id`, (req, res) => {
    const data = db.load()[col];
    if (!Array.isArray(data)) return res.json(data);
    const item = data.find(d => String(d.id) === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  // POST — create
  router.post(`/${col}`, (req, res) => {
    const snap = db.load();
    const data = snap[col];
    if (!Array.isArray(data)) {
      Object.assign(data, req.body);
      db.save(snap);
      return res.status(200).json(data);
    }
    const newId = req.body.id !== undefined ? req.body.id : Date.now();
    if (data.some(d => String(d.id) === String(newId))) {
      return res.status(409).json({ error: 'Duplicate id', id: newId });
    }
    const newItem = { ...req.body, id: newId };
    data.push(newItem);
    db.save(snap);
    res.status(201).json(newItem);
  });

  // PUT root — singleton replace
  router.put(`/${col}`, (req, res) => {
    const snap = db.load();
    const data = snap[col];
    if (!Array.isArray(data)) {
      Object.assign(snap[col], req.body);
      db.save(snap);
      return res.json(snap[col]);
    }
    res.status(400).json({ error: 'Cannot fully replace an array collection.' });
  });

  // PUT by id — replace item
  router.put(`/${col}/:id`, (req, res) => {
    const snap = db.load();
    const data = snap[col];
    if (!Array.isArray(data)) {
      Object.assign(data, req.body);
      db.save(snap);
      return res.json(data);
    }
    const idx = data.findIndex(d => String(d.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data[idx] = { ...req.body, id: data[idx].id };
    db.save(snap);
    res.json(data[idx]);
  });

  // PATCH by id — partial update
  router.patch(`/${col}/:id`, (req, res) => {
    const snap = db.load();
    const data = snap[col];
    if (!Array.isArray(data)) {
      Object.assign(data, req.body);
      db.save(snap);
      return res.json(data);
    }
    const idx = data.findIndex(d => String(d.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data[idx] = { ...data[idx], ...req.body };
    db.save(snap);
    res.json(data[idx]);
  });

  // DELETE by id
  router.delete(`/${col}/:id`, (req, res) => {
    const snap = db.load();
    const data = snap[col];
    if (!Array.isArray(data)) return res.status(400).json({ error: 'Cannot delete singleton' });
    const idx = data.findIndex(d => String(d.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const [deleted] = data.splice(idx, 1);
    db.save(snap);
    res.json(deleted);
  });
});

export default router;
