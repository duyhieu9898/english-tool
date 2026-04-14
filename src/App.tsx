import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';

import { LevelSelector } from './components/common/LevelSelector';
import { LessonSelector } from './components/common/LessonSelector';
import { VocabSession } from './pages/vocabulary/VocabSession';

import { GrammarDetail } from './pages/grammar/GrammarDetail';

import { ReadingDetail } from './pages/reading/ReadingDetail';
import { ListeningDetail } from './pages/listening/ListeningDetail';

import { DailyReview } from './pages/review/DailyReview';
import { GeneralReview } from './pages/review/GeneralReview';

import { ProgressPage } from './pages/progress/ProgressPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SearchVocab } from './pages/search/SearchVocab';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
