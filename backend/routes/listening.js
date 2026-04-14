import { Router } from 'express';
import { loadListening } from '../db/contentDb.js';

const router = Router();

router.get('/', (req, res) => {
  let listening = loadListening();
  if (req.query.level) listening = listening.filter(r => r.level === req.query.level);
  res.setHeader('X-Total-Count', listening.length);
  res.json(listening);
});

router.get('/:id', (req, res) => {
  const listening = loadListening();
  const item = listening.find(r => String(r.id) === req.params.id || r.slug === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export default router;
