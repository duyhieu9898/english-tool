import express from 'express';
import cors    from 'cors';

import lessonsRouter     from './routes/lessons.js';
import grammarRouter     from './routes/grammar.js';
import readingRouter     from './routes/reading.js';
import activityLogRouter from './routes/activityLog.js';
import userDataRouter    from './routes/userData.js';
import { loadLessons }   from './db/contentDb.js';
import { USER_DB_PATH }  from './db/paths.js';
import { logger }        from './utils/logger.js';
import { fileURLToPath } from 'url';

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use('/lessons',     lessonsRouter);
app.use('/grammar',     grammarRouter);
app.use('/reading',     readingRouter);
app.use('/activityLog', activityLogRouter);
app.use('/',            userDataRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error during ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === (await import('fs')).realpathSync(process.argv[1]);

if (isMain || process.argv[1]?.endsWith('server.js')) {
  app.listen(PORT, () => {
    const lessons = loadLessons();
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`   Lessons: ${lessons.length}  |  User DB: ${USER_DB_PATH}`);
  });
}

export default app;
