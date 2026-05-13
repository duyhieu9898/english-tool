import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGrammarLesson } from '@/hooks/useApi';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Check, Star } from 'lucide-react';
import { PageDetail } from '@/components/layout/PageDetailContainer';
import { Button } from '@/components/ui/Button';
import { QuizOption } from '@/components/common/QuizOption';

export const GrammarDetail: React.FC = () => {
  const { level, lessonId } = useParams<{ level: string; lessonId: string }>();
  const navigate = useNavigate();

  const { data: lesson } = useGrammarLesson(lessonId!);

  const [mode, setMode] = useState<'THEORY' | 'QUIZ' | 'COMPLETED'>('THEORY');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const onComplete = useCallback(() => setMode('COMPLETED'), []);

  const {
    currentQuestionIndex,
    nextQuestion: advanceQuestion,
    markCorrect,
    markIncorrect,
  } = useQuizFlow({
    totalQuestions: lesson?.practice?.length ?? 0,
    lessonSlug: lesson?.slug ?? '',
    lessonType: 'grammar',
    onComplete,
  });

  if (!lesson)
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#f4f4f0] dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );

  const handleStartQuiz = () => {
    if (!lesson.practice || lesson.practice.length === 0) {
      onComplete();
    } else {
      setMode('QUIZ');
    }
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    const q = lesson.practice[currentQuestionIndex];
    if (selectedOption === q.answer) {
      markCorrect();
      setShowExplanation(true);
    } else {
      markIncorrect();
      setSelectedOption(null);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    advanceQuestion();
  };

  return (
    <PageDetail className="max-w-4xl w-full mx-auto">
      <div className=" mb-6 flex justify-between items-center relative z-20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/grammar/${level}`)}
        >
          <ArrowLeft className="w-5 h-5 mr-2 stroke-3" /> Retreat
        </Button>
      </div>

      <div className="flex-1 flex flex-col relative">
        {mode === 'THEORY' && (
          <div>
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
                        className="bg-yellow-100 dark:bg-yellow-300 p-4 rounded-2xl border-4 border-black dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
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

            <div className="mt-6 md:mt-12 flex justify-end">
              <Button
                variant="black"
                size="md"
                onClick={handleStartQuiz}
              >
                Practice Quiz <ChevronRight className="w-6 h-6 stroke-3 ml-2" />
              </Button>
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
                <QuizOption
                  key={i}
                  label={opt}
                  isSelected={selectedOption === opt}
                  showResult={showExplanation}
                  isCorrect={opt === lesson.practice[currentQuestionIndex].answer}
                  onClick={() => setSelectedOption(opt)}
                />
              ))}
            </div>

            <div className="mt-6">
              {!showExplanation ? (
                <Button
                  variant="black"
                  size="lg"
                  fullWidth
                  disabled={!selectedOption}
                  onClick={checkAnswer}
                >
                  Check Answer <Check className="w-6 h-6 stroke-3 ml-2" />
                </Button>
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
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={nextQuestion}
                  >
                    Next Question <ChevronRight className="w-6 h-6 stroke-3 ml-2" />
                  </Button>
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
              <Button
                variant="black"
                size="lg"
                fullWidth
                onClick={() => navigate(`/grammar/${level}`)}
               className="text-lime-400!"
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
