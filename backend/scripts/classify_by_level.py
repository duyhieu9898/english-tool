#!/usr/bin/env python3
"""
classify_by_level.py

Reads oxford-5000.csv and produces oxford_classified.json
with the flat array structure:
[
  {
    "id": 1,
    "level": "a1",
    "category": "Academic Skills",
    "slug": "a1/academic-skills",
    "words": [
      { "word": "dictionary", "class": "noun", "meaning": "...", "full_sentence": "..." },
      ...
    ]
  },
  ...
]
"""

import csv
import json
import os
import re
from collections import defaultdict

# ── Paths ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(SCRIPT_DIR, '..', 'oxford-5000.csv')
OUT_PATH   = os.path.join(SCRIPT_DIR, '..', 'oxford_classified.json')

LEVEL_ORDER = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']


def slugify(text: str) -> str:
    text = text.replace('&', 'and')
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9\s-]', '', text.lower()).strip()).replace(' ', '-')


def main():
    if not os.path.exists(CSV_PATH):
        print(f"❌  File not found: {CSV_PATH}")
        return

    # data[level][category] = list of word dicts
    data: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))

    total = 0
    skipped = 0

    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            word     = row.get('word', '').strip()
            cls      = row.get('class', '').strip()
            level    = row.get('level', '').strip().lower()
            meaning  = row.get('meaning', '').strip()
            sentence = row.get('full_sentence', '').strip()
            category = row.get('category', '').strip() or 'Uncategorized'

            if not word:
                skipped += 1
                continue

            if not level:
                level = 'unknown'

            # No redundant `category` field inside each word
            data[level][category].append({
                'word':          word,
                'class':         cls,
                'meaning':       meaning,
                'full_sentence': sentence,
            })
            total += 1

    # ── Build flat array ───────────────────────────────────────────────────
    def level_key(lvl):
        try:
            return LEVEL_ORDER.index(lvl)
        except ValueError:
            return len(LEVEL_ORDER)

    lessons = []
    lesson_id = 1

    for level in sorted(data.keys(), key=level_key):
        for category in sorted(data[level].keys()):
            words = sorted(data[level][category], key=lambda x: x['word'].lower())
            if not words:
                continue
            lessons.append({
                'id':       lesson_id,
                'level':    level,
                'category': category,
                'slug':     f"{level}/{slugify(category)}",
                'words':    words,
            })
            lesson_id += 1

    # ── Write JSON ─────────────────────────────────────────────────────────
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)

    # ── Summary ────────────────────────────────────────────────────────────
    print(f"✅  Done! Processed {total} words  (skipped {skipped} empty rows)")
    print(f"📄  Output: {os.path.abspath(OUT_PATH)}\n")

    by_level = {}
    for l in lessons:
        by_level.setdefault(l['level'], []).append(l)

    print(f"{'Level':<10} {'Lessons':>10} {'Words':>8}")
    print('-' * 32)
    for level in LEVEL_ORDER:
        if level not in by_level:
            continue
        lvl_lessons = by_level[level]
        word_count = sum(len(l['words']) for l in lvl_lessons)
        print(f"  {level:<8} {len(lvl_lessons):>10} {word_count:>8}")
    print('-' * 32)
    grand_total = sum(len(l['words']) for l in lessons)
    print(f"  {'TOTAL':<8} {len(lessons):>10} {grand_total:>8}")


if __name__ == '__main__':
    main()
