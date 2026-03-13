import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VocabWord } from '../../types';
import { useTTS } from '../../hooks/useTTS';
import { useKeyboard } from '../../hooks/useKeyboard';
import { sounds } from '../../services/sounds';
import { ArrowRight, Sparkles } from 'lucide-react';

interface BatchReviewProps {
  words: VocabWord[];
  onComplete: () => void;
  soundEnabled?: boolean;
}

export const BatchReview: React.FC<BatchReviewProps> = ({
  words,
  onComplete,
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

      if (fails >= 3) {
        // Auto pass logic or let user see it
      } else {
        setQueue((prev) => [...prev, currentWord]);
      }
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

          <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white mb-2 leading-tight">
            {currentWord.meaning || 'Mystery Word'}
          </h2>
          <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-10">
            {currentWord.modifiers || 'noun'}
          </span>

          {showError ? (
            <div className="w-full animate-shake flex flex-col items-center">
              <div className="text-red-500 font-black text-2xl uppercase tracking-wide mb-2">
                Incorrect!
              </div>
              <div className="text-4xl md:text-5xl font-black text-black dark:text-white lowercase mb-8">
                {currentWord.term}
              </div>
              <button
                onClick={handleNextAfterError}
                className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-4 px-6 rounded-xl font-black text-xl uppercase tracking-wider border-4 border-transparent hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0 active:shadow-none transition-all"
              >
                Got it <ArrowRight className="w-6 h-6 stroke-3 ml-2" />
              </button>
              <div className="text-xs font-bold text-gray-500 mt-4 uppercase">
                Press Enter to continue
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter word"
                className="w-full text-center text-4xl font-black py-4 px-4 bg-gray-100 dark:bg-gray-900 border-4 border-black dark:border-white rounded-2xl outline-none focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-black dark:text-white lowercase placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all mb-8"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white dark:bg-blue-400 dark:text-black py-4 px-6 rounded-xl font-black text-xl uppercase tracking-wider border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
              >
                Attack <ArrowRight className="w-6 h-6 stroke-3 ml-2" />
              </button>
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
