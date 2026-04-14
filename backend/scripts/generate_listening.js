import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const LISTENING_SCHEMA = `
{
  "id": "b2-listening-2",
  "title": "The Widening Gap: Understanding Economic Inequality in the Modern World",
  "level": "b2",
  "topic": "Economic Inequality in the Modern World",
  "questions": [
    {
      "id": "1",
      "sentence": "Economic inequality, the stark disparity in wealth and income distribution, has become a defining challenge of the modern world."
    }
  ]
}
`;

async function generateListening(level, index) {
    const readingDir = path.join(__dirname, '..', 'data', 'reading', level);
    const readingId = `${level}-reading-${index + 1}`;
    const readingFilePath = path.join(readingDir, `${readingId}.json`);
    
    if (!fs.existsSync(readingFilePath)) {
        return;
    }

    const listeningDir = path.join(__dirname, '..', 'data', 'listening', level);
    if (!fs.existsSync(listeningDir)) {
        fs.mkdirSync(listeningDir, { recursive: true });
    }

    const listeningId = `${level}-listening-${index + 1}`;
    const listeningFilePath = path.join(listeningDir, `${listeningId}.json`);
    
    // Skip if already generated
    if (fs.existsSync(listeningFilePath)) {
        console.log(`[Level ${level.toUpperCase()}] ${listeningId} already exists. Skipping.`);
        return;
    }

    const readingData = JSON.parse(fs.readFileSync(readingFilePath, 'utf-8'));
    console.log(`\nGenerating [Level ${level.toUpperCase()}] listening ${index+1}/40: "${readingData.topic}"...`);

    const prompt = `
        You are an expert English curriculum designer. I will give you a reading passage.
        Your task is to extract 4 to 6 key sentences from this passage to create a listening dictation exercise.
        
        RULES:
        1. Extract exactly 4 to 6 sentences.
        2. DO NOT alter, rewrite, or invent any text. The sentences MUST be EXACT matches from the original passage (including punctuation).
        3. Pick sentences that summarize the main points (e.g., topic sentences of paragraphs).
        4. Sentences should be of a reasonable length for dictation (not too short, not excessively long).
        
        Reading Passage:
        "${readingData.content}"

        Provide the output AS A STRICT VALID JSON OBJECT exactly matching this schema:
        ${LISTENING_SCHEMA}

        Requirements for JSON values:
        1. "id": "${listeningId}"
        2. "level": "${level}"
        3. "topic": "${readingData.topic}"
        4. "title": "${readingData.title}"
        5. "questions": Array of objects, each containing an "id" (string starting from "1") and "sentence" (the exact extracted sentence).

        RETURN ONLY JSON. START WITH { AND END WITH }.
    `;

    try {
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        
        let text = result.text || '{}';
        text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            console.error(`❌ Không tìm thấy JSON hợp lệ cho ${listeningId}`);
            return;
        }

        const jsonString = text.substring(firstBrace, lastBrace + 1);
        
        try {
            const data = JSON.parse(jsonString);
            fs.writeFileSync(listeningFilePath, JSON.stringify(data, null, 2));
            console.log(`✅ Saved ${listeningId}.json`);
        } catch (parseError) {
            console.error(`❌ Lỗi Parse JSON cho ${listeningId}:`, parseError.message);
        }
        
        // Rate limit delay
        await new Promise(r => setTimeout(r, 2000));
        
    } catch (error) {
        console.error(`❌ Error generating ${listeningId}:`, error.message);
        await new Promise(r => setTimeout(r, 5000));
    }
}

async function main() {
    const levels = ['b2', 'c1'];
    
    let tasks = [];
    for (const level of levels) {
        for (let i = 0; i < 40; i++) {
            tasks.push({ level, index: i });
        }
    }
    
    const CONCURRENCY_LIMIT = 5; // To avoid hitting rate limits
    
    for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
        const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT);
        console.log(`\n============================`);
        console.log(`🚀 BẮT ĐẦU CHUNK ${Math.floor(i/CONCURRENCY_LIMIT) + 1}/${Math.ceil(tasks.length/CONCURRENCY_LIMIT)}`);
        console.log(`============================`);
        
        await Promise.all(chunk.map(task => generateListening(task.level, task.index)));
    }
    
    console.log('\n✨ ĐÃ TẠO XONG TOÀN BỘ BÀI NGHE!');
}

main();
