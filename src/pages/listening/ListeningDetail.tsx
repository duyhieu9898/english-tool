import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListeningLesson } from '@/hooks/useApi';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import { useTTS } from '@/hooks/useTTS';
import { normalizeText } from './listening.utils';
import { PageDetail } from '@/components/layout/PageDetailContainer';
import { ArrowLeft, Volume2, Check, ChevronRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export const ListeningDetail: React.FC = () => {
  const { level, lessonId } = useParams<{ level: string; lessonId: string }>();
  const navigate = useNavigate();
  const { speak } = useTTS();

  const { data: lesson, isLoading } = useListeningLesson(lessonId!);

  const [mode, setMode] = useState<'STUDY' | 'COMPLETED'>('STUDY');
  const [userInput, setUserInput] = useState('');
  const [playbackRate, setPlaybackRate] = useState(0.9);
  const [attempts, setAttempts] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [wordResults, setWordResults] = useState<(boolean | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);

  const onComplete = useCallback(() => setMode('COMPLETED'), []);

  const {
    currentQuestionIndex,
    isCorrect,
    nextQuestion: advanceQuestion,
    markCorrect,
    markIncorrect,
  } = useQuizFlow({
    totalQuestions: lesson?.questions?.length ?? 0,
    lessonSlug: lesson?.slug ?? '',
    lessonType: 'listening',
    onComplete,
  });

  const targetWords = React.useMemo(() => {
    if (!lesson) return [];
    return lesson.questions[currentQuestionIndex].sentence.split(/\s+/);
  }, [lesson, currentQuestionIndex]);

  const maskWord = (word: string) => {
    return word
      .split('')
      .map((char) => (/[a-zA-Z0-9]/.test(char) ? '*' : char))
      .join('');
  };

  const handlePlayAudio = useCallback(() => {
    if (lesson) {
      speak(lesson.questions[currentQuestionIndex].sentence, { rate: playbackRate });
    }
  }, [lesson, currentQuestionIndex, playbackRate, speak]);

  const nextQuestion = useCallback(() => {
    setUserInput('');
    setRevealedIndices([]);
    setWordResults([]);
    setIsChecked(false);
    setAttempts(0);
    advanceQuestion();
  }, [advanceQuestion]);

  const checkAnswer = useCallback(() => {
    if (!lesson) return;
    const currentQuestion = lesson.questions[currentQuestionIndex];
    const normalizedInput = normalizeText(userInput);
    const normalizedAnswer = normalizeText(currentQuestion.sentence);

    const inputWords = normalizedInput.split(/\s+/);
    const results = targetWords.map((targetWord, index) => {
      const normalizedTarget = normalizeText(targetWord);
      const normalizedInputWord = inputWords[index] ? normalizeText(inputWords[index]) : '';
      return normalizedTarget === normalizedInputWord;
    });

    setWordResults(results);
    setIsChecked(true);

    if (normalizedInput === normalizedAnswer) {
      markCorrect();
      setAttempts(0);
    } else {
      markIncorrect();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
    }
  }, [lesson, currentQuestionIndex, userInput, attempts, markCorrect, markIncorrect, targetWords]);

  const toggleWordReveal = (index: number) => {
    setRevealedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Space or Alt + Space to Replay
      if ((e.ctrlKey || e.altKey) && e.code === 'Space') {
        e.preventDefault();
        handlePlayAudio();
      }
      // Alt + H to toggle hint (reveal all)
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setRevealedIndices((prev) =>
          prev.length === targetWords.length ? [] : targetWords.map((_, i) => i),
        );
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handlePlayAudio, targetWords]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isCorrect === true) {
        nextQuestion();
      } else if (userInput.trim()) {
        checkAnswer();
      }
    }
  };
  if (isLoading || !lesson) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#f4f4f0] dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <PageDetail className="max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className=" mb-6 flex justify-between items-center relative z-20">
        <Button variant="outline" size="sm" onClick={() => navigate(`/listening/${level}`)}>
          <ArrowLeft className="w-5 h-5 mr-2 stroke-3" /> Retreat
        </Button>

        {mode === 'STUDY' && (
          <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest rounded-xl border-2 border-transparent">
            Stage {currentQuestionIndex + 1}/{lesson.questions.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto relative z-10">
        {mode === 'STUDY' && (
          <div className="space-y-8">
            {/* Progress Bar */}
            <div className="relative h-6 bg-white dark:bg-gray-800 border-4 border-black dark:border-gray-600 rounded-full overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div
                className="absolute inset-y-0 left-0 bg-yellow-400 border-r-4 border-black transition-all duration-300 ease-out"
                style={{ width: `${(currentQuestionIndex / lesson.questions.length) * 100}%` }}
              />
            </div>

            {/* Dictation Card */}
            <div className="space-y-4 md:space-y-8">
              <div className="flex flex-col items-center gap-4 md:gap-6">
                <h2 className="text-2xl font-black uppercase text-center text-gray-800 dark:text-gray-100 italic">
                  Listen and type
                </h2>

                <div className="flex items-center gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-24! h-24! rounded-full! p-0! border-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    onClick={handlePlayAudio}
                  >
                    <Volume2 className="w-12 h-12 stroke-3" />
                  </Button>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black uppercase tracking-widest opacity-50">
                      Speed
                    </span>
                    <div className="flex gap-2">
                      {[0.75, 0.9, 1.1].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setPlaybackRate(rate)}
                          className={`px-3 py-1 rounded-lg border-2 border-black font-bold text-sm transition-all ${
                            playbackRate === rate
                              ? 'bg-black text-white dark:bg-white dark:text-black'
                              : 'bg-white text-black hover:bg-gray-100'
                          }`}
                        >
                          {rate === 0.9 ? 'Normal' : rate < 0.9 ? 'Slow' : 'Fast'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    Sentence Structure (Click to reveal)
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-gray-700 rounded-2xl min-h-[60px]">
                  {targetWords.map((word, index) => {
                    const isRevealed = revealedIndices.includes(index);
                    const isCorrectWord = wordResults[index] === true;
                    const isWrongWord = isChecked && wordResults[index] === false;

                    let badgeClass =
                      'bg-white dark:bg-gray-800 text-black dark:text-white border-black dark:border-white';
                    if (isCorrectWord)
                      badgeClass =
                        'bg-white dark:bg-gray-800 text-black dark:text-white border-lime-500 dark:border-lime-400 shadow-[1.5px_1.5px_0px_0px_rgba(132,204,22,1)]';
                    else if (isWrongWord)
                      badgeClass =
                        'bg-white dark:bg-gray-800 text-black dark:text-white border-red-500 dark:border-red-400 shadow-[1.5px_1.5px_0px_0px_rgba(239,68,68,1)]';

                    return (
                      <button
                        key={index}
                        onClick={() => toggleWordReveal(index)}
                        className={`px-2 py-0.5 rounded-lg border-2 border-black font-mono font-bold text-sm shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${badgeClass}`}
                      >
                        {isRevealed || isCorrectWord ? word : maskWord(word)}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center px-1">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    Your transcription
                  </div>
                </div>

                <Textarea
                  variant="compact"
                  placeholder="What did you hear?"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  disabled={isCorrect === true}
                  autoFocus
                  rows={2}
                />
              </div>

              <div className="flex">
                {isCorrect === true ? (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={nextQuestion}
                    className="bg-lime-400 text-black border-4"
                  >
                    Continue <ChevronRight className="w-6 h-6 stroke-3 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="black"
                    size="lg"
                    fullWidth
                    disabled={!userInput.trim()}
                    onClick={checkAnswer}
                    className="border-4"
                  >
                    Check <Check className="w-6 h-6 stroke-3 ml-2" />
                  </Button>
                )}
              </div>

              {/* Shortcut Hint */}
              <div className="hidden md:flex mt-4 justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 border border-gray-300 rounded bg-gray-100 text-gray-600">
                    Enter
                  </kbd>{' '}
                  to {isCorrect === true ? 'continue' : 'check'}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 border border-gray-300 rounded bg-gray-100 text-gray-600">
                    Ctrl+Space
                  </kbd>{' '}
                  to replay
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 border border-gray-300 rounded bg-gray-100 text-gray-600">
                    Alt+H
                  </kbd>{' '}
                  hint
                </span>
              </div>
            </div>
          </div>
        )}

        {mode === 'COMPLETED' && (
          <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] text-center space-y-8 transform transition-transform duration-300">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-black bg-lime-300 dark:bg-lime-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 animate-bounce">
              <Trophy className="w-16 h-16 text-black" />
            </div>

            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-4">
                LEVEL CLEARED!
              </h1>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                Your ears are getting sharp!
              </p>
            </div>

            <div className="pt-8">
              <Button
                variant="black"
                size="lg"
                fullWidth
                onClick={() => navigate(`/listening/${level}`)}
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
