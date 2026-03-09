import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });


const grammarSyllabus = {
  a1: [
    { id: 'to-be-present', title: 'Động từ To Be (am/is/are)' },
    { id: 'present-simple', title: 'Thì Hiện Tại Đơn (Present Simple)' },
    { id: 'present-continuous', title: 'Thì Hiện Tại Tiếp Diễn (Present Continuous)' },
    { id: 'singular-plural-nouns', title: 'Danh từ số ít & số nhiều (Singular & Plural Nouns)' },
    { id: 'articles-a-an-the', title: 'Mạo từ (A, An, The)' },
    { id: 'demonstratives', title: 'Đại từ chỉ định (This, That, These, Those)' },
    { id: 'possessives', title: 'Tính từ & Đại từ sở hữu (Possessives)' },
    { id: 'prepositions-place-time', title: 'Giới từ chỉ thời gian & nơi chốn (In, On, At)' },
    { id: 'there-is-are', title: 'Cấu trúc There is / There are' },
    { id: 'can-ability', title: "Động từ khuyết thiếu Can / Can't (Khả năng)" }
  ],
  a2: [
    { id: 'past-simple', title: 'Thì Quá Khứ Đơn (Past Simple)' },
    { id: 'past-continuous', title: 'Thì Quá Khứ Tiếp Diễn (Past Continuous)' },
    { id: 'future-will-going-to', title: 'Thì Tương Lai (Will vs. Be going to)' },
    { id: 'comparatives-superlatives', title: 'So sánh hơn & So sánh nhất' },
    { id: 'adverbs-of-frequency', title: 'Trạng từ chỉ tần suất (Always, Usually...)' },
    { id: 'countable-uncountable', title: 'Danh từ đếm được & không đếm được' },
    { id: 'quantifiers', title: 'Lượng từ (Much, Many, A lot of, Some, Any)' },
    { id: 'modals-obligation', title: 'Động từ khuyết thiếu (Must, Have to, Should)' },
    { id: 'first-conditional', title: 'Câu điều kiện loại 1 (First Conditional)' }
  ],
  b1: [
    { id: 'present-perfect', title: 'Thì Hiện Tại Hoàn Thành (Present Perfect)' },
    { id: 'present-perfect-continuous', title: 'Thì Hiện Tại Hoàn Thành Tiếp Diễn' },
    { id: 'past-perfect', title: 'Thì Quá Khứ Hoàn Thành (Past Perfect)' },
    { id: 'second-conditional', title: 'Câu điều kiện loại 2 (Second Conditional)' },
    { id: 'passive-voice-basic', title: 'Câu bị động cơ bản (Hiện tại & Quá khứ)' },
    { id: 'reported-speech-statements', title: 'Câu tường thuật (Reported Speech - Dạng trần thuật)' },
    { id: 'used-to', title: 'Cấu trúc Used to (Thói quen trong quá khứ)' },
    { id: 'relative-clauses-basic', title: 'Mệnh đề quan hệ cơ bản (Who, Which, That, Where)' }
  ],
  b2: [
    { id: 'third-conditional', title: 'Câu điều kiện loại 3 (Third Conditional)' },
    { id: 'mixed-conditionals', title: 'Câu điều kiện hỗn hợp (Mixed Conditionals)' },
    { id: 'passive-voice-advanced', title: 'Câu bị động nâng cao (với Modal verbs, các thì hoàn thành)' },
    { id: 'reported-speech-questions', title: 'Câu tường thuật (Câu hỏi & Mệnh lệnh)' },
    { id: 'modals-deduction', title: "Động từ khuyết thiếu suy luận (Must have, Can't have, Might have)" },
    { id: 'future-perfect-continuous', title: 'Thì Tương Lai Hoàn Thành & Tương Lai Hoàn Thành Tiếp Diễn' },
    { id: 'gerunds-infinitives', title: 'Danh động từ & Động từ nguyên thể (Gerunds & Infinitives)' },
    { id: 'wish-if-only', title: 'Cấu trúc Wish / If only (Câu điều ước)' }
  ],
  c1: [
    { id: 'inversion', title: 'Đảo ngữ (Inversion with negative adverbials)' },
    { id: 'cleft-sentences', title: 'Câu chẻ (Cleft sentences - Nhấn mạnh)' },
    { id: 'participle-clauses', title: 'Mệnh đề phân từ (Participle clauses)' },
    { id: 'relative-clauses-advanced', title: 'Mệnh đề quan hệ nâng cao (Lược bỏ đại từ, giới từ lên trước)' },
    { id: 'subjunctive', title: 'Thức giả định (The Subjunctive)' },
    { id: 'advanced-conditionals', title: 'Câu điều kiện nâng cao (Đảo ngữ trong câu điều kiện)' },
    { id: 'passive-reporting-verbs', title: 'Câu bị động với động từ tường thuật (It is said that...)' },
    { id: 'discourse-markers', title: 'Từ nối & Dấu chuẩn diễn ngôn (Discourse markers)' }
  ]
};

