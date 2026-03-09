const express = require('express');
const cors    = require('cors');

const lessonsRouter     = require('./routes/lessons');
const grammarRouter     = require('./routes/grammar');
const readingRouter     = require('./routes/reading');
const activityLogRouter = require('./routes/activityLog');
const userDataRouter    = require('./routes/userData');
const { loadLessons }   = require('./db/contentDb');
const { USER_DB_PATH }  = require('./db/paths');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/lessons',     lessonsRouter);
app.use('/grammar',     grammarRouter);
app.use('/reading',     readingRouter);
app.use('/activityLog', activityLogRouter);
app.use('/',            userDataRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    const lessons = loadLessons();
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`   Lessons: ${lessons.length}  |  User DB: ${USER_DB_PATH}`);
  });
}

module.exports = app;
