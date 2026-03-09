import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Manually parse .env to avoid 'dotenv' dependency issues
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
        }
    });
}

// Ensure the API key exists
if (!process.env.VITE_GEMINI_API_KEY) {
    console.error('❌ Error: VITE_GEMINI_API_KEY is not defined in the environment.');
    process.exit(1);
}

const csvFilePath = path.join(__dirname, '..', 'oxford-5000.csv');

// Robust CSV Line parser to handle commas inside quotes
function parseCsvLine(text) {
    let p = '', row = [''], i = 0, s = true;
    for (let l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) {
            row[++i] = '';
        } else {
            row[i] += l;
        }
        p = l;
    }
    return row.map(cell => cell.trim());
}

// Escape strings for CSV properly
function escapeCsv(str) {
    if (str == null) return '';
    const stringified = String(str);
    if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return '"' + stringified.replace(/"/g, '""') + '"';
    }
    return stringified;
}

// Save entries atomically to prevent corruption
function saveCSV(entries) {
    const lines = ['word,class,level,meaning,full_sentence,category'];
    for (const e of entries) {
        const row = [
            escapeCsv(e.word),
            escapeCsv(e.class),
            escapeCsv(e.level),
            escapeCsv(e.meaning),
            escapeCsv(e.full_sentence),
            escapeCsv(e.category)
        ];
        lines.push(row.join(','));
    }
    const tempFile = csvFilePath + '.' + Date.now() + '_' + Math.random().toString(36).substring(2) + '.tmp';
    fs.writeFileSync(tempFile, lines.join('\n'));
    fs.renameSync(tempFile, csvFilePath);
}

// Function to call Gemini using native node fetch (requires Node 18+)
async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`;
    const payload = {
        system_instruction: {
            parts: [{ text: 'You are an exact English-Vietnamese dictionary assistant. You ONLY define the specific words given in the input JSON. You NEVER invent or substitute different words. You ALWAYS return a valid JSON array.' }]
        },
        contents: [
            { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Gemini API Error: ${data.error?.message || JSON.stringify(data)}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini.');
    }

    return data.candidates[0].content.parts[0].text;
}

// Build a prompt for a given batch
function buildPrompt(batch) {
    // Use simple numeric keys so Gemini doesn't get confused by field names
    const inputData = batch.map((b, i) => ({ id: i, word: b.word, class: b.class, level: b.level }));

    return `You are an English-Vietnamese dictionary API.
I will send you a JSON array of words. You must return a JSON array with EXACTLY the same words defined.

STRICT RULES:
- Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
- The output array must have the SAME number of items as the input.
- For each item, keep the SAME "id", "word", "class", "level" from the input.
- Add these 3 fields for each item:
  * "meaning": short Vietnamese definition matching the part of speech.
  * "full_sentence": one natural English example sentence using this exact word.
  * "category": one specific topic (e.g., Health, Technology, Travel, Science, Emotions).
- DO NOT change or replace any "word" value. Define ONLY the words provided.

INPUT (${batch.length} words):
${JSON.stringify(inputData, null, 2)}

