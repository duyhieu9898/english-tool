import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VocabWord } from '../../types';
import { useTTS } from '../../hooks/useTTS';
import { useKeyboard } from '../../hooks/useKeyboard';
import { sounds } from '../../services/sounds';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { LessonMeaning } from '../vocabulary/LessonMeaning';
import { AnswerInput } from '../common/AnswerInput';
interface BatchReviewProps {
  words: VocabWord[];
  onComplete: () => void;
  lessonId?: string;
  soundEnabled?: boolean;
}

export const BatchReview: React.FC<BatchReviewProps> = ({
  words,
  onComplete,
  lessonId,
  soundEnabled = true,
}) => {
  const [queue, setQueue] = useState<VocabWord[]>(() => {
    return [...words].sort(() => Math.random() - 0.5);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(false);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const { speak } = useTTS();

  const currentWord = queue[currentIndex];

  useEffect(() => {
    // Focus whenever the index or error state changes, adding a small timeout to account for framer-motion mount
    const timer = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, showError]);

  const handleSubmit = () => {
    if (!currentWord || showError) return;

    const isCorrect = inputValue.trim().toLowerCase() === currentWord.term.toLowerCase();

    if (isCorrect) {
      if (soundEnabled) sounds.correct();
      setInputValue('');
      if (currentIndex < queue.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onComplete();
      }
    } else {
      if (soundEnabled) sounds.incorrect();
      setShowError(true);
      speak(currentWord.term);

      const fails = (retryCount[currentWord.term] || 0) + 1;
      setRetryCount((prev) => ({ ...prev, [currentWord.term]: fails }));

      // Always add back to queue so user eventually gets it right
      setQueue((prev) => [...prev, currentWord]);
    }
  };

  useKeyboard({
    Enter: (e) => {
      e.preventDefault();
      if (showError) handleNextAfterError();
      else handleSubmit();
    },
  });


  const handleNextAfterError = () => {
    setShowError(false);
    setInputValue('');
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!currentWord) return null;

  return (
    <div className="w-full max-w-md mx-auto relative flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${showError ? 'error' : 'ask'}`}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full flex md:min-h-[300px] flex-col items-center justify-center text-center relative"
        >
          <div className="text-gray-500 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" /> TYPE TRANSLATION
          </div>

         <div className='mb-6'>
           {lessonId ? (
             <LessonMeaning term={currentWord.term} lessonId={lessonId} />
           ) : (
             <>
               <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white leading-tight capitalize">
                 {currentWord.meaning || 'Mystery Word'}
               </h2>
               <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-10">
                 {currentWord.modifiers || 'noun'}
               </span>
             </>
           )}
         </div>

          {showError ? (
            <div className="w-full animate-shake flex flex-col items-center">
              <div className="text-red-500 font-black text-2xl uppercase tracking-wide mb-2">
                Incorrect!
              </div>
              <div className="text-4xl md:text-5xl font-black text-black dark:text-white lowercase mb-8">
                {currentWord.term}
              </div>
              <Button
                variant="black"
                size="lg"
                fullWidth
                onClick={handleNextAfterError}
              >
                Got it <ArrowRight className="w-6 h-6 stroke-3 ml-2" />
              </Button>
              <div className="text-xs font-bold text-gray-500 mt-4 uppercase">
                Press Enter to continue
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <AnswerInput
                ref={inputRef}
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter word"
                aria-label="Enter translation"
                variant="blue"
                size="md"
                className="mb-8"
              />
            </div>
          )}

          {/* Progress indicator */}
          <div className="absolute -bottom-8 left-0 right-0 text-center text-sm font-black text-gray-400 dark:text-gray-600 tracking-widest leading-none">
            {currentIndex + 1} / {queue.length}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
