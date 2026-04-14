# Project Architecture & Instructions

> **Purpose**: This document provides AI assistants with comprehensive project architecture information to efficiently understand and modify the codebase without scanning the entire project.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Module Architecture](#module-architecture)
5. [Data Flow](#data-flow)
6. [Key Patterns](#key-patterns)
7. [Adding New Features](#adding-new-features)
8. [Common Tasks](#common-tasks)

---

## 🎯 Project Overview

**Project Name**: English Learning Platform  
**Type**: Full-stack web application  
**Purpose**: Interactive English learning platform with vocabulary, grammar, reading, and listening modules

### Core Features
- 📚 **Vocabulary**: Spaced repetition learning system
- 📖 **Grammar**: Interactive grammar lessons with practice
- 📰 **Reading**: Reading comprehension with translations
- 🎧 **Listening**: Dictation practice with TTS
- 📊 **Progress Tracking**: Statistics, streaks, heatmaps
- 🔄 **Review System**: Daily reviews and general review

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query) v5
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: JSON Server (file-based)
- **Data Storage**: JSON files in `backend/data/`

### Key Libraries
- `canvas-confetti`: Celebration animations
- `date-fns`: Date manipulation
- `clsx`: Conditional classNames

---

## 📁 Project Structure

```
project-root/
├── backend/                      # Backend server
│   ├── data/                     # JSON data storage
│   │   ├── vocabulary/           # Vocabulary lessons by level
│   │   ├── grammar/              # Grammar lessons by level
│   │   ├── reading/              # Reading lessons by level
│   │   ├── listening/            # Listening lessons by level
│   │   └── user_db.json          # User progress data
│   ├── db/
│   │   ├── contentDb.js          # Content loaders (read-only)
│   │   ├── paths.js              # Path constants
│   │   └── userDb.js             # User data operations
│   ├── routes/                   # API route handlers
│   │   ├── lessons.js            # Vocabulary endpoints
│   │   ├── grammar.js            # Grammar endpoints
│   │   ├── reading.js            # Reading endpoints
│   │   ├── listening.js          # Listening endpoints
│   │   ├── wordProgress.js       # Word progress tracking
│   │   ├── lessonProgress.js     # Lesson completion tracking
│   │   ├── sessionProgress.js    # Session state management
│   │   ├── studyLog.js           # Daily study logs
│   │   ├── stats.js              # User statistics
│   │   └── settings.js           # User settings
│   └── server.js                 # Express server entry point
│
├── src/                          # Frontend source
│   ├── components/
│   │   ├── common/               # Shared components
│   │   │   ├── LevelSelector.tsx      # Level selection screen
│   │   │   ├── LessonSelector.tsx     # Lesson selection screen
│   │   │   └── HeatmapCalendar.tsx    # Activity heatmap
│   │   ├── layout/               # Layout components
│   │   │   ├── AppLayout.tsx          # Main app layout
│   │   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   │   ├── PageContainer.tsx      # Page wrapper
│   │   │   └── PageDetailContainer.tsx # Detail page wrapper
│   │   └── ui/                   # UI primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── ProgressBar.tsx
│   │
│   ├── pages/                    # Page components
│   │   ├── Dashboard.tsx              # Home dashboard
│   │   ├── vocabulary/
│   │   │   └── VocabSession.tsx       # Vocabulary learning session
│   │   ├── grammar/
│   │   │   └── GrammarDetail.tsx      # Grammar lesson detail
│   │   ├── reading/
│   │   │   └── ReadingDetail.tsx      # Reading lesson detail
│   │   ├── listening/
│   │   │   └── ListeningDetail.tsx    # Listening lesson detail
│   │   ├── review/
│   │   │   ├── DailyReview.tsx        # Daily word review
│   │   │   └── GeneralReview.tsx      # General word review
│   │   ├── progress/
│   │   │   └── ProgressPage.tsx       # Progress statistics
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx       # App settings
│   │   └── search/
│   │       └── SearchVocab.tsx        # Vocabulary search
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useApi.ts                  # React Query hooks
│   │   ├── queryKeys.ts               # Query key factory
│   │   ├── useTTS.ts                  # Text-to-speech hook
│   │   └── useKeyboard.ts             # Keyboard shortcuts
│   │
│   ├── services/                 # API & utilities
│   │   ├── api.ts                     # API client functions
│   │   ├── http.ts                    # Axios instance
│   │   └── sounds.ts                  # Sound effects
│   │
│   ├── types/
│   │   └── index.ts                   # TypeScript type definitions
│   │
│   ├── App.tsx                   # Root component with routes
│   └── main.tsx                  # React entry point
│
├── INSTRUCTIONS.md               # This file
└── package.json
```

---

## 🏗 Module Architecture

### Module Types

The application has 4 main learning modules, each following the same pattern:

#### 1. **Vocabulary Module**
- **Route Pattern**: `/vocabulary` → `/vocabulary/:level` → `/vocabulary/:level/:lessonId`
- **Data Location**: `backend/data/vocabulary/classified.json`
- **Components**: `LevelSelector` → `LessonSelector` → `VocabSession`
- **Features**: Flashcards, spaced repetition, word progress tracking

#### 2. **Grammar Module**
- **Route Pattern**: `/grammar` → `/grammar/:level` → `/grammar/:level/:lessonId`
- **Data Location**: `backend/data/grammar/{level}/*.json`
- **Components**: `LevelSelector` → `LessonSelector` → `GrammarDetail`
- **Features**: Theory, structures, tips, practice questions

#### 3. **Reading Module**
- **Route Pattern**: `/reading` → `/reading/:level` → `/reading/:level/:lessonId`
- **Data Location**: `backend/data/reading/{level}/*.json`
- **Components**: `LevelSelector` → `LessonSelector` → `ReadingDetail`
- **Features**: Text content, vocabulary highlights, comprehension questions, translations

#### 4. **Listening Module**
- **Route Pattern**: `/listening` → `/listening/:level` → `/listening/:level/:lessonId`
- **Data Location**: `backend/data/listening/{level}/*.json`
- **Components**: `LevelSelector` → `LessonSelector` → `ListeningDetail`
- **Features**: TTS audio, dictation practice, speed control, hints

### CEFR Levels
All modules support 5 CEFR levels:
- `a1`: Beginner
- `a2`: Elementary
- `b1`: Intermediate
- `b2`: Upper Intermediate
- `c1`: Advanced

---

## 🔄 Data Flow

### Content Data (Read-Only)
```
JSON Files → contentDb.js → Express Routes → API Client → React Query → Components
```

**Example**: Loading listening lessons
1. `backend/data/listening/a1/*.json` - JSON files
2. `backend/db/contentDb.js` - `loadListening()` function
3. `backend/routes/listening.js` - Express route handler
4. `src/services/api.ts` - `getListeningLessonsByLevel()`
5. `src/hooks/useApi.ts` - `useListeningLessons()` hook
6. `src/pages/listening/ListeningDetail.tsx` - Component

### User Data (Read-Write)
```
user_db.json ↔ userDb.js ↔ Express Routes ↔ API Client ↔ React Query ↔ Components
```

**User Data Collections**:
- `wordProgress`: Individual word learning progress
- `lessonProgress`: Completed lessons tracking
- `sessionProgress`: In-progress session state
- `studyLog`: Daily study statistics
- `stats`: Aggregate user statistics
- `settings`: User preferences

---

## 🎨 Key Patterns

### 1. TypeScript Interfaces

**Location**: `src/types/index.ts`

**Critical Rule**: Interfaces MUST match JSON data structure exactly.

```typescript
// Example: Listening module interfaces
export interface ListeningQuestion {
  id: string;
  sentence: string;
  // NO optional fields unless they exist in JSON
}

export interface ListeningLesson {
  id: string;
  slug: string;
  level: string;
  title: string;
  topic: string;
  questions: ListeningQuestion[];
  // Only include fields that exist in JSON files
}
```

### 2. React Query Pattern

**Query Keys**: Defined in `src/hooks/queryKeys.ts`
```typescript
export const queryKeys = {
  listening: {
    all: () => ['listening'] as const,
    byLevel: (level: string) => ['listening', 'level', level] as const,
    detail: (id: string) => ['listening', 'detail', id] as const,
  },
};
```

**Hooks**: Defined in `src/hooks/useApi.ts`
```typescript
export const useListeningLessons = (level?: string) =>
  useQuery({
    queryKey: level ? queryKeys.listening.byLevel(level) : queryKeys.listening.all(),
    queryFn: () => level ? api.getListeningLessonsByLevel(level) : api.getListeningLessonsByLevel(''),
  });
```

### 3. API Client Pattern

**Location**: `src/services/api.ts`

```typescript
export const api = {
  getListeningLessonsByLevel: (level: string) =>
    http.get<ListeningLesson[]>(`/listening?level=${level}`).then((r) => r.data),
  getListeningLessonById: (id: string) =>
    http.get<ListeningLesson>(`/listening/${id}`).then((r) => r.data),
};
```

### 4. Backend Route Pattern

**Location**: `backend/routes/listening.js`

```javascript
import { Router } from 'express';
import { loadListening } from '../db/contentDb.js';

const router = Router();

// List with optional level filter
router.get('/', (req, res) => {
  let listening = loadListening();
  if (req.query.level) listening = listening.filter(r => r.level === req.query.level);
  res.setHeader('X-Total-Count', listening.length);
  res.json(listening);
});

// Get by ID or slug
router.get('/:id', (req, res) => {
  const listening = loadListening();
  const item = listening.find(r => String(r.id) === req.params.id || r.slug === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export default router;
```

### 5. Content Loader Pattern

**Location**: `backend/db/contentDb.js`

```javascript
let _listening = null; // In-memory cache

function loadListening() {
  if (_listening) return _listening;
  let id = 1;
  _listening = LEVELS.flatMap(level => {
    const files = readJsonFiles(path.join(LISTENING_DIR, level));
    return files.map(({ file, content }) => ({
      id:        id++,
      slug:      content.id || `${level}-${file}`,
      level:     content.level || level,
      title:     content.title || file,
      topic:     content.topic || '',
      questions: content.questions || [],
    }));
  });
  return _listening;
}
```

### 6. Component Patterns

**Shared Components**:
- `LevelSelector`: Reusable for all modules, accepts `moduleType` prop
- `LessonSelector`: Reusable for all modules, accepts `moduleType` prop
- Detail pages: Module-specific (VocabSession, GrammarDetail, ReadingDetail, ListeningDetail)

**Props Pattern**:
```typescript
interface LevelSelectorProps {
  moduleType: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  title: string;
  description: string;
}
```

---

## 📊 Progress Module - Detailed Documentation

### Overview

The Progress module is a comprehensive tracking system that aggregates and displays user learning statistics across all modules (Vocabulary, Grammar, Reading, Listening). It provides visual feedback through statistics cards, progress bars, and activity heatmaps.

### Location
- **Component**: `src/pages/progress/ProgressPage.tsx`
- **Route**: `/progress`
- **Related Components**: 
  - `src/components/ui/ProgressBar.tsx`
  - `src/components/common/HeatmapCalendar.tsx`

### Data Sources

The Progress module pulls data from multiple sources:

#### 1. **User Statistics** (`stats`)
**API**: `GET /stats`  
**Hook**: `useStats()`  
**Type**: `AppStats`

```typescript
interface AppStats {
  id: 1;
  totalWordsLearned: number;    // Total words ever learned
  currentStreak: number;         // Consecutive days of study
  lastStudyDate: string;         // ISO date of last study
  totalStudyDays: number;        // Total unique days studied
}
```

**Usage in Progress**:
- Display total words learned
- Show current streak
- Calculate total study days

#### 2. **Word Progress** (`words`)
**API**: `GET /wordProgress`  
**Hook**: `useWordProgressAll()`  
**Type**: `WordProgress[]`

```typescript
interface WordProgress {
  id: string;              // e.g. "a1/people-family/father"
  term: string;            // The word
  lessonId: string;        // Parent lesson ID
  level: 1 | 2 | 3 | 4 | 5; // Spaced repetition level
  lastStudied: string;     // ISO date
  nextReview: string;      // ISO date
  correctCount: number;    // Times answered correctly
  incorrectCount: number;  // Times answered incorrectly
}
```

**Usage in Progress**:
- Count total active words (words in review system)
- Calculate mastered words: `totalWordsLearned - activeWords`
- Show retention level distribution (Level 1-5)
- Generate progress bars for each level

#### 3. **Study Logs** (`logs`)
**API**: `GET /studyLog`  
**Hook**: `useAllStudyLogs()`  
**Type**: `StudyLog[]`

```typescript
interface StudyLog {
  id: string;           // YYYY-MM-DD format
  date: string;         // YYYY-MM-DD format
  wordsLearned: number; // New words learned that day
  wordsReviewed: number; // Words reviewed that day
}
```

**Usage in Progress**:
- Generate activity heatmap
- Show study consistency
- Calculate daily goal progress

#### 4. **Lesson Progress** (`lessons`)
**API**: `GET /lessonProgress`  
**Hook**: `useLessonProgressAll()`  
**Type**: `LessonProgress[]`

```typescript
interface LessonProgress {
  id: string;  // Lesson ID or slug
  type: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  completedAt: string; // ISO date
}
```

**Usage in Progress**:
- Count completed lessons per module
- Show module completion statistics

#### 5. **User Settings** (`settings`)
**API**: `GET /settings`  
**Hook**: `useSettings()`  
**Type**: `AppSettings`

```typescript
interface AppSettings {
  id: 1;
  dailyGoal: number;           // Target words per day
  theme: 'light' | 'dark';
  soundEnabled?: boolean;
}
```

**Usage in Progress**:
- Get daily goal for heatmap calculations

### UI Components

#### 1. **Statistics Cards** (Top Row)

Four cards displaying key metrics:

```typescript
// Card 1: Total Learned (Blue)
<Card className="bg-blue-50 dark:bg-blue-900/10">
  <div className="text-4xl font-black text-blue-600">
    {stats?.totalWordsLearned ?? 0}
  </div>
  <div className="text-sm">Total Learned</div>
</Card>

// Card 2: Mastered (Green)
const masteredWords = Math.max(0, (stats?.totalWordsLearned ?? 0) - totalWordsActive);
<Card className="bg-green-50 dark:bg-green-900/10">
  <div className="text-4xl font-black text-green-600">
    {masteredWords}
  </div>
  <div className="text-sm">Mastered</div>
</Card>

// Card 3: Day Streak (Orange)
<Card className="bg-orange-50 dark:bg-orange-900/10">
  <div className="text-4xl font-black text-orange-600">
    {stats?.currentStreak ?? 0}
  </div>
  <div className="text-sm">Day Streak</div>
</Card>

// Card 4: Study Days (Purple)
<Card className="bg-purple-50 dark:bg-purple-900/10">
  <div className="text-4xl font-black text-purple-600">
    {stats?.totalStudyDays ?? 0}
  </div>
  <div className="text-sm">Study Days</div>
</Card>
```

**Calculations**:
- `totalWordsActive`: Count of words in `wordProgress` array
- `masteredWords`: Words that graduated from review system = `totalWordsLearned - totalWordsActive`

#### 2. **Retention Levels Card** (Left Column)

Shows distribution of words across spaced repetition levels:

```typescript
const byLevel = [1, 2, 3, 4, 5].map((lvl) => ({
  level: lvl,
  count: words.filter((w) => w.level === lvl).length,
}));

// Display as progress bars
{byLevel.map((lvl) => (
  <ProgressBar
    progress={totalWordsActive > 0 ? (lvl.count / totalWordsActive) * 100 : 0}
    label={`Level ${lvl.level} (${lvl.count})`}
    color={lvl.level === 5 ? 'green' : lvl.level > 3 ? 'blue' : 'orange'}
  />
))}
```

**Level Meanings**:
- **Level 1**: Just learned, review soon
- **Level 2**: Reviewed once, still learning
- **Level 3**: Getting familiar
- **Level 4**: Almost mastered
- **Level 5**: Mastered, long review intervals

**Color Coding**:
- Orange: Levels 1-3 (learning phase)
- Blue: Level 4 (almost mastered)
- Green: Level 5 (mastered)

#### 3. **Completed Modules Card** (Right Column)

Shows count of completed lessons per module:

```typescript
const completedVocab     = lessons.filter((l) => l.type === 'vocabulary').length;
const completedGrammar   = lessons.filter((l) => l.type === 'grammar').length;
const completedReading   = lessons.filter((l) => l.type === 'reading').length;
const completedListening = lessons.filter((l) => l.type === 'listening').length;

// Display with icons
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
      <BookType className="w-5 h-5" />
    </div>
    <span className="font-bold text-lg">Vocabulary</span>
  </div>
  <span className="text-2xl font-black">{completedVocab}</span>
</div>
```

**Module Icons & Colors**:
- **Vocabulary**: `BookType` icon, Blue (`bg-blue-100`)
- **Grammar**: `Hash` icon, Purple (`bg-purple-100`)
- **Reading**: `BookOpen` icon, Orange (`bg-orange-100`)
- **Listening**: `Headphones` icon, Yellow (`bg-yellow-100`)

#### 4. **Activity Heatmap** (Bottom)

Visual calendar showing daily study activity:

```typescript
<HeatmapCalendar logs={logs} dailyGoal={dailyGoal} />
```

**Component**: `src/components/common/HeatmapCalendar.tsx`

**Props**:
- `logs`: Array of `StudyLog` objects
- `dailyGoal`: Target words per day from settings

**Features**:
- Shows last 12 weeks of activity
- Color intensity based on words learned/reviewed
- Tooltip shows exact numbers on hover
- Highlights days that met daily goal

**Color Scale**:
- Gray: No activity
- Light green: Some activity (< 50% of goal)
- Medium green: Good activity (50-99% of goal)
- Dark green: Goal met (≥ 100% of goal)

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ProgressPage Component                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─── useStats() ──────────────────┐
                              │                                  │
                              ├─── useWordProgressAll() ────────┤
                              │                                  │
                              ├─── useAllStudyLogs() ───────────┤
                              │                                  ├──► React Query Cache
                              ├─── useLessonProgressAll() ──────┤
                              │                                  │
                              └─── useSettings() ───────────────┘
                                                                 │
                                                                 ▼
                              ┌──────────────────────────────────────┐
                              │         API Client (api.ts)          │
                              └──────────────────────────────────────┘
                                                                 │
                                                                 ▼
                              ┌──────────────────────────────────────┐
                              │    Express Routes (backend/routes/)  │
                              └──────────────────────────────────────┘
                                                                 │
                                                                 ▼
                              ┌──────────────────────────────────────┐
                              │      User Database (user_db.json)    │
                              └──────────────────────────────────────┘
```

### Calculations & Logic

#### 1. **Mastered Words Calculation**

```typescript
const totalWordsActive = words.length; // Words currently in review system
const masteredWords = Math.max(0, (stats?.totalWordsLearned ?? 0) - totalWordsActive);
```

**Logic**:
- When a word reaches Level 5 and is reviewed successfully multiple times, it "graduates"
- Graduated words are removed from `wordProgress` but still count in `totalWordsLearned`
- Mastered = Total learned - Still in review system

#### 2. **Retention Level Distribution**

```typescript
const byLevel = [1, 2, 3, 4, 5].map((lvl) => ({
  level: lvl,
  count: words.filter((w) => w.level === lvl).length,
}));

// Calculate percentage for progress bar
const percentage = totalWordsActive > 0 
  ? (lvl.count / totalWordsActive) * 100 
  : 0;
```

**Purpose**: Shows how well words are being retained
- Many Level 1-2 words: Recently learned, need more review
- Many Level 4-5 words: Good retention, words are sticking

#### 3. **Module Completion Count**

```typescript
const completedVocab = lessons.filter((l) => l.type === 'vocabulary').length;
```

**When Lessons Are Marked Complete**:
- **Vocabulary**: After finishing all flashcards in a lesson
- **Grammar**: After completing practice questions
- **Reading**: After answering all comprehension questions
- **Listening**: After completing all dictation exercises

### Integration with Other Modules

#### How Modules Update Progress

**1. Vocabulary Module** (`VocabSession.tsx`):
```typescript
const finishMutation = useFinishVocabSessionMutation();

// On lesson completion
finishMutation.mutate({
  lessonId,
  wordsToSave,      // Updates wordProgress
  rememberedWords,
});

// Also adds to lessonProgress
addProgressMutation.mutate({
  id: lessonId,
  type: 'vocabulary',
  completedAt: new Date().toISOString(),
});
```

**2. Grammar Module** (`GrammarDetail.tsx`):
```typescript
const addProgressMutation = useAddLessonProgressMutation();

// On lesson completion
addProgressMutation.mutate({
  id: lesson.slug,
  type: 'grammar',
  completedAt: new Date().toISOString(),
});
```

**3. Reading Module** (`ReadingDetail.tsx`):
```typescript
const addProgressMutation = useAddLessonProgressMutation();

// On lesson completion
addProgressMutation.mutate({
  id: lesson.slug,
  type: 'reading',
  completedAt: new Date().toISOString(),
});
```

**4. Listening Module** (`ListeningDetail.tsx`):
```typescript
const addProgressMutation = useAddLessonProgressMutation();

// On lesson completion
addProgressMutation.mutate({
  id: lesson.slug,
  type: 'listening',
  completedAt: new Date().toISOString(),
});
```

### Backend Implementation

#### Stats Endpoint
**File**: `backend/routes/stats.js`

```javascript
router.get('/', (req, res) => {
  const stats = db.get('stats').value() || {
    id: 1,
    totalWordsLearned: 0,
    currentStreak: 0,
    lastStudyDate: '',
    totalStudyDays: 0,
  };
  res.json(stats);
});

router.put('/', (req, res) => {
  db.set('stats', req.body).write();
  res.json(req.body);
});
```

#### Lesson Progress Endpoint
**File**: `backend/routes/lessonProgress.js`

```javascript
// Get all completed lessons
router.get('/', (req, res) => {
  const progress = db.get('lessonProgress').value() || [];
  res.json(progress);
});

// Add new completion
router.post('/', (req, res) => {
  const progress = db.get('lessonProgress').value() || [];
  progress.push(req.body);
  db.set('lessonProgress', progress).write();
  res.json(req.body);
});
```

### Styling & Design

#### Color Scheme
- **Blue**: Vocabulary, learning metrics
- **Green**: Mastery, success
- **Orange**: Streaks, warnings
- **Purple**: Study days, consistency
- **Yellow**: Listening module

#### Dark Mode Support
All components support dark mode with appropriate color variants:
```typescript
className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
```

#### Responsive Design
- **Mobile**: Single column layout
- **Tablet**: 2-column grid for cards
- **Desktop**: 4-column grid for stats, 2-column for details

### Performance Considerations

#### Data Loading
```typescript
const { data: stats }            = useStats();
const { data: words = [] }       = useWordProgressAll();
const { data: logs = [] }        = useAllStudyLogs();
const { data: lessons = [] }     = useLessonProgressAll();
const { data: settings }         = useSettings();
```

**Optimization**:
- All queries run in parallel (React Query handles this)
- Data is cached by React Query
- `staleTime` can be configured for less frequent refetching

#### Calculations
All calculations are done in `useMemo` or directly in render (fast enough for typical data sizes):
```typescript
const byLevel = React.useMemo(() => {
  return [1, 2, 3, 4, 5].map((lvl) => ({
    level: lvl,
    count: words.filter((w) => w.level === lvl).length,
  }));
}, [words]);
```

### Adding New Statistics

**Example**: Add "Average Score" statistic

#### Step 1: Update AppStats Type
```typescript
// src/types/index.ts
export interface AppStats {
  id: 1;
  totalWordsLearned: number;
  currentStreak: number;
  lastStudyDate: string;
  totalStudyDays: number;
  averageScore: number; // NEW
}
```

#### Step 2: Update Backend Default
```javascript
// backend/routes/stats.js
const stats = db.get('stats').value() || {
  id: 1,
  totalWordsLearned: 0,
  currentStreak: 0,
  lastStudyDate: '',
  totalStudyDays: 0,
  averageScore: 0, // NEW
};
```

#### Step 3: Add to Progress UI
```typescript
// src/pages/progress/ProgressPage.tsx
<Card className="bg-teal-50 dark:bg-teal-900/10">
  <div className="text-4xl font-black text-teal-600">
    {stats?.averageScore ?? 0}%
  </div>
  <div className="text-sm">Average Score</div>
</Card>
```

#### Step 4: Update Calculation Logic
```typescript
// In module completion logic
const newAverageScore = calculateAverageScore(allScores);
updateStatsMutation.mutate({
  ...stats,
  averageScore: newAverageScore,
});
```

### Troubleshooting

#### Issue: Stats Not Updating
**Check**:
1. Is `useAddLessonProgressMutation()` being called in module detail pages?
2. Is React Query cache being invalidated after mutations?
3. Check browser console for API errors

#### Issue: Heatmap Not Showing Data
**Check**:
1. Are `studyLog` entries being created? Check `GET /studyLog`
2. Is date format correct? Must be `YYYY-MM-DD`
3. Check `HeatmapCalendar` component props

#### Issue: Mastered Words Count Negative
**Fix**: Use `Math.max(0, ...)` to prevent negative numbers
```typescript
const masteredWords = Math.max(0, (stats?.totalWordsLearned ?? 0) - totalWordsActive);
```

### Testing Progress Module

#### Manual Testing Checklist
- [ ] Complete a vocabulary lesson → Check if count increases
- [ ] Complete a grammar lesson → Check if count increases
- [ ] Complete a reading lesson → Check if count increases
- [ ] Complete a listening lesson → Check if count increases
- [ ] Study on consecutive days → Check if streak increases
- [ ] Review words → Check if retention levels update
- [ ] Check heatmap shows correct activity
- [ ] Test dark mode toggle
- [ ] Test responsive layout on mobile

#### Test Data
To populate test data, complete lessons in each module or manually add to `user_db.json`:

```json
{
  "lessonProgress": [
    {
      "id": "a1-grammar-1",
      "type": "grammar",
      "completedAt": "2026-04-13T10:00:00.000Z"
    },
    {
      "id": "a1-listening-1",
      "type": "listening",
      "completedAt": "2026-04-13T11:00:00.000Z"
    }
  ],
  "studyLog": [
    {
      "id": "2026-04-13",
      "date": "2026-04-13",
      "wordsLearned": 15,
      "wordsReviewed": 8
    }
  ]
}
```

---

## ➕ Adding New Features

### Adding a New Module (e.g., "Speaking")

#### 1. Create Data Structure
```bash
mkdir -p backend/data/speaking/{a1,a2,b1,b2,c1}
```

Create JSON files following this structure:
```json
{
  "id": "a1-speaking-1",
  "title": "Lesson Title",
  "level": "a1",
  "topic": "Topic Name",
  "exercises": [...]
}
```

#### 2. Add TypeScript Types
**File**: `src/types/index.ts`
```typescript
export interface SpeakingExercise {
  id: string;
  prompt: string;
  // ... other fields
}

export interface SpeakingLesson {
  id: string;
  slug: string;
  level: string;
  title: string;
  topic: string;
  exercises: SpeakingExercise[];
}
```

#### 3. Add Backend Loader
**File**: `backend/db/contentDb.js`
```javascript
let _speaking = null;

function loadSpeaking() {
  if (_speaking) return _speaking;
  let id = 1;
  _speaking = LEVELS.flatMap(level => {
    const files = readJsonFiles(path.join(SPEAKING_DIR, level));
    return files.map(({ file, content }) => ({
      id:        id++,
      slug:      content.id || `${level}-${file}`,
      level:     content.level || level,
      title:     content.title || file,
      topic:     content.topic || '',
      exercises: content.exercises || [],
    }));
  });
  return _speaking;
}

export { loadLessons, loadGrammar, loadReading, loadListening, loadSpeaking };
```

#### 4. Add Backend Route
**File**: `backend/routes/speaking.js`
```javascript
import { Router } from 'express';
import { loadSpeaking } from '../db/contentDb.js';

const router = Router();

router.get('/', (req, res) => {
  let speaking = loadSpeaking();
  if (req.query.level) speaking = speaking.filter(s => s.level === req.query.level);
  res.setHeader('X-Total-Count', speaking.length);
  res.json(speaking);
});

router.get('/:id', (req, res) => {
  const speaking = loadSpeaking();
  const item = speaking.find(s => String(s.id) === req.params.id || s.slug === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export default router;
```

**Register in**: `backend/server.js`
```javascript
import speakingRouter from './routes/speaking.js';
app.use('/speaking', speakingRouter);
```

#### 5. Add API Client
**File**: `src/services/api.ts`
```typescript
import { SpeakingLesson } from '../types';

export const api = {
  // ... existing methods
  getSpeakingLessonsByLevel: (level: string) =>
    http.get<SpeakingLesson[]>(`/speaking?level=${level}`).then((r) => r.data),
  getSpeakingLessonById: (id: string) =>
    http.get<SpeakingLesson>(`/speaking/${id}`).then((r) => r.data),
};
```

#### 6. Add Query Keys
**File**: `src/hooks/queryKeys.ts`
```typescript
export const queryKeys = {
  // ... existing keys
  speaking: {
    all: () => ['speaking'] as const,
    byLevel: (level: string) => ['speaking', 'level', level] as const,
    detail: (id: string) => ['speaking', 'detail', id] as const,
  },
};
```

#### 7. Add React Query Hooks
**File**: `src/hooks/useApi.ts`
```typescript
export const useSpeakingLessons = (level?: string) =>
  useQuery({
    queryKey: level ? queryKeys.speaking.byLevel(level) : queryKeys.speaking.all(),
    queryFn: () => level ? api.getSpeakingLessonsByLevel(level) : api.getSpeakingLessonsByLevel(''),
  });

export const useSpeakingLesson = (id: string) =>
  useQuery({
    queryKey: queryKeys.speaking.detail(id),
    queryFn: () => api.getSpeakingLessonById(id),
    enabled: !!id,
  });
```

#### 8. Create Detail Component
**File**: `src/pages/speaking/SpeakingDetail.tsx`
```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { useSpeakingLesson } from '../../hooks/useApi';

export const SpeakingDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { data: lesson, isLoading } = useSpeakingLesson(lessonId!);

  if (isLoading || !lesson) return <div>Loading...</div>;

  return (
    <div>
      <h1>{lesson.title}</h1>
      {/* Implement lesson UI */}
    </div>
  );
};
```

#### 9. Add Routes
**File**: `src/App.tsx`
```typescript
import { SpeakingDetail } from './pages/speaking/SpeakingDetail';

<Route path="/speaking" element={<LevelSelector moduleType="speaking" title="Speaking" description="Practice speaking skills." />} />
<Route path="/speaking/:level" element={<LessonSelector moduleType="speaking" />} />
<Route path="/speaking/:level/:lessonId" element={<SpeakingDetail />} />
```

#### 10. Update Shared Components
**File**: `src/components/common/LevelSelector.tsx`
```typescript
interface LevelSelectorProps {
  moduleType: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking';
  // ...
}
```

**File**: `src/components/common/LessonSelector.tsx`
```typescript
const MODULE_CONFIG = {
  // ... existing configs
  speaking: {
    hook: useSpeakingLessons,
    backPath: '/speaking',
    title: 'Speaking Lessons',
    icons: [...],
    bgColors: [...],
  },
};
```

#### 11. Add to Sidebar
**File**: `src/components/layout/Sidebar.tsx`
```typescript
import { Mic } from 'lucide-react';

const navItems = [
  // ... existing items
  { to: '/speaking', icon: <Mic className="w-5 h-5" />, label: 'Speaking' },
];
```

#### 12. Add to Progress Tracking
**File**: `src/types/index.ts`
```typescript
export interface LessonProgress {
  id: string;
  type: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking';
  completedAt: string;
}
```

**File**: `src/pages/progress/ProgressPage.tsx`
```typescript
import { Mic } from 'lucide-react';

const completedSpeaking = lessons.filter((l) => l.type === 'speaking').length;

// Add to UI
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-pink-100 dark:bg-pink-900/40 text-pink-600 rounded-lg">
      <Mic className="w-5 h-5" />
    </div>
    <span className="font-bold text-lg">Speaking</span>
  </div>
  <span className="text-2xl font-black">{completedSpeaking}</span>
</div>
```

#### 13. Add to Dashboard
**File**: `src/pages/Dashboard.tsx`
```typescript
const completedSpeaking = lessonProgress.filter((l) => l.type === 'speaking').length;

// Add button
<button onClick={() => navigate('/speaking')} className="...">
  <Mic className="w-6 h-6 text-pink-500" />
  <div>
    <div className="font-bold">Speaking</div>
    <div className="text-xs text-gray-500">{completedSpeaking} completed</div>
  </div>
</button>
```

---

## 🔧 Common Tasks

### Task 1: Update TypeScript Interface to Match JSON

**Problem**: Interface has fields that don't exist in JSON files

**Solution**:
1. Check actual JSON structure: `backend/data/{module}/{level}/*.json`
2. Update interface in `src/types/index.ts`
3. Update backend loader in `backend/db/contentDb.js`
4. Update components that use the removed fields

**Example**:
```typescript
// ❌ Before (has description field not in JSON)
export interface ListeningLesson {
  description: string; // Not in JSON!
}

// ✅ After (matches JSON)
export interface ListeningLesson {
  // description removed
}
```

### Task 2: Add New Field to Existing Module

**Steps**:
1. Add field to JSON files in `backend/data/{module}/`
2. Update TypeScript interface in `src/types/index.ts`
3. Update backend loader in `backend/db/contentDb.js`
4. Update components to display/use the new field

### Task 3: Add Progress Tracking to New Module

**Files to Update**:
1. `src/types/index.ts` - Add module type to `LessonProgress.type`
2. `src/pages/progress/ProgressPage.tsx` - Add counter and UI
3. `src/pages/Dashboard.tsx` - Add counter and display
4. Module detail page - Call `useAddLessonProgressMutation()` on completion

### Task 4: Fix API Endpoint

**Common Issues**:
- Route not registered in `backend/server.js`
- Loader function not exported from `backend/db/contentDb.js`
- API client function missing in `src/services/api.ts`
- React Query hook missing in `src/hooks/useApi.ts`

**Debug Checklist**:
```
✓ JSON files exist in backend/data/
✓ Loader function in contentDb.js
✓ Route file in backend/routes/
✓ Route registered in server.js
✓ API function in src/services/api.ts
✓ Query key in src/hooks/queryKeys.ts
✓ React Query hook in src/hooks/useApi.ts
✓ Component uses the hook
```

### Task 5: Add Keyboard Shortcut

**Location**: Component file (e.g., `ListeningDetail.tsx`)

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      handlePlayAudio();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handlePlayAudio]);
```

### Task 6: Add Sound Effect

**File**: `src/services/sounds.ts`

```typescript
export const sounds = {
  correct: () => new Audio('/sounds/correct.mp3').play().catch(() => {}),
  incorrect: () => new Audio('/sounds/incorrect.mp3').play().catch(() => {}),
  // Add new sound
  newSound: () => new Audio('/sounds/new.mp3').play().catch(() => {}),
};
```

### Task 7: Update Sidebar Navigation

**File**: `src/components/layout/Sidebar.tsx`

```typescript
import { NewIcon } from 'lucide-react';

const navItems = [
  // ... existing items
  { to: '/new-route', icon: <NewIcon className="w-5 h-5" />, label: 'New Feature' },
];
```

---

## 🧪 Testing

### Test Structure

Tests are located in `backend/__tests__/routes/` and follow the pattern:
- One test file per route
- Use Vitest as test runner
- Use Supertest for HTTP testing
- Mock external dependencies

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- listening.test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Configuration

**File**: `vitest.config.js`

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['backend/__tests__/**/*.test.js', 'src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.storybook'],
  },
});
```

### Writing Tests for New Modules

**Example**: Testing a new route

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import myRouter from '../../routes/myRoute.js';

// Mock dependencies
vi.mock('../../db/contentDb.js', () => ({
  loadMyData: vi.fn(),
}));

import { loadMyData } from '../../db/contentDb.js';

const app = express();
app.use(express.json());
app.use('/myroute', myRouter);

describe('My Router', () => {
  const mockData = [
    { id: 1, name: 'Test 1' },
    { id: 2, name: 'Test 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    loadMyData.mockReturnValue(mockData);
  });

  describe('GET /myroute', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/myroute');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should filter by query param', async () => {
      const response = await request(app).get('/myroute?level=a1');

      expect(response.status).toBe(200);
      // Add assertions
    });
  });

  describe('GET /myroute/:id', () => {
    it('should return item by id', async () => {
      const response = await request(app).get('/myroute/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('should return 404 when not found', async () => {
      const response = await request(app).get('/myroute/999');

      expect(response.status).toBe(404);
    });
  });
});
```

### Test Coverage

Test files should cover:
- ✅ Happy path scenarios
- ✅ Error cases (404, 400, etc.)
- ✅ Edge cases (empty data, malformed input)
- ✅ Data integrity (required fields, types)
- ✅ HTTP headers (Content-Type, X-Total-Count)
- ✅ Query parameter filtering
- ✅ Performance (large datasets, concurrent requests)

### Listening Module Tests

**File**: `backend/__tests__/routes/listening.test.js`

**Coverage**: 26 test cases covering:
- GET /listening (all lessons, filtered by level)
- GET /listening/:id (by numeric id, by slug)
- Edge cases (empty data, malformed params, case sensitivity)
- Data integrity (required fields, question structure)
- Performance (large datasets, concurrent requests)
- HTTP headers (X-Total-Count, Content-Type)

**Run listening tests**:
```bash
npm test -- listening.test
```

---

## 🏛 Clean Architecture

### Overview

This project follows a **pragmatic approach** to Clean Architecture, balancing:
- ✅ Maintainability and testability
- ✅ Rapid development speed
- ⚠️ Some architectural compromises for simplicity

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│              Presentation Layer (React)                  │
│  Components, Pages, JSX, UI Logic                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Application Layer (React Query Hooks)            │
│  useApi hooks, Query keys, Cache management              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Domain Layer (TypeScript)                   │
│  Interfaces, Types, Business entities                    │
└─────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────┐
│         Infrastructure Layer (API/Backend)               │
│  API clients, Express routes, Database access            │
└─────────────────────────────────────────────────────────┘
```

### Current State

**Strengths** ✅:
- Clear layer separation (frontend/backend)
- Consistent patterns across modules
- Type safety with TypeScript
- Proper use of React Query for data management
- Components don't directly access database

**Weaknesses** ⚠️:
- Business logic mixed in UI components
- Anemic domain models (no behavior)
- Missing service layer on backend
- Direct dependencies on external libraries (confetti, sounds)
- No repository pattern

### Detailed Analysis

See `CLEAN_ARCHITECTURE_ANALYSIS.md` for:
- Detailed violation analysis
- Code examples of issues
- Refactoring recommendations
- Priority-based improvement plan
- Testability improvements

### Recommendations

**High Priority**:
1. Extract business logic from components into custom hooks
2. Add behavior to domain models (methods, validation)
3. Create utility services for text processing

**Medium Priority**:
1. Add backend service layer
2. Create abstraction for external libraries (feedback service)

**Low Priority**:
1. Implement repository pattern
2. Add use case layer for complex workflows

### When to Refactor

The current architecture is **good enough** for:
- ✅ Small to medium projects
- ✅ Rapid prototyping
- ✅ Teams of 1-3 developers

Consider refactoring when:
- ❌ Adding complex business logic
- ❌ Scaling to larger team (5+ developers)
- ❌ Need extensive unit testing
- ❌ Multiple UI platforms (web + mobile)

---

## 📝 Important Notes

### Data Consistency Rules

1. **TypeScript interfaces MUST match JSON structure exactly**
   - No optional fields unless they truly are optional in JSON
   - No extra fields that don't exist in JSON
   - Field types must match JSON value types

2. **Backend loaders should only map existing JSON fields**
   - Don't add default values for missing fields (unless necessary)
   - Use `content.field || ''` for truly optional fields

3. **Module types are strictly typed**
   - `'vocabulary' | 'grammar' | 'reading' | 'listening'`
   - Update all type unions when adding new modules

### File Naming Conventions

- **Components**: PascalCase (e.g., `LessonSelector.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useApi.ts`)
- **Services**: camelCase (e.g., `api.ts`)
- **Routes**: kebab-case (e.g., `lesson-progress.js`)
- **Data files**: kebab-case (e.g., `a1-listening-1.json`)

### Code Style

- **Imports**: Group by external → internal → relative
- **TypeScript**: Use interfaces for data shapes, types for unions
- **React**: Functional components with hooks
- **Async**: Use async/await, not .then() chains (except in api.ts)

### Performance Considerations

- **Backend**: Content is cached in memory (resets on server restart)
- **Frontend**: React Query caches API responses
- **Images**: Use lazy loading for large lists
- **Data**: Paginate if lists exceed 100 items

---

## 🚀 Quick Reference

### Start Development
```bash
# Backend
cd backend && npm run dev

# Frontend
npm run dev
```

### Key Files for Common Changes

| Task | Files to Modify |
|------|----------------|
| Add new module | `types/index.ts`, `contentDb.js`, `routes/*.js`, `server.js`, `api.ts`, `queryKeys.ts`, `useApi.ts`, `App.tsx` |
| Update interface | `types/index.ts`, `contentDb.js`, components using the type |
| Add progress tracking | `ProgressPage.tsx`, `Dashboard.tsx`, detail page |
| Add navigation item | `Sidebar.tsx`, `App.tsx` |
| Fix API issue | `contentDb.js`, `routes/*.js`, `server.js`, `api.ts`, `useApi.ts` |

### Module Checklist

When adding/modifying a module, ensure:
- [ ] JSON data files exist and are valid
- [ ] TypeScript interface matches JSON structure
- [ ] Backend loader function exists and is exported
- [ ] Backend route exists and is registered
- [ ] API client functions exist
- [ ] Query keys are defined
- [ ] React Query hooks exist
- [ ] Routes are configured in App.tsx
- [ ] Sidebar navigation is updated
- [ ] Progress tracking is implemented
- [ ] Dashboard shows module stats

---

## 📚 Additional Resources

- **React Query Docs**: https://tanstack.com/query/latest
- **React Router Docs**: https://reactrouter.com/
- **Tailwind CSS Docs**: https://tailwindcss.com/
- **Lucide Icons**: https://lucide.dev/

---

**Last Updated**: 2026-04-13  
**Version**: 1.0.0
