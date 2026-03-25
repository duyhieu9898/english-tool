import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  useLessonProgressAll,
  useLessons,
  useWordProgressAll,
  useFinishSessionMutation,
} from '@/hooks/useApi';
import { VocabWord, ReviewResult } from '@/types';
import { Layers, ArrowRight, ArrowLeft, Star, Sparkles } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useKeyboard } from '@/hooks/useKeyboard';
import { sounds } from '@/services/sounds';
import { shuffleArray } from '@/utils/array';
import { LessonMeaning } from '@/components/vocabulary/LessonMeaning';
import { PageDetail } from '@/components/layout/PageDetailContainer';
import { Badge } from '@/components/ui/Badge';

type SessionState = 'LOADING' | 'EMPTY' | 'REVIEWING' | 'COMPLETED';

export const GeneralReview: React.FC = () => {
  const navigate = useNavigate();

  const { data: lessonProgress = [], isLoading: isLoadingProgress } = useLessonProgressAll();
  const { data: allLessons = [], isLoading: isLoadingLessons } = useLessons();
  const { data: wordProgress = [], isLoading: isLoadingWordProg } = useWordProgressAll();
  console.log('allLessons', allLessons);
  const isLoading = isLoadingProgress || isLoadingLessons || isLoadingWordProg;

  // Derive the queue once all data is ready
  const initialQueue = useMemo(() => {
    if (isLoading) return [];

    const completedVocabIds = new Set(
      lessonProgress.filter((lp) => lp.type === 'vocabulary').map((lp) => lp.id),
    );
    if (completedVocabIds.size === 0) return [];

    const activeTerms = new Set(wordProgress.map((wp) => wp.term.toLowerCase()));
    const termMap = new Map<string, VocabWord & { lessonId: string }>();
    allLessons.forEach((lesson) => {
      if (!completedVocabIds.has(lesson.id.toString())) return;
      lesson.words.forEach((w) => {
        const lowerTerm = w.term.toLowerCase();
        if (!activeTerms.has(lowerTerm)) {
          if (!termMap.has(lowerTerm)) {
            termMap.set(lowerTerm, { ...w, lessonId: lesson.id });
          }
        }
      });
    });

    const pool = Array.from(termMap.values());
    return shuffleArray(pool).slice(0, 20);
  }, [isLoading, lessonProgress, allLessons, wordProgress]);

  // Derive session state — only COMPLETING requires explicit user action
  const [isCompleted, setIsCompleted] = useState(false);

  const sessionState: SessionState = isLoading
    ? 'LOADING'
    : isCompleted
      ? 'COMPLETED'
      : initialQueue.length === 0
        ? 'EMPTY'
        : 'REVIEWING';

  const [remembered, setRemembered] = useState<{ term: string; meaning: string }[]>([]);
  const [forgotten, setForgotten] = useState<{ term: string; meaning: string; lesson: string }[]>(
    [],
  );
  const finishMutation = useFinishSessionMutation();

  const handleComplete = async (reviews: ReviewResult[]) => {
    setIsCompleted(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await finishMutation.mutateAsync({
        clientDate: today,
        reviews,
      });
    } catch (e) {
      console.error('Failed to finish general review stats', e);
    }
  };

  if (sessionState === 'LOADING') {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#f4f4f0] dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <PageDetail>
      <div className="flex-1 flex flex-col justify-center w-full mx-auto relative">
        {/* No battle available */}
        {sessionState === 'EMPTY' && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-black bg-orange-300 dark:bg-orange-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
              <Layers className="w-16 h-16 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-4">
                NO ENEMIES!
              </h1>
              <p className="text-lg md:text-xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest max-w-md mx-auto">
                Complete more lessons or graduate words to level 5 to unlock general review battles.
              </p>
            </div>
            <div className="pt-8 w-full max-w-sm">
              <button
                onClick={() => navigate('/vocabulary')}
                className="w-full flex items-center justify-center gap-3 bg-black text-white dark:bg-white dark:text-black py-3 px-6 md:py-4 md:px-8 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0 active:shadow-none transition-all"
              >
                Learn Vocab <ArrowRight className="w-5 h-5 md:w-6 md:h-6 stroke-3" />
              </button>
            </div>
          </div>
        )}

        {/* Review engine */}
        {sessionState === 'REVIEWING' && (
          <GeneralReviewEngine
            queue={initialQueue}
            onRemembered={(w) => setRemembered((prev) => [...prev, w])}
            onForgotten={(w) => setForgotten((prev) => [...prev, w])}
            onComplete={handleComplete}
          />
        )}

        {/* Results */}
        {sessionState === 'COMPLETED' && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-black bg-lime-300 dark:bg-lime-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 animate-bounce">
              <Star className="w-16 h-16 fill-black text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-4">
                BATTLE COMPLETE!
              </h1>
              <p className="text-lg md:text-xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                General Review Results
              </p>
            </div>

            <div className="flex justify-center gap-6 mt-6 w-full max-w-lg">
              <div className="bg-lime-100 dark:bg-lime-900/40 p-6 rounded-3xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex-1 transform -rotate-3 hover:rotate-0 transition-transform">
                <span className="text-5xl font-black text-lime-600 dark:text-lime-400 block mb-2">
                  {remembered.length}
                </span>
                <span className="text-black dark:text-white font-black uppercase tracking-wider text-sm">
                  Rescued
                </span>
              </div>
              <div className="bg-red-100 dark:bg-red-900/40 p-6 rounded-3xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex-1 transform rotate-3 hover:rotate-0 transition-transform">
                <span className="text-5xl font-black text-red-500 dark:text-red-400 block mb-2">
                  {forgotten.length}
                </span>
                <span className="text-black dark:text-white font-black uppercase tracking-wider text-sm">
                  Fell Back
                </span>
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4 w-full max-w-lg">
              <button
                onClick={() => navigate('/')}
                className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-black dark:text-white py-3 px-6 md:py-4 md:px-6 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 stroke-3" /> Base
              </button>
            </div>
          </div>
        )}
      </div>
    </PageDetail>
  );
};

