import { Router } from 'express';
import { loadReading } from '../db/contentDb.js';

const router = Router();

router.get('/', (req, res) => {
  let reading = loadReading();
  if (req.query.level) reading = reading.filter(r => r.level === req.query.level);
  res.setHeader('X-Total-Count', reading.length);
  res.json(reading);
});

router.get('/:id', (req, res) => {
  const reading = loadReading();
  const item = reading.find(r => String(r.id) === req.params.id || r.slug === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export default router;
