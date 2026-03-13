import { Router } from 'express';
import { loadLessons } from '../db/contentDb.js';

const router = Router();

// GET /lessons
router.get('/', (req, res) => {
  const { level, name, slug, _limit, _page } = req.query;
  let lessons = loadLessons();

  if (level) lessons = lessons.filter(l => l.level === level);
  if (name)  lessons = lessons.filter(l => l.name.toLowerCase().includes(name.toLowerCase()));
  if (slug)  lessons = lessons.filter(l => l.slug === slug);

  const total = lessons.length;
  res.setHeader('X-Total-Count', total);

  if (_page && _limit) {
    const page  = parseInt(_page, 10);
    const limit = parseInt(_limit, 10);
    lessons = lessons.slice((page - 1) * limit, page * limit);
  } else if (_limit) {
    lessons = lessons.slice(0, parseInt(_limit, 10));
  }

  // Strip words from list response to keep payload small
  res.json(lessons.map(({ words: _w, ...rest }) => rest));
});

// GET /lessons/words — flat list of ALL words across all lessons (used by SearchVocab)
// Must be defined BEFORE /:id to avoid Express matching "words" as an id param
router.get('/words', (req, res) => {
  const lessons = loadLessons();
  const words = lessons.flatMap(lesson =>
    lesson.words.map(w => ({
      ...w,
      lessonId:   lesson.id,
      lessonName: lesson.name,
      level:      lesson.level,
    })),
  );
  res.setHeader('X-Total-Count', words.length);
  res.json(words);
});

// GET /lessons/:id — full lesson with words
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const lessons = loadLessons();
  const lesson =
    lessons.find(l => String(l.id) === id) ||
    lessons.find(l => l.slug === decodeURIComponent(id));

  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
  res.json(lesson);
});

export default router;
