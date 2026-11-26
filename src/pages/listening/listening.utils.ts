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
    .replace(/[.,/#!?$%^&*:{}=\-_`~()'"[\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface WordDiffResult {
  matched: boolean[];
  extraWords: string[];
}

/**
 * So sánh mảng từ đáp án với mảng từ người dùng nhập bằng thuật toán LCS,
 * trả về danh sách khớp cho từng từ đáp án và các từ người dùng gõ dư.
 */
export function diffWords(targetWords: string[], inputWords: string[]): WordDiffResult {
  const normTarget = targetWords.map(normalizeText);
  const cleanInput = inputWords.filter((w) => normalizeText(w).length > 0);
  const normInput = cleanInput.map(normalizeText);

  const n = normTarget.length;
  const m = normInput.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (normTarget[i] === normInput[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const matched = Array<boolean>(n).fill(false);
  const extraWords: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (!normTarget[i]) {
      matched[i] = true;
      i++;
    } else if (normTarget[i] === normInput[j]) {
      matched[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      extraWords.push(cleanInput[j]);
      j++;
    }
  }
  while (j < m) {
    extraWords.push(cleanInput[j]);
    j++;
  }

  return { matched, extraWords };
}

/**
 * So sánh mảng từ đáp án với mảng từ người dùng nhập bằng thuật toán LCS
 * để không bị lệch index khi người dùng gõ thừa hoặc thiếu từ ở giữa câu.
 */
export function matchWords(targetWords: string[], inputWords: string[]): boolean[] {
  return diffWords(targetWords, inputWords).matched;
}