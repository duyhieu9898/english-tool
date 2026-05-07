import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LazyMotion, domMax } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';

// Lazy load components
const LevelSelector = lazy(() => import('./components/common/LevelSelector').then(m => ({ default: m.LevelSelector })));
const LessonSelector = lazy(() => import('./components/common/LessonSelector').then(m => ({ default: m.LessonSelector })));
const VocabSession = lazy(() => import('./pages/vocabulary/VocabSession').then(m => ({ default: m.VocabSession })));
const GrammarDetail = lazy(() => import('./pages/grammar/GrammarDetail').then(m => ({ default: m.GrammarDetail })));
const ReadingDetail = lazy(() => import('./pages/reading/ReadingDetail').then(m => ({ default: m.ReadingDetail })));
const ListeningDetail = lazy(() => import('./pages/listening/ListeningDetail').then(m => ({ default: m.ListeningDetail })));
const DailyReview = lazy(() => import('./pages/review/DailyReview').then(m => ({ default: m.DailyReview })));
const GeneralReview = lazy(() => import('./pages/review/GeneralReview').then(m => ({ default: m.GeneralReview })));
const ProgressPage = lazy(() => import('./pages/progress/ProgressPage').then(m => ({ default: m.ProgressPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SearchVocab = lazy(() => import('./pages/search/SearchVocab').then(m => ({ default: m.SearchVocab })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <LazyMotion features={domMax} strict>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />

              <Route path="/vocabulary" element={<LevelSelector moduleType="vocabulary" title="Vocabulary" description="Select your difficulty to start the vocabulary quest." />} />
              <Route path="/vocabulary/:level" element={<LessonSelector moduleType="vocabulary" />} />
              <Route path="/vocabulary/:level/:lessonId" element={<VocabSession />} />

              <Route path="/grammar" element={<LevelSelector moduleType="grammar" title="Grammar" description="Master English sentence structures, tenses, and rules." />} />
              <Route path="/grammar/:level" element={<LessonSelector moduleType="grammar" />} />
              <Route path="/grammar/:level/:lessonId" element={<GrammarDetail />} />

              <Route path="/reading" element={<LevelSelector moduleType="reading" title="Reading" description="Practice reading comprehension with leveled texts, translations, and quizzes." />} />
              <Route path="/reading/:level" element={<LessonSelector moduleType="reading" />} />
              <Route path="/reading/:level/:lessonId" element={<ReadingDetail />} />

              <Route path="/listening" element={<LevelSelector moduleType="listening" title="Listening" description="Sharpen your ears with dictation practice and audio comprehension." />} />
              <Route path="/listening/:level" element={<LessonSelector moduleType="listening" />} />
              <Route path="/listening/:level/:lessonId" element={<ListeningDetail />} />

              <Route path="/review" element={<DailyReview />} />
              <Route path="/review/general" element={<GeneralReview />} />

              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/search" element={<SearchVocab />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LazyMotion>
  );
}

export default App;
