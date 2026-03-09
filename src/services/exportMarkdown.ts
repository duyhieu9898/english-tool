export const exportToMarkdown = (
  dateStr: string,
  remembered: { term: string; meaning: string; level?: number }[],
  forgotten: { term: string; meaning: string; lesson: string }[],
) => {
  const content = [
    `# General Review - ${dateStr}`,
    '',
    `## ✅ Đã nhớ (${remembered.length}/${remembered.length + forgotten.length})`,
    '| Từ | Nghĩa | Level |',
    '|---|---|---|',
    ...remembered.map((w) => `| ${w.term} | ${w.meaning || '—'} | ${w.level || '—'} |`),
    '',
    `## ❌ Cần ôn lại (${forgotten.length}/${remembered.length + forgotten.length}) → Đã thêm vào Daily Review`,
    '| Từ | Nghĩa | Lesson |',
    '|---|---|---|',
    ...forgotten.map((w) => `| ${w.term} | ${w.meaning || '—'} | ${w.lesson} |`),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `general-review-${dateStr}.md`;
  a.click();

  URL.revokeObjectURL(url);
};
