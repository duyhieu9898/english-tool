import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useReadingLesson, useAddLessonProgressMutation } from '../../hooks/useApi';
import { sounds } from '../../services/sounds';
import { useTTS } from '../../hooks/useTTS';
import { PageDetail } from '../../components/layout/PageDetailContainer';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Check,
  Volume2,
  Languages,
  Star,
} from 'lucide-react';

export const ReadingDetail: React.FC = () => {
  const { level, lessonId } = useParams<{ level: string; lessonId: string }>();
  const navigate = useNavigate();
  const { speak } = useTTS();

  const { data: lesson } = useReadingLesson(lessonId!);
  const addProgressMutation = useAddLessonProgressMutation();

  const [mode, setMode] = useState<'READING' | 'QUIZ' | 'COMPLETED'>('READING');
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showReference, setShowReference] = useState(false);

  if (!lesson)
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#f4f4f0] dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );

  const handleStartQuiz = () => {
    if (!lesson.questions || lesson.questions.length === 0) {
      completeLesson();
    } else {
      setMode('QUIZ');
      setShowReference(false);
    }
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    const q = lesson.questions[currentQuestionIndex];
    if (selectedOption === q.answer) {
      sounds.correct();
      setShowExplanation(true);
    } else {
      sounds.incorrect();
      setSelectedOption(null);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (currentQuestionIndex < lesson.questions.length - 1) {
      setCurrentQuestionIndex((curr) => curr + 1);
    } else {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ['#000000', '#bef264', '#fde047', '#f87171'] });
    setMode('COMPLETED');
    addProgressMutation.mutate({ id: lesson!.slug, type: 'reading', completedAt: new Date().toISOString() });
  };

  return (
    <PageDetail>
      <div className="max-w-4xl w-full mx-auto mb-6 flex justify-between items-center relative z-20">
        <button
          onClick={() => {
            if (mode === 'QUIZ') {
              setMode('READING');
            } else {
              navigate(`/reading/${level}`);
            }
          }}
          className="inline-flex items-center text-sm font-black uppercase text-black dark:text-white bg-white dark:bg-black px-4 py-2 border-2 border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px] transition-all"
        >
          <ArrowLeft className="w-5 h-5 mr-2 stroke-3" /> {mode === 'QUIZ' ? 'Back to Reading' : 'Retreat'}
        </button>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative bg-white dark:bg-gray-800 rounded-3xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
        {mode === 'READING' && (
          <div className="p-6 overflow-y-auto">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black dark:text-white leading-none mb-4">
              {lesson.title}
            </h1>
            <p className="inline-block px-3 py-1 bg-black text-white dark:bg-white dark:text-black font-bold uppercase rounded-md transform -skew-x-12 mb-8">
              {lesson.topic}
            </p>

            <div className="prose dark:prose-invert max-w-none text-lg">
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 text-black dark:text-white py-2 px-4 rounded-xl font-bold text-sm uppercase tracking-widest border-2 border-black dark:border-gray-600 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0 active:shadow-none transition-all"
                >
                  <Languages className="w-4 h-4" />{' '}
                  {showTranslation ? 'Hide Translation' : 'View Translation'}
                </button>
              </div>

              <div className="leading-relaxed font-medium bg-amber-50 dark:bg-gray-800/80 p-8 rounded-2xl whitespace-pre-line mb-8 border-4 border-black dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] text-gray-900 dark:text-gray-100">
                {lesson.content}
              </div>

              {showTranslation && lesson.translation && (
                <div className="leading-relaxed bg-blue-100/50 dark:bg-blue-900/30 p-8 rounded-2xl whitespace-pre-line mb-8 text-gray-800 dark:text-gray-200 italic border-4 border-black dark:border-gray-700 border-dashed">
                  {lesson.translation}
                </div>
              )}

              {lesson.vocabulary_highlights && lesson.vocabulary_highlights.length > 0 && (
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl border-4 border-black dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] p-6">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white flex items-center gap-2 mb-6 border-b-4 border-black dark:border-gray-700 pb-4">
                    <BookOpen className="w-6 h-6 stroke-3" /> Vocabulary Highlights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lesson.vocabulary_highlights.map((vh, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between p-4 rounded-xl border-4 border-black dark:border-gray-600 bg-teal-50 dark:bg-gray-900"
                      >
                        <div>
                          <span className="font-black text-xl text-black dark:text-white block mb-1 uppercase">
                            {vh.word}
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {vh.meaning}
                          </span>
                        </div>
                        <button
                          onClick={() => speak(vh.word)}
                          className="p-3 text-black dark:text-white bg-white dark:bg-black hover:bg-teal-200 dark:hover:bg-gray-700 border-2 border-black rounded-xl hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0 active:shadow-none"
                        >
                          <Volume2 className="w-6 h-6 stroke-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-end">
              <button
                onClick={handleStartQuiz}
                className="flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black py-3 px-6 rounded-xl font-black text-lg uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0 active:shadow-none transition-all"
              >
                Reading Quiz <ChevronRight className="w-6 h-6 stroke-3" />
              </button>
            </div>
          </div>
        )}

        {mode === 'QUIZ' && lesson.questions[currentQuestionIndex] && (
          <div className="p-6 flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black dark:border-gray-700 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-black dark:text-white tracking-widest uppercase bg-lime-300 dark:bg-lime-600 px-3 py-1 rounded-lg border-2 border-black">
                  QUIZ
                </span>
                <button
                  onClick={() => setShowReference(!showReference)}
                  className="text-xs font-black uppercase px-3 py-1 bg-white dark:bg-gray-700 border-2 border-black rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  {showReference ? 'Hide Passage' : 'Peek at Text'}
                </button>
              </div>
              <span className="text-xl font-black text-black dark:text-white">
                {currentQuestionIndex + 1} / {lesson.questions.length}
              </span>
            </div>

            {showReference && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-gray-900 border-4 border-black dark:border-gray-700 rounded-xl max-h-48 overflow-y-auto text-base font-medium leading-relaxed shadow-inner">
                {lesson.content}
              </div>
            )}

            <h2 className="text-2xl font-black mb-6 text-black dark:text-white leading-tight">
              {lesson.questions[currentQuestionIndex].question}
            </h2>

            <div className="space-y-4 flex-1">
              {lesson.questions[currentQuestionIndex].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => !showExplanation && setSelectedOption(opt)}
                  className={`w-full text-left p-3 rounded-2xl border-4 transition-all font-bold text-lg ${
                    selectedOption === opt
                      ? 'border-black bg-yellow-200 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-yellow-900/40 dark:text-yellow-100'
                      : 'border-black dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                  } ${showExplanation && opt === lesson.questions[currentQuestionIndex].answer ? 'border-black bg-emerald-200 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-emerald-900/60 dark:text-emerald-50' : ''}`}
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
                  <div className="p-4 bg-lime-200 dark:bg-lime-900/30 text-black dark:text-white rounded-2xl border-4 border-black dark:border-emerald-800">
                    <div className="font-black text-2xl mb-2 flex items-center gap-3">
                      <div className="p-1 bg-black rounded-lg">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" strokeWidth={3} />
                      </div>
                      EXACTLY!
                    </div>
                    <div className="font-medium text-lg leading-relaxed">
                      {lesson.questions[currentQuestionIndex].explanation}
                    </div>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 px-6 rounded-2xl font-black text-xl uppercase tracking-wider border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
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
                Reading Mastered
              </p>
            </div>

            <div className="pt-8 w-full max-w-sm">
              <button
                onClick={() => navigate(`/reading/${level}`)}
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
