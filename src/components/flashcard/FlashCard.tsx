import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, ChevronRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { VocabWord } from '../../types';
import { useTTS } from '../../hooks/useTTS';
import { useKeyboard } from '../../hooks/useKeyboard';

interface FlashCardProps {
  word: VocabWord;
  onContinue: () => void;
  onKnown: () => void;
  autoPlayTts?: boolean;
}

export const FlashCard: React.FC<FlashCardProps> = ({
  word,
  onContinue,
  onKnown,
  autoPlayTts = true,
}) => {
  const [flipped, setFlipped] = useState(false);
  const { speak } = useTTS();

  const [prevWord, setPrevWord] = useState(word.term);

  if (word.term !== prevWord) {
    setPrevWord(word.term);
    setFlipped(false);
  }

  // Auto-play TTS when word changes
  useEffect(() => {
    if (autoPlayTts) {
      // small delay to let UI render
      const timer = setTimeout(() => speak(word.term), 300);
      return () => clearTimeout(timer);
    }
  }, [word.term, autoPlayTts, speak]);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  useKeyboard({
    ' ': (e) => {
      e.preventDefault();
      handleFlip();
    },
    '1': (e) => {
      if (flipped) {
        e.preventDefault();
        onContinue();
      }
    },
    '2': (e) => {
      if (flipped) {
        e.preventDefault();
        onKnown();
      }
    },
  });

  // Also support swipe gestures
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!flipped) return;
    const touchEndX = e.changedTouches[0].screenX;
    if (touchEndX - touchStartX.current > 50) {
      // swipe right
      onKnown();
    } else if (touchStartX.current - touchEndX > 50) {
      // swipe left
      onContinue();
    }
  };

  const highlightWord = (sentence: string, term: string) => {
    if (!term) return sentence;
    // Escape special regex characters to avoid errors
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = sentence.split(new RegExp(`(${escapedTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <strong key={i} className="font-bold text-gray-900 dark:text-white">
              {part}
            </strong>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <div
        className="w-full aspect-5/6 perspective-1000 relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          className="w-full h-full relative preserve-3d cursor-pointer"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          onClick={handleFlip}
        >
          {/* Front Face */}
          <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-900 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 text-center border-2 border-transparent">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                speak(word.term);
              }}
              className="absolute top-4 right-4 p-3 text-gray-400 hover:text-blue-500 z-10"
              title="Listen"
            >
              <Volume2 className="w-6 h-6" />
            </Button>

            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white lowercase">
              {word.term}
            </h2>
            <span className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-4">
              {word.modifiers || 'word'}
            </span>
            {word.full_sentence && (
              <div className="p-4 bg-blue-50 dark:bg-gray-800/50 rounded-2xl w-full">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 italic whitespace-pre-line text-left">
                  {highlightWord(word.full_sentence, word.term)}
                </p>
              </div>
            )}

            <div className="absolute bottom-8 left-0 right-0 text-center text-sm font-medium text-gray-400">
              Tap or press Space to flip
            </div>
          </div>

          {/* Back Face */}
          <div
            className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-900 rounded-3xl shadow-xl flex flex-col p-6 sm:p-8"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(word.term);
                }}
                className="absolute top-0 right-0 p-3 text-gray-400 hover:text-blue-500 z-10"
                title="Listen"
              >
                <Volume2 className="w-6 h-6" />
              </Button>

              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white lowercase mt-8">
                {word.meaning || 'Meaning not updated'}
              </h2>
              <span className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-4">
                {word.modifiers || 'word'}
              </span>
              {word.full_sentence && (
                <div className="p-4 bg-blue-50 dark:bg-gray-800/50 rounded-2xl w-full">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 italic whitespace-pre-line text-left">
                    {highlightWord(word.full_sentence, word.term)}
                  </p>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 text-center text-sm font-medium text-gray-400">
                Tap or press Space to flip
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Buttons - Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 flex flex-col items-center gap-3 w-full"
      >
        <Button
          variant="success"
          size="lg"
          fullWidth
          onClick={onContinue}
          className="sm:w-2/3 md:w-full max-w-xs"
        >
          Continue <ChevronRight className="w-6 h-6 ml-1" />
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={onKnown}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 font-medium"
        >
          <Check className="w-4 h-4 opacity-70" /> Remembered
        </Button>
      </motion.div>
    </div>
  );
};
