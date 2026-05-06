import express from 'express';
import cors    from 'cors';
import fs      from 'fs';
import { fileURLToPath } from 'url';

import lessonsRouter     from './routes/lessons.js';
import grammarRouter     from './routes/grammar.js';
import readingRouter     from './routes/reading.js';
import listeningRouter   from './routes/listening.js';
import activityLogRouter from './routes/activityLog.js';
import userDataRouter    from './routes/userData.js';
import { loadLessons }   from './db/contentDb.js';
import { USER_DB_PATH }  from './db/paths.js';
import { logger }        from './utils/logger.js';

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

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/lessons',     lessonsRouter);
app.use('/grammar',     grammarRouter);
app.use('/reading',     readingRouter);
app.use('/listening',   listeningRouter);
app.use('/activityLog', activityLogRouter);
app.use('/',            userDataRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error during ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server if this is the main entry point
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1]);
const isNodemon = process.argv[1]?.endsWith('server.js');

if (isMain || isNodemon) {
  app.listen(PORT, () => {
    try {
      const lessons = loadLessons();
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`   Lessons: ${lessons.length}  |  User DB: ${USER_DB_PATH}`);
    } catch (err) {
      logger.error('Failed to initialize content DB:', err);
    }
  });
}

export default app;