OUTPUT (must be a valid JSON array of ${batch.length} objects):`;
}

async function processWords() {
    // 1. Read existing CSV
    if (!fs.existsSync(csvFilePath)) {
        console.error('❌ Error: oxford-5000.csv not found at', csvFilePath);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const rawLines = fileContent.split('\n').filter(line => line.trim().length > 0);

    let entries = [];
    // Start from 1 to skip header
    for (let i = 1; i < rawLines.length; i++) {
        const row = parseCsvLine(rawLines[i].trim());
        entries.push({
            word: row[0] || '',
            class: row[1] || '',
            level: row[2] || '',
            meaning: row[3] || '',
            full_sentence: row[4] || '',
            category: row[5] || ''
        });
    }

    const batchSize = 5;        // Smaller batch = less chance of AI dropping words
    const concurrency = 5;      // 5 parallel workers
    let consecutiveFailedPasses = 0;

    console.log(`🚀 Starting to scan ${entries.length} words in oxford-5000.csv...`);

    // Worker function — defined once, reused across passes
    const processWorker = async (workerId, toProcess, processingIndexRef, passUpdatedCountRef) => {
        while (true) {
            const startIndex = processingIndexRef.value;
            if (startIndex >= toProcess.length) break;
            processingIndexRef.value += batchSize;

            const batch = toProcess.slice(startIndex, startIndex + batchSize);
            if (batch.length === 0) break;

            const progressEnd = Math.min(startIndex + batch.length, toProcess.length);
            console.log(`[Worker ${workerId}] Processing ${batch.map(b => b.word).join(', ')} (${progressEnd}/${toProcess.length})`);

            const prompt = buildPrompt(batch);
            let success = false;
            let attempts = 0;

            while (!success && attempts < 3) {
                try {
                    attempts++;
                    const resultText = await callGemini(prompt);

                    // --- Parse JSON robustly ---
                    let text = (resultText || '').replace(/```json/g, '').replace(/```/g, '').trim();

                    // Find the first [...] array in the response
                    const arrayStart = text.indexOf('[');
                    const arrayEnd = text.lastIndexOf(']');
                    if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
                        throw new Error('No JSON array found in response.');
                    }
                    const jsonText = text.slice(arrayStart, arrayEnd + 1);
                    const data = JSON.parse(jsonText);

                    if (!Array.isArray(data)) {
                        throw new Error('Parsed result is not a JSON array.');
                    }

                    if (data.length === 0) {
                        throw new Error('API returned an empty array.');
                    }

                    // --- Merge definitions back using "id" + "word" double verification ---
                    let updatedCount = 0;
                    for (const item of data) {
                        const id = item.id;

                        // Validate id
                        if (id === undefined || id < 0 || id >= batch.length) {
                            console.warn(`[Worker ${workerId}] Invalid id=${id}, skipping.`);
                            continue;
                        }

                        const entry = batch[id];

                        // Validate word match
                        if (!item.word || entry.word.trim().toLowerCase() !== item.word.trim().toLowerCase()) {
                            console.warn(`[Worker ${workerId}] Word mismatch: expected "${entry.word}", got "${item.word}". Skipping.`);
                            continue;
                        }

                        // Validate required fields
                        if (!item.meaning || !item.full_sentence || !item.category) {
                            console.warn(`[Worker ${workerId}] Missing fields for "${entry.word}". Skipping.`);
                            continue;
                        }

                        entry.meaning = item.meaning;
                        entry.full_sentence = item.full_sentence;
                        entry.category = item.category;
                        updatedCount++;
                    }

                    if (updatedCount === 0) {
                        throw new Error('No words were matched or updated. Triggering retry.');
                    }

                    passUpdatedCountRef.value += updatedCount;

                    // Atomic save
                    try { saveCSV(entries); } catch (_) { /* ignore race condition */ }

                    console.log(`[Worker ${workerId}] ✅ Updated ${updatedCount}/${batch.length} words.`);
                    success = true;
                    await new Promise(r => setTimeout(r, 800));

                } catch (error) {
                    console.error(`[Worker ${workerId}] ❌ Attempt ${attempts} failed: ${error.message}`);
                    if (attempts < 3) {
                        console.log(`[Worker ${workerId}] Retrying in 5 seconds...`);
                        await new Promise(r => setTimeout(r, 5000));
                    }
                }
            }
        }
    };

    while (true) {
        const toProcess = entries.filter(e => !e.meaning || e.meaning.trim() === '');
        if (toProcess.length === 0) {
            console.log('\n✨ All words have been successfully processed!');
            break;
        }

        console.log(`\nRemaining to update: ${toProcess.length} words.`);

        // Use ref objects so workers can share mutable state
        const processingIndexRef = { value: 0 };
        const passUpdatedCountRef = { value: 0 };

        const workers = Array.from({ length: concurrency }, (_, i) =>
            processWorker(i + 1, toProcess, processingIndexRef, passUpdatedCountRef)
        );
        await Promise.all(workers);

        if (passUpdatedCountRef.value === 0) {
            consecutiveFailedPasses++;
            if (consecutiveFailedPasses >= 3) {
                console.log('\n⚠️ 3 consecutive passes with no updates. Stopping to avoid infinite loop.');
                break;
            }
        } else {
            consecutiveFailedPasses = 0;
        }
    }
}

// Execute
processWords();
