import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  useWordProgressAll,
  useDeleteWordProgressMutation,
  useUpdateWordProgressMutation,
  useFinishDailyReviewMutation,
} from '../../hooks/useApi';
import { WordProgress } from '../../types';
import { calculateNextReview } from '../../services/spacedRepetition';
import { CheckSquare, ArrowRight, Sparkles, Star, ArrowLeft } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { useKeyboard } from '../../hooks/useKeyboard';
import { sounds } from '../../services/sounds';
import { shuffleArray } from '../../utils/array';
import { LessonMeaning } from '../../components/vocabulary/LessonMeaning';
import { PageDetail } from '../../components/layout/PageDetailContainer';

export const DailyReview: React.FC = () => {
  const navigate = useNavigate();
  const { data: progress = [], isLoading } = useWordProgressAll();

  // Derive due words directly — no state needed
  const dueWords = React.useMemo(() => {
    if (isLoading) return [];
    const today = new Date().toISOString().split('T')[0];
    return progress.filter((p) => p.nextReview <= today).sort((a, b) => a.level - b.level);
  }, [progress, isLoading]);

  // isCompleted is the only flag we need beyond loading
  const [isCompleted, setIsCompleted] = useState(false);
  const finishMutation = useFinishDailyReviewMutation();

  const handleComplete = async () => {
    try {
      await finishMutation.mutateAsync({ reviewedCount: dueWords.length });
      setIsCompleted(true);
    } catch (e) {
      console.error('Failed to finish review stats', e);
      setIsCompleted(true); // Still show success screen
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#f4f4f0] dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <PageDetail>
      <div className="flex-1 flex flex-col justify-center w-full mx-auto relative">
        {/* No words due today */}
        {!isCompleted && dueWords.length === 0 && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-black bg-blue-300 dark:bg-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
              <CheckSquare className="w-16 h-16 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-4">
                ALL CAUGHT UP!
              </h1>
              <p className="text-lg md:text-xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                No Reviews Pending
              </p>
            </div>
            <div className="pt-8 w-full max-w-sm">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-3 bg-black text-white dark:bg-white dark:text-black py-3 px-6 md:py-4 md:px-8 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0 active:shadow-none transition-all"
              >
                Return Home <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 rotate-180 stroke-3" />
              </button>
            </div>
          </div>
        )}

        {/* Review engine */}
        {!isCompleted && dueWords.length > 0 && (
          <DailyReviewEngine words={dueWords} onComplete={handleComplete} />
        )}

        {/* Mission clear */}
        {isCompleted && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-black bg-lime-300 dark:bg-lime-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 animate-bounce">
              <Star className="w-16 h-16 fill-black text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-4">
                MISSION CLEAR!
              </h1>
              <p className="text-lg md:text-xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Defeated {dueWords.length} words
              </p>
            </div>
            <div className="pt-8 w-full max-w-sm">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-3 bg-black text-lime-400 dark:bg-white dark:text-black py-3 px-6 md:py-4 md:px-8 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0 active:shadow-none transition-all"
              >
                Return Home <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 rotate-180 stroke-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageDetail>
  );
};

// ── Engine ─────────────────────────────────────────────────────────────────
const DailyReviewEngine: React.FC<{ words: WordProgress[]; onComplete: () => void }> = ({
  words,
  onComplete,
}) => {
  const [queue, setQueue] = useState<WordProgress[]>(() => shuffleArray([...words]));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(false);

  const { speak } = useTTS();
  const deleteWordProgress = useDeleteWordProgressMutation();
  const updateWordProgress = useUpdateWordProgressMutation();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentWord = queue[currentIndex];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex, showError]);

  const handleMastered = () => {
    if (!currentWord) return;
    sounds.correct();
    // Confetti for mastering a word early
    confetti({
      particleCount: 50,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#000000', '#bef264', '#fde047', '#f87171'],
    });
    deleteWordProgress.mutate(currentWord.id);
    advance();
  };

  const advance = () => {
    setShowError(false);
    setInputValue('');
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#bef264', '#fde047', '#f87171'],
      });
      onComplete();
    }
  };

  const handleSubmit = () => {
    if (!currentWord || showError || !inputValue.trim()) return;

    const isCorrect = inputValue.trim().toLowerCase() === currentWord.term.toLowerCase();

    if (isCorrect) {
      sounds.correct();
      speak(currentWord.term);

      const { newLevel, nextReviewDate } = calculateNextReview(currentWord.level, true);

      if (newLevel === 5) {
        deleteWordProgress.mutate(currentWord.id);
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#000000', '#bef264', '#fde047', '#f87171'],
        });
      } else {
        updateWordProgress.mutate({
          ...currentWord,
          level: newLevel,
          nextReview: nextReviewDate,
          correctCount: currentWord.correctCount + 1,
          lastStudied: new Date().toISOString().split('T')[0],
        });
      }

      advance();
    } else {
      sounds.incorrect();
      setShowError(true);
      speak(currentWord.term);

      const { newLevel, nextReviewDate } = calculateNextReview(currentWord.level, false);

      // Re-insert word randomly in the remaining queue
      const remaining = queue.length - currentIndex;
      if (remaining > 1) {
        setQueue((prev) => {
          const insertAt = currentIndex + 1 + Math.floor(Math.random() * (remaining - 1));
          const next = [...prev];
          next.splice(insertAt, 0, currentWord);
          return next;
        });
      }

      updateWordProgress.mutate({
        ...currentWord,
        level: newLevel,
        nextReview: nextReviewDate,
        incorrectCount: currentWord.incorrectCount + 1,
        lastStudied: new Date().toISOString().split('T')[0],
      });
    }
  };

  useKeyboard({
    '3': (e) => {
      e.preventDefault();
      handleMastered();
    },
    Enter: (e) => {
      e.preventDefault();
      if (showError) advance();
      else handleSubmit();
    },
  });

  if (!currentWord) return null;

  return (
    <div className="w-full max-w-md mx-auto relative flex flex-col items-center justify-center px-4 py-6 bg-white dark:bg-gray-800 rounded-3xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] text-center transition-all duration-300">
      <div className="text-black dark:text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 bg-yellow-300 dark:bg-yellow-600 px-4 py-3 rounded-xl border-2 border-black transform -skew-x-12 absolute -top-6">
        <Sparkles className="w-5 h-5" /> DAILY REVIEW: LVL {currentWord.level}
      </div>
      <div className="mb-4 ml-auto text-xs font-black text-black bg-white dark:bg-gray-400 px-3 py-1 rounded-full border-2 border-black tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        STAGE {currentIndex + 1} / {queue.length}
      </div>

      <LessonMeaning term={currentWord.term} lessonId={currentWord.lessonId} />

      {showError ? (
        <div className="w-full mt-8 flex flex-col items-center animate-in zoom-in duration-200">
          <div className="text-red-500 font-black text-2xl uppercase tracking-wide mb-2">
            Incorrect!
          </div>
          <div className="text-5xl font-black lowercase mb-8 text-black dark:text-white">
            {currentWord.term}
          </div>
          <button
            onClick={advance}
            className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-2 px-4 rounded-xl font-black text-xl uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0 active:shadow-none transition-all"
          >
            Got it <ArrowRight className="w-6 h-6 stroke-3" />
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
            className="w-full text-center text-3xl font-black py-3 px-3 bg-gray-100 dark:bg-gray-900 border-4 border-black dark:border-white rounded-2xl outline-none focus:bg-yellow-100 dark:focus:bg-yellow-900 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all lowercase mb-6"
            autoComplete="off"
            spellCheck="false"
          />
          <div className="flex gap-3 w-full">
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white dark:bg-blue-400 dark:text-black py-3 px-4 rounded-2xl font-black text-xl uppercase tracking-wider border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
            >
              SUBMIT
            </button>
            <button
              onClick={handleMastered}
              title="I already mastered this word (Keyboard: 3)"
              className="px-6 bg-green-400 dark:bg-green-600 text-black dark:text-white rounded-2xl font-black border-4 border-black dark:border-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-none transition-all"
            >
              PRO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
