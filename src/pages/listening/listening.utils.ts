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
    .replace(/[.,/#!$%^&*:{}=\-_`~()']/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}