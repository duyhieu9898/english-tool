import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  useLesson,
  useSessionProgress,
  useSaveSessionProgressMutation,
  useFinishVocabSessionMutation,
} from '../../hooks/useApi';
import type { VocabWord } from '../../types';
import { FlashCard } from '../../components/flashcard/FlashCard';
import { BatchReview } from '../../components/flashcard/BatchReview';
import { ArrowLeft, Flag, Star } from 'lucide-react';
import { PageDetail } from '../../components/layout/PageDetailContainer';
import { Button } from '../../components/ui/Button';
import { log } from '../../services/activityLogger';

type SessionState = 'LOADING' | 'FLASHCARDS' | 'REVIEW' | 'COMPLETED';

export const VocabSession: React.FC = () => {
  const { level, lessonId } = useParams<{ level: string; lessonId: string }>();;

  const navigate = useNavigate();

  const {
    data: lesson,
    isSuccess: lessonLoaded,
    error: lessonError,
  } = useLesson(lessonId || '', { consolidate: true });
  const { data: sessionProgress, isSuccess: progressLoaded } = useSessionProgress(lessonId || '');

  const saveProgress = useSaveSessionProgressMutation();
  const finishMutation = useFinishVocabSessionMutation();

  const [sessionState, setSessionState] = useState<SessionState>('LOADING');
  const [currentIndex, setCurrentIndex] = useState(0);
  const initialIndexRef = useRef<number | null>(null);
  const [continueQueue, setContinueQueue] = useState<VocabWord[]>([]);
  // Ref mirrors continueQueue so finishSession always gets a non-stale snapshot
  const continueQueueRef = React.useRef<VocabWord[]>([]);

  // ── Initial load ──────────────────────────────────────────────────────────
  // fetchLesson / fetchSessionProgress are stable references from useQueryClient — safe to omit
  useEffect(() => {
    if (sessionState !== 'LOADING') return;

    if (lessonError) {
      console.error(lessonError);
      navigate('/vocabulary');
      return;
    }

    if (lessonLoaded && progressLoaded && lesson) {
      // 1. Log lesson loaded
      log({
        fn: 'lesson:loaded',
        lesson: lessonId,
        detail: `words=${lesson.words.length}`,
      });

      // 2. Terminate if lesson is empty
      if (lesson.words.length === 0) {
        setSessionState('COMPLETED');
        return;
      }

      // 3. Set progress
      if (sessionProgress) {
        log({
          fn: 'session:resume',
          lesson: lessonId,
          detail: `fromIndex=${sessionProgress.currentIndex}`,
        });
        const resumeIndex = Math.min(sessionProgress.currentIndex, lesson.words.length - 1);
        setCurrentIndex(resumeIndex);
        initialIndexRef.current = resumeIndex;
      } else {
        log({ fn: 'session:new', lesson: lessonId });
        setCurrentIndex(0);
        initialIndexRef.current = 0;
      }

      // 4. Start session
      setSessionState('FLASHCARDS');
    }
  }, [
    lessonLoaded,
    progressLoaded,
    lesson,
    sessionProgress,
    lessonId,
    navigate,
    lessonError,
    sessionState,
  ]);

  // ── Auto-save checkpoint whenever currentIndex advances ───────────────────
  useEffect(() => {
    // Skip if not study mode or if index hasn't actually advanced beyond initial state
    if (
      sessionState !== 'FLASHCARDS' ||
      !lessonId ||
      initialIndexRef.current === null ||
      currentIndex <= initialIndexRef.current
    ) {
      return;
    }

    saveProgress.mutate({ id: lessonId, currentIndex, lastUpdated: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- saveProgress.mutate is stable (useMutation)
  }, [currentIndex, sessionState, lessonId]);

  const rememberedWordsRef = useRef<VocabWord[]>([]);

  // ── Flashcard navigation ───────────────────────────────────────────────────
  const handleKnown = () => {
    const word = lesson?.words[currentIndex];
    if (word) {
      rememberedWordsRef.current.push(word);
      log({ fn: 'handleKnown', lesson: lessonId, detail: word.term });
    }
    advanceFlashcard();
  };

  const handleContinue = () => {
    log({ fn: 'handleContinue', lesson: lessonId, detail: lesson?.words[currentIndex]?.term });
    if (lesson) {
      const updated = [...continueQueueRef.current, lesson.words[currentIndex]];
      continueQueueRef.current = updated;
      setContinueQueue(updated);
    }
    advanceFlashcard();
  };

  const advanceFlashcard = () => {
    if (!lesson) return;
    if (currentIndex < lesson.words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      log({
        fn: 'advanceFlashcard:end',
        lesson: lessonId,
        detail: `queue=${continueQueueRef.current.length}`,
      });
      if (continueQueueRef.current.length > 0) {
        setSessionState('REVIEW');
      } else if (!finishMutation.isPending) {
        finishSession();
      }
    }
  };

  // ── Finish session ─────────────────────────────────────────────────────────
  const finishSession = async () => {
    if (!lessonId || !lesson) return;

    log({
      fn: 'finishSession:start',
      lesson: lessonId,
      data: {
        continue: continueQueueRef.current.length,
        remembered: rememberedWordsRef.current.length,
      },
    });

    try {
      const result = await finishMutation.mutateAsync({
        lessonId,
        wordsToSave: continueQueueRef.current,
        rememberedWords: rememberedWordsRef.current,
      });

      log({ fn: 'finishSession:done', lesson: lessonId, data: result });

      setSessionState('COMPLETED');
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#000000', '#bef264', '#fde047', '#f87171'],
      });
    } catch (e) {
      log({ fn: 'finishSession:error', lesson: lessonId, detail: String(e) });
      console.error('Error saving progress', e);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (sessionState === 'LOADING') {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#f4f4f0] dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <PageDetail>
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto mb-6 flex justify-between items-center relative z-20">
        <Button variant="outline" size="sm" onClick={() => navigate(`/vocabulary/${level}`)}>
          <ArrowLeft className="w-5 h-5 mr-2 stroke-3" /> Retreat
        </Button>

        {sessionState === 'FLASHCARDS' && lesson && (
          <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest rounded-xl transform  border-2 border-transparent">
            <Flag className="w-5 h-5" /> Stage {currentIndex + 1}/{lesson.words.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center max-w-lg md:max-w-2xl w-full mx-auto relative z-10">
        {sessionState === 'FLASHCARDS' && lesson && (
          <div className="space-y-8">
            <div className="relative h-6 bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div
                className="absolute inset-y-0 left-0 bg-lime-400 border-r-4 border-black transition-all duration-300 ease-out"
                style={{ width: `${(currentIndex / lesson.words.length) * 100}%` }}
              />
            </div>
            <FlashCard
              word={lesson.words[currentIndex]}
              onContinue={handleContinue}
              onKnown={handleKnown}
            />
          </div>
        )}

        {sessionState === 'REVIEW' && (
          <div className="space-y-8 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white inline-block transform -rotate-2">
                Boss Fight!
              </h2>
              <p className="font-bold text-gray-600 dark:text-gray-300 mt-2 uppercase">
                {continueQueue.length} targets remaining
              </p>
            </div>
            <BatchReview words={continueQueue} onComplete={finishSession} lessonId={lessonId} />
          </div>
        )}

        {sessionState === 'COMPLETED' && (
          <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] text-center space-y-8 transform transition-transform duration-300">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-black bg-lime-300 dark:bg-lime-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 animate-bounce">
              <Star className="w-16 h-16 text-black fill-current" />
            </div>

            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-4">
                STAGE CLEARED!
              </h1>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                {continueQueue.length > 0
                  ? `Mastered ${continueQueue.length} new words`
                  : `Flawless — all ${lesson?.words.length ?? 0} words known!`}
              </p>
            </div>

            <div className="pt-8">
              <Button
                variant="black"
                size="lg"
                fullWidth
                onClick={() => navigate(`/vocabulary/${level}`)}
                className="max-w-sm mx-auto text-lime-400!"
              >
                Return to Map <ArrowLeft className="w-6 h-6 rotate-180 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageDetail>
  );
};
