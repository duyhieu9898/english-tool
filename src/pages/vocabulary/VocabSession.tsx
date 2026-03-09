import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  useLessonFetcher,
  useSessionProgressFetcher,
  useSaveSessionProgressMutation,
  useFinishVocabSessionMutation,
} from '../../hooks/useApi';
import type { Lesson, VocabWord } from '../../types';
import { FlashCard } from '../../components/flashcard/FlashCard';
import { BatchReview } from '../../components/flashcard/BatchReview';
import { ArrowLeft, Flag, Star } from 'lucide-react';
import { PageDetail } from '../../components/layout/PageDetailContainer';
import { log } from '../../services/activityLogger';

type SessionState = 'LOADING' | 'FLASHCARDS' | 'REVIEW' | 'COMPLETED';

export const VocabSession: React.FC = () => {
  const { level, lessonId } = useParams<{ level: string; lessonId: string }>();
  const navigate = useNavigate();

  const fetchLesson          = useLessonFetcher();
  const fetchSessionProgress = useSessionProgressFetcher();
  const saveProgress         = useSaveSessionProgressMutation();
  const finishMutation       = useFinishVocabSessionMutation();

  const [sessionState, setSessionState] = useState<SessionState>('LOADING');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [continueQueue, setContinueQueue] = useState<VocabWord[]>([]);
  // Ref mirrors continueQueue so finishSession always gets a non-stale snapshot
  const continueQueueRef = React.useRef<VocabWord[]>([]);

  // ── Initial load ──────────────────────────────────────────────────────────
  // fetchLesson / fetchSessionProgress are stable references from useQueryClient — safe to omit
  useEffect(() => {
    if (!lessonId) return;
    let ignore = false;

        fetchLesson(lessonId)
          .then((data) => {
            if (ignore) return;

            // --- Consolidate duplicate terms (e.g. exercise noun vs verb) ---
            const consolidatedWords: VocabWord[] = [];
            data.words.forEach((current) => {
              const existing = consolidatedWords.find(
                (w) => w.term.toLowerCase() === current.term.toLowerCase(),
              );
              if (existing) {
                // Merge classes (modifiers)
                if (!existing.modifiers.toLowerCase().includes(current.modifiers.toLowerCase())) {
                  existing.modifiers += `, ${current.modifiers}`;
                }
                // Merge meanings
                if (!existing.meaning.includes(current.meaning)) {
                  existing.meaning += `; ${current.meaning}`;
                }
                // Convert full_sentence to a list if it's the second sentence
                if (!existing.full_sentence.includes(current.full_sentence)) {
                  if (!existing.full_sentence.startsWith('•')) {
                    existing.full_sentence = `• ${existing.full_sentence}\n• ${current.full_sentence}`;
                  } else {
                    existing.full_sentence += `\n• ${current.full_sentence}`;
                  }
                }
              } else {
                consolidatedWords.push({ ...current });
              }
            });

            const consolidatedLesson = { ...data, words: consolidatedWords };
            setLesson(consolidatedLesson);
            log({
              fn: 'lesson:loaded',
              lesson: lessonId,
              detail: `words=${consolidatedLesson.words.length} (original=${data.words.length})`,
            });

            if (consolidatedLesson.words.length === 0) {
              setSessionState('COMPLETED');
              return;
            }

            fetchSessionProgress(lessonId)
              .then((prog) => {
                if (ignore) return;
                if (prog) {
                  log({
                    fn: 'session:resume',
                    lesson: lessonId,
                    detail: `fromIndex=${prog.currentIndex}`,
                  });
                  setCurrentIndex(Math.min(prog.currentIndex, consolidatedLesson.words.length - 1));
                } else {
                  log({ fn: 'session:new', lesson: lessonId });
                  setCurrentIndex(0);
                }
                setSessionState('FLASHCARDS');
              })
          .catch(() => {
            if (!ignore) {
              setCurrentIndex(0);
              setSessionState('FLASHCARDS');
            }
          });
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          navigate('/vocabulary');
        }
      });

    return () => { ignore = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchLesson/fetchSessionProgress are stable (useQueryClient ref)
  }, [lessonId, navigate]);

  // ── Auto-save checkpoint whenever currentIndex advances ───────────────────
  useEffect(() => {
    if (sessionState !== 'FLASHCARDS' || !lessonId) return;
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
      log({ fn: 'advanceFlashcard:end', lesson: lessonId, detail: `queue=${continueQueueRef.current.length}` });
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
        remembered: rememberedWordsRef.current.length
      } 
    });

    try {
      const result = await finishMutation.mutateAsync({
        lessonId,
        wordsToSave: continueQueueRef.current,
        rememberedWords: rememberedWordsRef.current,
      });

      log({ fn: 'finishSession:done', lesson: lessonId, data: result });

      setSessionState('COMPLETED');
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ['#000000', '#bef264', '#fde047', '#f87171'] });
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
        <button
          onClick={() => navigate(`/vocabulary/${level}`)}
          className="inline-flex items-center text-sm font-black uppercase text-black dark:text-white bg-white dark:bg-black px-4 py-2 border-2 border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px] transition-all"
        >
          <ArrowLeft className="w-5 h-5 mr-2 stroke-3" /> Retreat
        </button>

        {sessionState === 'FLASHCARDS' && lesson && (
          <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest rounded-xl transform rotate-2 border-2 border-transparent">
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
            <FlashCard word={lesson.words[currentIndex]} onContinue={handleContinue} onKnown={handleKnown} />
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
            <BatchReview words={continueQueue} onComplete={finishSession} />
          </div>
        )}

        {sessionState === 'COMPLETED' && (
          <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] text-center space-y-8 transform hover:-translate-y-2 transition-transform duration-300">
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
              <button
                onClick={() => navigate(`/vocabulary/${level}`)}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 bg-black text-lime-400 dark:bg-white dark:text-black py-4 px-8 rounded-2xl font-black text-xl uppercase tracking-wider border-4 border-transparent hover:border-lime-400 dark:hover:border-lime-500 hover:scale-105 active:scale-95 transition-all"
              >
                Return to Map <ArrowLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageDetail>
  );
};
