/**
 * fillPhonetics.js
 * Fetches IPA phonetic transcriptions from Free Dictionary API (with Datamuse API fallback)
 * and updates missing `phonetic` fields in the `lessons` collection in MongoDB.
 *
 * Safe to re-run: only fetches terms where `phonetic` is missing, and persists in batches.
 * Usage: node backend/scripts/fillPhonetics.js
 */
import mongoose from 'mongoose';
import { connectDB } from '../db/mongo.js';
import { Lesson } from '../models/ContentModels.js';

const CONCURRENCY = 3;
const REQUEST_DELAY_MS = 150;
const SAVE_BATCH_SIZE = 100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractDictionaryIpa = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return '';
  for (const entry of entries) {
    if (entry.phonetic && typeof entry.phonetic === 'string') {
      return entry.phonetic.trim();
    }
    if (Array.isArray(entry.phonetics)) {
      const found = entry.phonetics.find((p) => p?.text && typeof p.text === 'string');
      if (found) return found.text.trim();
    }
  }
  return '';
};

const fetchFromDictionaryApi = async (term, attempt = 1) => {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`;
  const res = await fetch(url);
  if (res.status === 429) {
    if (attempt <= 4) {
      const waitMs = 3000 * attempt;
      console.warn(`⚠️ 429 rate limit on "${term}", waiting ${waitMs}ms (attempt ${attempt})...`);
      await sleep(waitMs);
      return fetchFromDictionaryApi(term, attempt + 1);
    }
    return '';
  }
  if (!res.ok) return '';
  const data = await res.json();
  return extractDictionaryIpa(data);
};

const fetchFromDatamuseApi = async (term) => {
  const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(term)}&md=r&ipa=1&max=1`;
  const res = await fetch(url);
  if (!res.ok) return '';
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return '';
  const match = data[0];
  if (match.word?.toLowerCase() !== term.toLowerCase()) return '';
  const ipaTag = (match.tags || []).find((t) => t.startsWith('ipa_pron:'));
  if (!ipaTag) return '';
  const raw = ipaTag.slice('ipa_pron:'.length).trim();
  return raw ? `/${raw}/` : '';
};

const fetchPhonetic = async (term) => {
  try {
    const dmIpa = await fetchFromDatamuseApi(term);
    if (dmIpa) return dmIpa;
    const dictIpa = await fetchFromDictionaryApi(term);
    return dictIpa;
  } catch (err) {
    console.warn(`⚠️ Error fetching "${term}": ${err.message}`);
    return '';
  }
};

const flushUpdates = async (lessons, ipaMap) => {
  const ops = [];
  for (const lesson of lessons) {
    let changed = false;
    const updatedWords = (lesson.words || []).map((w) => {
      if (w.phonetic) return w;
      const key = (w.term || '').trim().toLowerCase();
      const ipa = ipaMap.get(key);
      if (ipa) {
        changed = true;
        return { ...w, phonetic: ipa };
      }
      return w;
    });
    if (changed) {
      lesson.words = updatedWords;
      ops.push({
        updateOne: {
          filter: { _id: lesson._id },
          update: { $set: { words: updatedWords } },
        },
      });
    }
  }
  if (ops.length > 0) {
    await Lesson.bulkWrite(ops);
  }
};

const run = async () => {
  await connectDB();
  const lessons = await Lesson.find({ 'words.0': { $exists: true } }).lean();

  const missingTermsSet = new Set();
  for (const l of lessons) {
    for (const w of l.words || []) {
      if (!w.phonetic) {
        const key = (w.term || '').trim().toLowerCase();
        if (key) missingTermsSet.add(key);
      }
    }
  }

  const terms = [...missingTermsSet];
  console.log(`📚 Found ${terms.length} unique terms missing phonetic across ${lessons.length} lessons.`);
  if (terms.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const ipaMap = new Map();
  let foundCount = 0;
  let notFoundCount = 0;
  let processed = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < terms.length) {
      const idx = cursor++;
      const term = terms[idx];
      const ipa = await fetchPhonetic(term);
      if (ipa) {
        ipaMap.set(term, ipa);
        foundCount++;
      } else {
        notFoundCount++;
      }
      processed++;

      if (processed % SAVE_BATCH_SIZE === 0) {
        await flushUpdates(lessons, ipaMap);
      }
      if (processed % 100 === 0 || processed === terms.length) {
        console.log(
          `[${processed}/${terms.length}] found: ${foundCount}, notFound: ${notFoundCount}`,
        );
      }
      await sleep(REQUEST_DELAY_MS);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  await flushUpdates(lessons, ipaMap);

  console.log(`✅ Done! Total processed: ${processed}, found: ${foundCount}, notFound: ${notFoundCount}`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('❌ Fatal error:', err);
  await mongoose.disconnect();
  process.exit(1);
});