// ── Engine ─────────────────────────────────────────────────────────────────
const GeneralReviewEngine: React.FC<{
  queue: (VocabWord & { lessonId: string })[];
  onRemembered: (w: { term: string; meaning: string }) => void;
  onForgotten: (w: { term: string; meaning: string; lesson: string }) => void;
  onComplete: (r: ReviewResult[]) => void;
}> = ({ queue, onRemembered, onForgotten, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(false);

  const { speak } = useTTS();
  const reviewsRef = React.useRef<ReviewResult[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentWord = queue[currentIndex];

  React.useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex, showError]);

  const advance = () => {
    setShowError(false);
    setInputValue('');
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#000000', '#bef264', '#fde047', '#f87171'],
      });
      onComplete(reviewsRef.current);
    }
  };

  const handleSubmit = () => {
    if (!currentWord || showError || !inputValue.trim()) return;

    const isCorrect = inputValue.trim().toLowerCase() === currentWord.term.toLowerCase();

    if (isCorrect) {
      sounds.correct();
      speak(currentWord.term);
      onRemembered({ term: currentWord.term, meaning: currentWord.meaning });

      // Reward: If they kill the boss, start them at Level 2 for this word!
      reviewsRef.current.push({
        term: currentWord.term,
        lessonId: currentWord.lessonId,
        isCorrect: true,
        isBossBattle: true,
      });

      advance();
    } else {
      sounds.incorrect();
      setShowError(true);
      speak(currentWord.term);
      onForgotten({
        term: currentWord.term,
        meaning: currentWord.meaning,
        lesson: currentWord.lessonId,
      });
      reviewsRef.current.push({
        term: currentWord.term,
        lessonId: currentWord.lessonId,
        isCorrect: false,
        isBossBattle: true,
      });
    }
  };

  useKeyboard({
    Enter: (e) => {
      e.preventDefault();
      if (showError) advance();
      else handleSubmit();
    },
  });

  if (!currentWord) return null;

  return (
    <div className="w-full max-w-md mx-auto relative flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-3xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] text-center transition-all duration-300">
      <Badge className="ml-auto mb-4">
        STAGE {currentIndex + 1} / {queue.length}
      </Badge>

      <div className="text-black dark:text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 bg-orange-300 dark:bg-orange-600 px-4 py-2 rounded-xl border-2 border-black transform -skew-x-12 absolute -top-6">
        <Sparkles className="w-5 h-5" /> GENERAL REVIEW
      </div>

      <LessonMeaning term={currentWord.term} lessonId={currentWord.lessonId} />

      {showError ? (
        <div className="w-full mt-8 flex flex-col items-center animate-in zoom-in duration-200">
          <div className="text-red-500 font-black text-2xl uppercase tracking-wide mb-2">
            Defeated!
          </div>
          <div className="text-5xl font-black lowercase mb-4 text-black dark:text-white">
            {currentWord.term}
          </div>
          <div className="text-sm font-bold bg-black text-white px-3 py-1 rounded-md mb-8">
            Banished to Daily Review
          </div>
          <button
            onClick={advance}
            className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-4 px-6 rounded-xl font-black text-xl uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0 active:shadow-none transition-all"
          >
            Continue <ArrowRight className="w-6 h-6 stroke-3" />
          </button>
        </div>
      ) : (
        <div className="w-full mt-8 flex flex-col items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter word"
            className="w-full text-center text-3xl font-black py-3 px-3 bg-gray-100 dark:bg-gray-900 border-4 border-black dark:border-white rounded-2xl outline-none focus:bg-orange-100 dark:focus:bg-orange-900/50 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all lowercase mb-6"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      )}
    </div>
  );
};
