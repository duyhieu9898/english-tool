/**
 * routes/lessons.js
 * Vocabulary lessons migrated to MongoDB.
 */
import { Router } from 'express';
import { Lesson } from '../models/ContentModels.js';

const router = Router();

// GET /lessons
router.get('/', async (req, res) => {
  try {
    const { level, name, slug, _limit, _page } = req.query;
    let query = { type: 'vocabulary' };

    if (level) query.level = level;
    if (slug) query.slug = slug;
    if (name) query.name = { $regex: name, $options: 'i' };

    const total = await Lesson.countDocuments(query);
    res.setHeader('X-Total-Count', total);

    let dbQuery = Lesson.find(query);

    if (_page && _limit) {
      const page = parseInt(_page, 10);
      const limit = parseInt(_limit, 10);
      dbQuery = dbQuery.skip((page - 1) * limit).limit(limit);
    } else if (_limit) {
      dbQuery = dbQuery.limit(parseInt(_limit, 10));
    }

    const lessons = await dbQuery.lean();
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /lessons/words — flat list of ALL words across all lessons (used by SearchVocab)
router.get('/words', async (req, res) => {
  try {
    const lessons = await Lesson.find({ type: 'vocabulary' }).lean();
    const words = lessons.flatMap(lesson =>
      (lesson.words || []).map(w => ({
        ...w,
        lessonId: lesson.id,
        lessonName: lesson.name,
        level: lesson.level,
      })),
    );
    res.setHeader('X-Total-Count', words.length);
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /lessons/:id — full lesson with words
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({
      type: 'vocabulary',
      $or: [
        { id: id },
        { slug: decodeURIComponent(id) }
      ]
    }).lean();

    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
