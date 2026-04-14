/**
 * Pure functions cho Listening module.
 * Không import React — test bằng unit test thuần.
 */

/**
 * Normalize text để so sánh answer: lowercase, bỏ dấu câu, trim khoảng trắng thừa.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*:{}=\-_`~()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Tạo masked sentence cho cloze hint: giữ nguyên space + dấu câu,
 * mask ~50% ký tự chữ/số thành '_'.
 */
export function generateMaskedSentence(sentence: string): string {
  return sentence
    .split('')
    .map((char) => {
      if (!/[a-zA-Z0-9]/.test(char)) return char;
      return Math.random() > 0.5 ? char : '_';
    })
    .join('');
}
