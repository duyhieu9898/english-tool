/**
 * routes/userData.js
 * Refactored to use MongoDB via Mongoose for cloud persistence.
 */
import { Router } from 'express';
import { 
  WordProgress, LessonProgress, SessionProgress, 
  StudyLog, Stats, Settings 
} from '../models/UserModels.js';
import { processSessionFinish } from '../services/sessionService.js';

const router = Router({ mergeParams: true });

const MODEL_MAP = {
  wordProgress: WordProgress,
  lessonProgress: LessonProgress,
  sessionProgress: SessionProgress,
  studyLog: StudyLog,
  stats: Stats,
  settings: Settings
};

// Unified Session Finish Route
router.post('/session/finish', async (req, res) => {
  try {
    const { clientDate, reviews } = req.body;
    if (!clientDate || !Array.isArray(reviews)) {
      return res.status(400).json({ error: 'Missing clientDate or reviews array' });
    }

    // 1. Fetch all necessary data for processSessionFinish
    const [wordProgress, statsArr, studyLog] = await Promise.all([
      WordProgress.find({}).lean(),
      Stats.find({}).lean(),
      StudyLog.find({}).lean()
    ]);

    const stats = statsArr[0] || { totalWordsLearned: 0, currentStreak: 0, lastStudyDate: '', totalStudyDays: 0 };
    const snap = { wordProgress, stats, studyLog };

    // 2. Run the legacy business logic
    const { wordsLearned, wordsReviewed, graduatedItems } = processSessionFinish(snap, clientDate, reviews);

    // 3. Persist changes back to MongoDB
    // Note: sessionService mutates 'snap'. We need to save each part.
    
    // Save Word Progress (Upsert each modified word)
    const wordOps = snap.wordProgress.map(w => ({
      updateOne: {
        filter: { id: w.id },
        update: { $set: w },
        upsert: true
      }
    }));
    // Remove graduated items
    const deleteOps = graduatedItems.map(w => ({
      deleteOne: { filter: { id: w.id } }
    }));

    // Save Stats
    const statsOp = {
      updateOne: {
        filter: { id: 1 },
        update: { $set: snap.stats },
        upsert: true
      }
    };

    // Save Study Log
    const logOps = snap.studyLog.map(l => ({
      updateOne: {
        filter: { id: l.id },
        update: { $set: l },
        upsert: true
      }
    }));

    await Promise.all([
      WordProgress.bulkWrite([...wordOps, ...deleteOps]),
      Stats.bulkWrite([statsOp]),
      StudyLog.bulkWrite(logOps)
    ]);
    
    res.status(200).json({
      success: true,
      wordsLearned,
      wordsReviewed,
      graduatedItems,
      stats: snap.stats
    });
  } catch (error) {
    console.error('Session finish error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const COLLECTIONS = Object.keys(MODEL_MAP);

COLLECTIONS.forEach(col => {
  const Model = MODEL_MAP[col];

  // GET all / filtered
  router.get(`/${col}`, async (req, res) => {
    try {
      let query = {};
      for (const [key, val] of Object.entries(req.query)) {
        if (key.startsWith('_')) continue;

        if (key.endsWith('_lte')) {
          const realKey = key.replace('_lte', '');
          query[realKey] = { ...query[realKey], $lte: val };
        } else if (key.endsWith('_gte')) {
          const realKey = key.replace('_gte', '');
          query[realKey] = { ...query[realKey], $gte: val };
        } else if (key.endsWith('_ne')) {
          const realKey = key.replace('_ne', '');
          query[realKey] = { ...query[realKey], $ne: val };
        } else {
          query[key] = val;
        }
      }
      const result = await Model.find(query).lean();
      
      // Handle singleton objects (stats, settings)
      if (col === 'stats' || col === 'settings') {
        return res.json(result[0] || {});
      }

      res.setHeader('X-Total-Count', result.length);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET by id
  router.get(`/${col}/:id`, async (req, res) => {
    try {
      const item = await Model.findOne({ id: req.params.id }).lean();
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST — create or upsert
  router.post(`/${col}`, async (req, res) => {
    try {
      const id = req.body.id !== undefined ? req.body.id : (col === 'stats' || col === 'settings' ? 1 : Date.now().toString());
      const updated = await Model.findOneAndUpdate(
        { id: id },
        { ...req.body, id: id },
        { upsert: true, new: true, lean: true }
      );
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT — replace or singleton update
  router.put(`/${col}`, async (req, res) => {
    try {
      const id = col === 'stats' || col === 'settings' ? 1 : req.body.id;
      if (!id) return res.status(400).json({ error: 'Missing ID for PUT' });
      const updated = await Model.findOneAndUpdate(
        { id: id },
        { ...req.body, id: id },
        { upsert: true, new: true, lean: true }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT by id — replace item
  router.put(`/${col}/:id`, async (req, res) => {
    try {
      const updated = await Model.findOneAndUpdate(
        { id: req.params.id },
        { ...req.body, id: req.params.id },
        { upsert: true, new: true, lean: true }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH by id — partial update
  router.patch(`/${col}/:id`, async (req, res) => {
    try {
      const updated = await Model.findOneAndUpdate(
        { id: req.params.id },
        { $set: req.body },
        { new: true, lean: true }
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE by id
  router.delete(`/${col}/:id`, async (req, res) => {
    try {
      const deleted = await Model.findOneAndDelete({ id: req.params.id }).lean();
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      res.json(deleted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

export default router;
