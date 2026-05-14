/**
 * routes/grammar.js
 * Grammar lessons migrated to MongoDB.
 */
import { Router } from 'express';
import { Lesson } from '../models/ContentModels.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    let query = { type: 'grammar' };
    if (req.query.level) query.level = req.query.level;

    const grammar = await Lesson.find(query).lean();

    res.setHeader('X-Total-Count', grammar.length);
    res.json(grammar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Lesson.findOne({
      type: 'grammar',
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
