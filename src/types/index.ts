export interface VocabWord {
  term: string;
  meaning: string;
  full_sentence: string;
  modifiers: string;
}

export interface Lesson {
  id: string; // e.g. "a1/people-family"
  slug: string;
  level: string; // "a1", "a2", "b1", "b2", "c1"
  name: string;
  words?: VocabWord[];
}

export interface WordProgress {
  id: string; // e.g. "a1/people-family/father"
  term: string;
  lessonId: string;
  level: 1 | 2 | 3 | 4 | 5;
  lastStudied: string; // ISO Date
  nextReview: string; // ISO Date
  correctCount: number;
  incorrectCount: number;
}

export interface GrammarStructure {
  name: string;
  formula: string;
  example: string;
}

export interface GrammarQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface GrammarLesson {
  id: string;
  slug: string;
  level: string;
  title: string;
  description: string;
  theory?: string;
  structures?: GrammarStructure[];
  tips?: string[];
  practice?: GrammarQuestion[];
}

export interface ReadingQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface VocabHighlight {
  word: string;
  meaning: string;
}

export interface ListeningQuestion {
  id: string;
  sentence: string;
}

export interface ListeningLesson {
  id: string;
  slug: string;
  level: string;
  title: string;
  topic: string;
  questions?: ListeningQuestion[];
}

export interface ReadingLesson {
  id: string;
  slug: string;
  level: string;
  title: string;
  topic: string;
  content?: string;
  vocabulary_highlights?: VocabHighlight[];
  questions?: ReadingQuestion[];
  translation?: string;
}

export interface LessonProgress {
  id: string;
  type: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  completedAt: string; // ISO Date
}

export interface SessionProgress {
  id: string;
  currentIndex: number;
  lastUpdated: string;
  continueQueueTerms?: string[];
  rememberedTerms?: string[];
}

export interface StudyLog {
  id: string; // YYYY-MM-DD
  date: string;
  wordsLearned: number;
  wordsReviewed: number;
}

export interface AppStats {
  id: 1;
  totalWordsLearned: number;
  currentStreak: number;
  lastStudyDate: string;
  totalStudyDays: number;
}

export interface AppSettings {
  id: 1;
  dailyGoal: number;
  theme: 'light' | 'dark';
  soundEnabled?: boolean;
}

export interface ReviewResult {
  term: string;
  lessonId: string;
  isCorrect: boolean;
  isGeneralReview: boolean;
}