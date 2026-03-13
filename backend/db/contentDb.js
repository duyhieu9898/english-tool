/**
 * db/contentDb.js — read-only loaders with simple in-memory cache.
 * Cache is invalidated only on process restart (appropriate for static JSON files).
 */
import fs from 'fs';
import path from 'path';
import { CLASSIFIED_PATH, GRAMMAR_DIR, READING_DIR } from './paths.js';

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'];

// ── cache ──────────────────────────────────────────────────────────────────
let _lessons = null;
let _grammar = null;
let _reading = null;

// ── helpers ────────────────────────────────────────────────────────────────
function readJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .flatMap(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        return [{ file: file.replace('.json', ''), content }];
      } catch {
        return [];
      }
    });
}

// ── public loaders ─────────────────────────────────────────────────────────
function loadLessons() {
  if (_lessons) return _lessons;
  const raw = JSON.parse(fs.readFileSync(CLASSIFIED_PATH, 'utf-8'));
  _lessons = raw.map(lesson => ({
    id:        lesson.id,
    slug:      lesson.slug,
    level:     lesson.level,
    name:      lesson.category,
    wordCount: new Set(lesson.words.map(w => w.word.toLowerCase().trim())).size,
    words:     lesson.words.map(w => ({
      term:          w.word,
      meaning:       w.meaning,
      full_sentence: w.full_sentence,
      modifiers:     w.class,
    })),
  }));
  return _lessons;
}

function loadGrammar() {
  if (_grammar) return _grammar;
  let id = 1;
  _grammar = LEVELS.flatMap(level => {
    const files = readJsonFiles(path.join(GRAMMAR_DIR, level));
    return files.map(({ file, content }) => ({
      id:          id++,
      slug:        content.id || `${level}-${file}`,
      level:       content.level || level,
      title:       content.title || file,
      description: content.description || '',
      theory:      content.theory || '',
      structures:  content.structures || [],
      tips:        content.tips || [],
      practice:    content.practice || [],
    }));
  });
  return _grammar;
}

function loadReading() {
  if (_reading) return _reading;
  let id = 1;
  _reading = LEVELS.flatMap(level => {
    const files = readJsonFiles(path.join(READING_DIR, level));
    return files.map(({ file, content }) => ({
      id:                    id++,
      slug:                  content.id || `${level}-${file}`,
      level:                 content.level || level,
      title:                 content.title || file,
      topic:                 content.topic || '',
      content:               content.content || '',
      vocabulary_highlights: content.vocabulary_highlights || [],
      questions:             content.questions || [],
      translation:           content.translation || '',
    }));
  });
  return _reading;
}

export { loadLessons, loadGrammar, loadReading };
