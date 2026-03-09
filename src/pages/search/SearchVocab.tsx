import React, { useState } from 'react';
import { useAllLessonWords } from '../../hooks/useApi';
import type { VocabWord } from '../../types';
import { useTTS } from '../../hooks/useTTS';
import { Search, Volume2, BookOpen } from 'lucide-react';

type SearchResult = VocabWord & { lessonId: string; lessonName: string; level: string };

const LEVEL_COLORS: Record<string, string> = {
  a1: 'bg-lime-300 text-black',
  a2: 'bg-yellow-300 text-black',
  b1: 'bg-orange-400 text-black',
  b2: 'bg-red-400 text-white',
  c1: 'bg-blue-400 text-white',
};

export const SearchVocab: React.FC = () => {
  const [query, setQuery] = useState('');
  const { speak } = useTTS();

  const { data: allWords = [], isLoading } = useAllLessonWords();

  const term = query.trim().toLowerCase();
  const results: SearchResult[] = React.useMemo(() => {
    if (term.length < 2) return [];
    
    const filtered = (allWords as SearchResult[]).filter(
      (w) =>
        w.term.toLowerCase().includes(term) ||
        (w.meaning && w.meaning.toLowerCase().includes(term)),
    );

    // Consolidate results by term
    const map = new Map<string, SearchResult>();
    filtered.forEach((current) => {
      const key = current.term.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        if (!existing.modifiers.toLowerCase().includes(current.modifiers.toLowerCase())) {
          existing.modifiers += `, ${current.modifiers}`;
        }
        if (!existing.meaning.includes(current.meaning)) {
          existing.meaning += `; ${current.meaning}`;
        }
      } else {
        map.set(key, { ...current });
      }
    });

    return Array.from(map.values()).slice(0, 50);
  }, [allWords, term]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3 mb-2 tracking-tight">
          <span className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-lg transform -rotate-3 border-2 border-transparent">
            <Search className="w-8 h-8" strokeWidth={2.5} />
          </span>
          DICTIONARY
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Search across all {isLoading ? '...' : allWords.length.toLocaleString()} words
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by English word or Vietnamese meaning..."
          className="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-4 border-black dark:border-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] outline-none text-lg font-bold transition-all"
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full" />
        </div>
      )}

      {!isLoading && term.length > 0 && term.length < 2 && (
        <p className="text-center py-8 text-gray-500 font-medium">Type at least 2 characters to search</p>
      )}

      {!isLoading && term.length >= 2 && results.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-2xl font-black uppercase text-black dark:text-white">No Results</p>
          <p className="text-gray-500 font-medium">No words found matching &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-black uppercase tracking-widest text-gray-500">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((word, i) => (
            <div
              key={`${word.lessonId}/${word.term}/${i}`}
              className="flex items-start justify-between gap-4 p-5 bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="text-2xl font-black lowercase text-black dark:text-white">{word.term}</span>
                  {word.modifiers && (
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 italic">{word.modifiers}</span>
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-3">
                  {word.meaning || '—'}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border-2 border-black ${LEVEL_COLORS[word.level] ?? 'bg-gray-200 text-black'}`}>
                    {word.level.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <BookOpen className="w-3.5 h-3.5" /> {word.lessonName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label={`Pronounce ${word.term}`}
                onClick={() => speak(word.term)}
                className="shrink-0 p-3 bg-black text-white dark:bg-white dark:text-black rounded-xl border-2 border-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-0 active:shadow-none transition-all"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
