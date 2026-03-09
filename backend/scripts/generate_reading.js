import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });


const READING_TOPICS = {
  a1: [
    "Daily Routine", "My Family", "At the Supermarket", "My Favorite Hobby", "A Day at School",
    "My Best Friend", "My Pets", "Weekend Activities", "My Home", "Cooking a Simple Meal",
    "Going to the Doctor", "Weather and Seasons", "My Favorite Food", "Taking a Bus", "Shopping for Clothes",
    "A Birthday Party", "Watching TV", "My City", "A Visit to the Park", "Learning English"
  ],
  a2: [
    "Planning a Vacation", "My Dream Job", "A Memorable Childhood Story", "Technology in Daily Life", "Healthy Habits",
    "Describing a Movie", "A Bad Day", "An Interesting Museum", "My Favorite Music", "Living in the City vs Country",
    "A Family Tradition", "My First Trip Abroad", "Shopping Online", "Climate Control", "Transport and Travel",
    "Working from Home", "Sports and Fitness", "A Local Festival", "Eating Out at a Restaurant", "A Surprising Event"
  ],
  b1: [
    "The Importance of Sleep", "Social Media: Pros and Cons", "A Review of a Book", "Sustainable Living", "Overcoming a Fear",
    "The Future of Transportation", "Cultural Differences I've Experienced", "The Value of Volunteering", "Artificial Intelligence Basics", "An Unforgettable Adventure",
    "How to Manage Stress", "The Evolution of Smart Phones", "Fasting and Dieting Trends", "Space Exploration", "The Impact of Fast Fashion",
    "Learning a Second Language", "Why History Matters", "My Biggest Achievement", "Remote Work Evolution", "The Changing Climate"
  ],
  b2: [
    "The Psychology of Decision Making", "Economic Inequality in the Modern World", "The Ethics of Artificial Intelligence", "The Role of Media in Democracy", "A Critical Review of a Film",
    "The Impact of Globalization on Local Cultures", "Space Tourism: The Next Frontier?", "The History and Future of Cryptocurrencies", "Mental Health in the Workplace", "The Shift Towards Renewable Energy",
    "How Algorithms Shape Our Worldview", "The Paradox of Choice", "The Future of Education: Online vs Traditional", "The gig economy and worker rights", "The Science of Habit Formation",
    "Urban Planning and Smart Cities", "The Influence of Art on Society", "Privacy in the Digital Age", "The Evolution of Consumerism", "Genetic Engineering: Possibilities and Perils"
  ],
  c1: [
    "The Philosophical Implications of Quantum Mechanics", "Deconstructing Postmodern Literature", "The Sociopolitical Impact of Deepfakes", "Neuroplasticity and the Aging Brain", "The Aesthetics of Brutalist Architecture",
    "The Economic Ramifications of Universal Basic Income", "Linguistic Determinism and Thought", "The Nuances of International Diplomacy", "The Paradox of Tolerance in a Free Society", "The Epistemology of Truth in the Digital Era",
    "A Critical Analysis of Neoliberal Economic Policies", "The Existential Threat of Superintelligent AI", "The Intersection of Art and Activism", "The Complexities of Neurodiversity", "The Illusion of Free Will",
    "The Socio-Economic Impact of Demographic Shifts", "The Metaphysics of Time Travel", "The Role of Microbes in Human Health", "The Evolution of Human Consciousness", "The Dark Matter and Dark Energy Enigma"
  ]
};

const DUMMY_SCHEMA = `
{
  "id": "a1-reading-1",
  "title": "A Day in the Life of a Student",
  "level": "a1",
  "topic": "Daily Routine",
  "content": "My name is John. I am a student. I wake up at 7 o'clock every morning...",
  "vocabulary_highlights": [
    { "word": "wake up", "meaning": "thức dậy" }
  ],
  "questions": [
    {
      "question": "What time does John wake up?",
      "options": ["6 o'clock", "7 o'clock", "8 o'clock"],
      "answer": "7 o'clock",
      "explanation": "Đoạn văn có ghi: 'I wake up at 7 o'clock every morning'."
    }
  ],
  "translation": "Tên tôi là John. Tôi là một học sinh..."
}
`;