const DUMMY_SCHEMA = `
{
  "id": "a1-to-be-present",
  "title": "Động từ To Be (Hiện tại đơn) - am/is/are",
  "level": "a1",
  "description": "Nền tảng cơ bản nhất để giới thiệu bản thân...",
  "theory": "Động từ 'To Be' mang nghĩa là 'thì, là, ở'...",
  "structures": [
    {
      "name": "Khẳng định (+)",
      "formula": "S + am / is / are + Danh từ / Tính từ",
      "example": "I am a developer. (Tôi là lập trình viên)"
    }
  ],
  "tips": [
    "💡 Mẹo nhớ nhanh 'Quy tắc bàn tay':",
    "- Ngón cái (I) luôn đi với 'am'."
  ],
  "practice": [
    {
      "question": "She ___ my best friend.",
      "options": ["am", "is", "are"],
      "answer": "is",
      "explanation": "'She' là chủ ngữ số ít (cô ấy) nên dùng 'is'."
    }
  ]
}
`;

async function generateTopic(level, topic) {
    const grammarDir = path.join(__dirname, '..', 'data', 'grammar', level);
    if (!fs.existsSync(grammarDir)) {
        fs.mkdirSync(grammarDir, { recursive: true });
    }

    const filePath = path.join(grammarDir, `${topic.id}.json`);
    
    // Skip if already generated (unless forced)
    if (fs.existsSync(filePath)) {
        console.log(`[Level ${level.toUpperCase()}] ${topic.title} already exists. Skipping.`);
        return;
    }

    console.log(`\nGenerating [Level ${level.toUpperCase()}] ${topic.title}...`);

    const prompt = `
        Bạn là một giáo viên tiếng Anh xuất sắc. Nhiệm vụ của bạn là soạn bài giảng ngữ pháp cực kỳ ĐƠN GIẢN, DỄ HIỂU, tập trung vào thực hành và có MẸO ghi nhớ nhanh cho người học tiếng Anh.
        
        Chủ đề hiện tại: "${topic.title}" (Trình độ: ${level.toUpperCase()})
        ID của bài: "${level}-${topic.id}"

        Hãy cung cấp dữ liệu bằng tiếng Việt VÀ định dạng thành một đoạn văn bản JSON HỢP LỆ THEO ĐÚNG CẤU TRÚC SAU:
        ${DUMMY_SCHEMA}

        Yêu cầu:
        1. "theory": Giải thích thật ngắn gọn, tránh ngôn ngữ học thuật quá mức.
        2. "structures": Liệt kê 2-4 cấu trúc quan trọng nhất kèm công thức và ví dụ (có dịch nghĩa).
        3. "tips": Phải có ít nhất 2 mẹo/tip/trick ngắn gọn giúp nhớ lâu.
        4. "practice": Ít nhất 4 câu trắc nghiệm (3 đáp án) để thực hành. Kèm lời giải thích tại sao chọn đáp án đó.
        
        Chỉ trả về ĐÚNG 1 FILE JSON, KHÔNG THÊM BẤT KỲ ĐOẠN VĂN BẢN MARKDOWN HAY BÌNH LUẬN NÀO KHÁC BÊN NGOÀI JSON! Trả về bắt đầu bằng dấu ngoặc nhọn { và kết thúc bằng ngoặc nhọn }.
    `;

    try {
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        
        let text = result.text || '{}';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Find JSON boundaries
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            console.error(`❌ Không tìm thấy JSON hợp lệ trong phản hồi cho ${topic.id}`);
            return;
        }

        const jsonString = text.substring(firstBrace, lastBrace + 1);
        try {
            const data = JSON.parse(jsonString);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Saved ${topic.id}.json`);
        } catch (parseError) {
            console.error(`❌ Lỗi Parse JSON cho ${topic.id}:`, parseError.message);
        }
        await new Promise(r => setTimeout(r, 2000));
        
    } catch (error) {
        console.error(`❌ Error generating ${topic.id}:`, error.message);
        await new Promise(r => setTimeout(r, 5000));
    }
}

async function main() {
    const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];
    
    for (const level of levels) {
        console.log(`\n============================`);
        console.log(`🚀 BẮT ĐẦU LEVEL: ${level.toUpperCase()}`);
        console.log(`============================`);
        
        const topics = grammarSyllabus[level];
        for (const topic of topics) {
            await generateTopic(level, topic);
        }
    }
    console.log('\n✨ ĐÃ TẠO XONG TOÀN BỘ GIÁO TRÌNH NGỮ PHÁP!');
}

main();
