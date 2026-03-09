import React from 'react';
import { useLesson } from '../../hooks/useApi';

interface LessonMeaningProps {
  term: string;
  lessonId: string;
}

/**
 * Shared component to display consolidated meanings/modifiers for a term.
 * Searches for all occurrences of the term in a lesson to handle multi-function words.
 */
export const LessonMeaning: React.FC<LessonMeaningProps> = ({ term, lessonId }) => {
  const { data: lesson, isLoading } = useLesson(lessonId);

  const info = React.useMemo(() => {
    if (!lesson) return null;
    const matches = lesson.words.filter((w) => w.term.toLowerCase() === term.toLowerCase());
    if (matches.length === 0) return null;

    return matches.reduce((acc, curr) => ({
      modifiers: acc.modifiers.includes(curr.modifiers) ? acc.modifiers : (acc.modifiers ? `${acc.modifiers}, ${curr.modifiers}` : curr.modifiers),
      meaning: acc.meaning.includes(curr.meaning) ? acc.meaning : (acc.meaning ? `${acc.meaning}; ${curr.meaning}` : curr.meaning),
      sentences: acc.sentences.includes(curr.full_sentence) ? acc.sentences : [...acc.sentences, curr.full_sentence]
    }), { modifiers: '', meaning: '', sentences: [] as string[] });
  }, [lesson, term]);

  if (isLoading) return <h2 className="text-3xl font-black mb-2 text-black dark:text-white leading-tight">Loading...</h2>;
  if (!info) return <h2 className="text-3xl font-black mb-2 text-black dark:text-white leading-tight">—</h2>;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-black text-black dark:text-white mb-2 leading-tight">
        {info.meaning}
      </h2>
      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6">
        {info.modifiers}
      </span>
      {info.sentences.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 max-w-sm w-full">
          <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-tighter">Usage Examples</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic whitespace-pre-line text-left">
            {info.sentences.map(s => `• ${s}`).join('\n')}
          </p>
        </div>
      )}
    </div>
  );
};
