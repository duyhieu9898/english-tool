/**
 * routes/reading.js
 * Reading lessons migrated to MongoDB.
 */
import { Router } from 'express';
import { Lesson } from '../models/ContentModels.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    let query = { type: 'reading' };
    if (req.query.level) query.level = req.query.level;

    const reading = await Lesson.find(query).lean();

    res.setHeader('X-Total-Count', reading.length);
    res.json(reading);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Lesson.findOne({
      type: 'reading',
      $or: [
        { id: req.params.id },
        { slug: req.params.id }
      ]
    }).lean();

    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