function countWords(str) {
  return str.split(/\\s+/).filter(word => word.length > 0).length;
}

// Ensure length targets roughly match level difficulty
const LENGTH_TARGETS = {
    a1: "80-120 words",
    a2: "150-200 words",
    b1: "250-350 words",
    b2: "400-550 words",
    c1: "600-800 words"
};


async function generateReading(level, index, topicName) {
    const readingDir = path.join(__dirname, '..', 'data', 'reading', level);
    if (!fs.existsSync(readingDir)) {
        fs.mkdirSync(readingDir, { recursive: true });
    }

    const readingId = `${level}-reading-${index + 1}`;
    const filePath = path.join(readingDir, `${readingId}.json`);
    
    // Skip if already generated
    if (fs.existsSync(filePath)) {
        console.log(`[Level ${level.toUpperCase()}] ${readingId} - ${topicName} already exists. Skipping.`);
        return;
    }

    console.log(`\nGenerating [Level ${level.toUpperCase()}] reading ${index+1}/20: "${topicName}"...`);

    const prompt = `
        You are an expert English curriculum designer creating reading materials for an English learning app.
        
        Write an English reading passage about: "${topicName}"
        Target CEFR Level: ${level.toUpperCase()}
        Target Length: ${LENGTH_TARGETS[level]}
        
        Guidelines for level ${level.toUpperCase()}:
        - Vocabulary and grammar MUST be appropriate precisely for CEFR ${level.toUpperCase()}.
        - Ensure sentences are naturally flowing. No robotic text.
        
        Provide the output AS A STRICT VALID JSON OBJECT exactly matching this schema:
        ${DUMMY_SCHEMA}

        Requirements for JSON values:
        1. "id": "${readingId}"
        2. "level": "${level}"
        3. "topic": "${topicName}"
        4. "title": Provide a catchy title in English.
        5. "content": The English reading passage itself.
        6. "vocabulary_highlights": Pick 4-8 important/useful words or expressions from the passage and provide their Vietnamese meaning.
        7. "questions": Create exactly 3 multiple-choice reading comprehension questions (3 options each). Provide the answer and a Vietnamese explanation.
        8. "translation": Provide a natural-sounding Vietnamese translation of the entire "content".

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
            console.error(`❌ Không tìm thấy JSON hợp lệ cho ${readingId}`);
            return;
        }

        const jsonString = text.substring(firstBrace, lastBrace + 1);
        
        try {
            const data = JSON.parse(jsonString);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Saved ${readingId}.json (${countWords(data.content)} words)`);
        } catch (parseError) {
            console.error(`❌ Lỗi Parse JSON cho ${readingId}:`, parseError.message);
        }
        
        // Rate limit delay
        await new Promise(r => setTimeout(r, 2000));
        
    } catch (error) {
        console.error(`❌ Error generating ${readingId}:`, error.message);
        await new Promise(r => setTimeout(r, 5000));
    }
}

async function main() {
    const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];
    
    // We will generate all tasks in parallel, with a concurrency limit
    let tasks = [];
    for (const level of levels) {
        const topics = READING_TOPICS[level];
        for (let i = 0; i < topics.length; i++) {
            tasks.push({ level, index: i, topicName: topics[i] });
        }
    }
    
    const CONCURRENCY_LIMIT = 5;
    
    for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
        const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT);
        console.log(`\n============================`);
        console.log(`🚀 BẮT ĐẦU CHUNK ${Math.floor(i/CONCURRENCY_LIMIT) + 1}/${Math.ceil(tasks.length/CONCURRENCY_LIMIT)}`);
        console.log(`============================`);
        
        await Promise.all(chunk.map(task => generateReading(task.level, task.index, task.topicName)));
    }
    
    console.log('\n✨ ĐÃ TẠO XONG TOÀN BỘ 100 BÀI ĐỌC!');
}

main();
