import React from 'react';
import { useLesson, useLessons } from '../../hooks/useApi';

interface LessonMeaningProps {
  term: string;
  lessonId: string;
}

const maskTermInSentence = (sentence: string, term: string): string => {
  const trimmedTerm = term.trim();
  if (!trimmedTerm) return sentence;
  const escapedTerm = trimmedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startsWithWord = /^\w/.test(trimmedTerm);
  const endsWithWord = /\w$/.test(trimmedTerm);
  const pattern = `${startsWithWord ? '\\b' : ''}${escapedTerm}${endsWithWord ? '\\b' : ''}`;
  const masked = '_ '.repeat(trimmedTerm.length).trim();
  return sentence.replace(new RegExp(pattern, 'gi'), masked);
};

/**
 * Shared component to display consolidated meanings/modifiers for a term.
 * Searches for all occurrences of the term in a lesson to handle multi-function words.
 */
export const LessonMeaning: React.FC<LessonMeaningProps> = ({ term, lessonId }) => {
  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId);
  const { data: allLessons = [], isLoading: isLoadingAll } = useLessons();

  const info = React.useMemo(() => {
    const normalizedTerm = term.trim().toLowerCase();
    let matches = lesson?.words.filter((w) => w.term.trim().toLowerCase() === normalizedTerm) ?? [];

    // Fallback: search across all lessons if the term isn't found in the referenced lessonId
    if (matches.length === 0 && allLessons.length > 0) {
      for (const fallbackLesson of allLessons) {
        const found = fallbackLesson.words.filter(
          (w) => w.term.trim().toLowerCase() === normalizedTerm,
        );
        if (found.length > 0) {
          matches = found;
          break;
        }
      }
    }

    if (matches.length === 0) return null;

    return matches.reduce((acc, curr) => {
      const sentence = curr.full_sentence?.trim() || '';
      const isValidSentence =
        sentence.length > 0 &&
        sentence.toLowerCase() !== normalizedTerm &&
        sentence.split(/\s+/).length > 1;

      return {
        modifiers: acc.modifiers.includes(curr.modifiers)
          ? acc.modifiers
          : acc.modifiers
            ? `${acc.modifiers}, ${curr.modifiers}`
            : curr.modifiers,
        meaning: acc.meaning.includes(curr.meaning)
          ? acc.meaning
          : acc.meaning
            ? `${acc.meaning}; ${curr.meaning}`
            : curr.meaning,
        sentences:
          isValidSentence && !acc.sentences.includes(sentence)
            ? [...acc.sentences, sentence]
            : acc.sentences,
      };
    }, { modifiers: '', meaning: '', sentences: [] as string[] });
  }, [lesson, allLessons, term]);

  if (isLoadingLesson || (!info && isLoadingAll)) {
    return <h2 className="text-3xl font-black mb-2 text-black dark:text-white leading-tight">Loading...</h2>;
  }
  if (!info) return <h2 className="text-3xl font-black mb-2 text-black dark:text-white leading-tight">—</h2>;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl md:text-3xl font-black text-black dark:text-white leading-tight capitalize">
        {info.meaning}
      </h2>
      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6">
        {info.modifiers}
      </span>
      {info.sentences.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 max-w-sm w-full">
          <p className="text-gray-800 dark:text-gray-400 italic whitespace-pre-line text-left text-lg md:text-xl leading-relaxed">
            {info.sentences.map((s) => `• ${maskTermInSentence(s, term)}`).join('\n')}
          </p>
        </div>
      )}
    </div>
  );
};
