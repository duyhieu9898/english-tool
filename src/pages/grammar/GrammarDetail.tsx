import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useGrammarLesson, useAddLessonProgressMutation } from '../../hooks/useApi';
import { sounds } from '../../services/sounds';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Check, Star } from 'lucide-react';
import { PageDetail } from '../../components/layout/PageDetailContainer';

export const GrammarDetail: React.FC = () => {
  const { level, lessonId } = useParams<{ level: string; lessonId: string }>();
  const navigate = useNavigate();

  const { data: lesson } = useGrammarLesson(lessonId!);
  const addProgressMutation = useAddLessonProgressMutation();

  const [mode, setMode] = useState<'THEORY' | 'QUIZ' | 'COMPLETED'>('THEORY');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!lesson)
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#f4f4f0] dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );

  const handleStartQuiz = () => {
    if (!lesson.practice || lesson.practice.length === 0) {
      completeLesson();
    } else {
      setMode('QUIZ');
    }
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    const q = lesson.practice[currentQuestionIndex];
    if (selectedOption === q.answer) {
      sounds.correct();
      setShowExplanation(true);
    } else {
      sounds.incorrect();
      // On incorrect, user can try again (don't show explanation yet, just shake/red)
      setSelectedOption(null);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (currentQuestionIndex < lesson.practice.length - 1) {
      setCurrentIndex((curr) => curr + 1);
    } else {
      completeLesson();
    }
  };

  const setCurrentIndex = (updater: (prev: number) => number) => {
    setCurrentQuestionIndex(updater);
  };

  const completeLesson = async () => {
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ['#000000', '#bef264', '#fde047', '#f87171'] });
    setMode('COMPLETED');
    addProgressMutation.mutate({ id: lesson!.slug, type: 'grammar', completedAt: new Date().toISOString() });
  };

  return (
    <PageDetail>
      <div className="max-w-4xl w-full mx-auto mb-6 flex justify-between items-center relative z-20">
        <button
          onClick={() => navigate(`/grammar/${level}`)}
          className="inline-flex items-center text-sm font-black uppercase text-black dark:text-white bg-white dark:bg-black px-4 py-2 border-2 border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px] transition-all"
        >
          <ArrowLeft className="w-5 h-5 mr-2 stroke-3" /> Retreat
        </button>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative bg-white dark:bg-gray-800 rounded-3xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
        {mode === 'THEORY' && (
          <div className="p-6 overflow-y-auto">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black dark:text-white leading-none mb-4">
              {lesson.title}
            </h1>
            <p className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-8 border-b-4 border-black dark:border-gray-700 pb-6">
              {lesson.description}
            </p>

            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 stroke-3" /> Theory
              </h3>
              <p className="text-lg font-medium leading-relaxed mb-8">{lesson.theory}</p>

              {lesson.structures.length > 0 && (
                <>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">
                    Structures
                  </h3>
                  <div className="space-y-6 mb-10">
                    {lesson.structures.map((st, i) => (
                      <div
                        key={i}
                        className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-2xl border-4 border-black dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
                      >
                        <div className="font-black text-xl text-black dark:text-white mb-2 uppercase">
                          {st.name}
                        </div>
                        <code className="text-blue-700 dark:text-blue-300 font-bold text-lg block mb-3 bg-white dark:bg-black p-3 border-2 border-black rounded-xl">
                          {st.formula}
                        </code>
                        <div className="text-gray-700 dark:text-gray-300 font-medium italic">
                          "{st.example}"
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {lesson.tips.length > 0 && (
                <>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-6">
                    Tips & Tricks
                  </h3>
                  <ul className="list-disc pl-6 space-y-3 font-medium text-lg text-gray-700 dark:text-gray-300 mb-8">
                    {lesson.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="mt-12 flex justify-end">
              <button
                onClick={handleStartQuiz}
                className="flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black py-3 px-6 rounded-xl font-black text-lg uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0 active:shadow-none transition-all"
              >
                Practice Quiz <ChevronRight className="w-6 h-6 stroke-3" />
              </button>
            </div>
          </div>
        )}

        {mode === 'QUIZ' && lesson.practice[currentQuestionIndex] && (
          <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black dark:border-gray-700 pb-4">
              <span className="text-sm font-black text-black dark:text-white tracking-widest uppercase bg-lime-300 dark:bg-lime-600 px-3 py-1 rounded-lg border-2 border-black">
                PRACTICE QUIZ
              </span>
              <span className="text-xl font-black text-black dark:text-white">
                {currentQuestionIndex + 1} / {lesson.practice.length}
              </span>
            </div>

            <h2 className="text-3xl font-black mb-10 text-black dark:text-white leading-tight">
              {lesson.practice[currentQuestionIndex].question}
            </h2>

            <div className="space-y-4 flex-1">
              {lesson.practice[currentQuestionIndex].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => !showExplanation && setSelectedOption(opt)}
                  className={`w-full text-left p-3 rounded-2xl border-4 transition-all font-bold text-lg ${
                    selectedOption === opt
                      ? 'border-black bg-yellow-300 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-yellow-500'
                      : 'border-black dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                  } ${showExplanation && opt === lesson.practice[currentQuestionIndex].answer ? 'border-black bg-lime-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-lime-500' : ''}`}
                  disabled={showExplanation}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {!showExplanation ? (
                <button
                  disabled={!selectedOption}
                  onClick={checkAnswer}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-3 px-6 rounded-2xl font-black text-xl uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
                >
                  Check Answer <Check className="w-6 h-6 stroke-3" />
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-lime-300 dark:bg-lime-600 text-black dark:text-white rounded-2xl border-4 border-black">
                    <div className="font-black text-2xl mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 fill-black text-lime-300 dark:fill-white dark:text-lime-600" />{' '}
                      EXACTLY!
                    </div>
                    <div className="font-medium text-lg">
                      {lesson.practice[currentQuestionIndex].explanation}
                    </div>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white dark:bg-blue-400 dark:text-black py-3 px-6 rounded-2xl font-black text-xl uppercase tracking-wider border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-none transition-all"
                  >
                    Next Question <ChevronRight className="w-6 h-6 stroke-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'COMPLETED' && (
          <div className="p-6 md:p-12 flex flex-col items-center justify-center text-center h-full space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-black bg-lime-300 dark:bg-lime-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 animate-bounce">
              <Star className="w-16 h-16 text-black fill-current" />
            </div>

            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-4">
                STAGE CLEARED!
              </h1>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                Grammar Mastered
              </p>
            </div>

            <div className="pt-8 w-full max-w-sm">
              <button
                onClick={() => navigate(`/grammar/${level}`)}
                className="w-full flex items-center justify-center gap-3 bg-black text-lime-400 dark:bg-white dark:text-black py-4 px-8 rounded-2xl font-black text-xl uppercase tracking-wider border-4 border-transparent hover:border-lime-400 dark:hover:border-lime-500 hover:scale-105 active:scale-95 transition-all"
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
