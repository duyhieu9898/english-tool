#!/usr/bin/env python3
"""
migrate_to_flat.py

Converts oxford_classified.json from nested structure:
  { "a1": { "Category Name": [ { word, class, meaning, full_sentence, category } ] } }

To a clean flat array:
  [ { id, level, category, slug, words: [ { word, class, meaning, full_sentence } ] } ]

- Removes redundant `category` field inside each word object
- Assigns stable sequential IDs matching previous server logic (sorted by CEFR level then alpha)
- Backs up original file first
"""

import json, os, re, shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(SCRIPT_DIR, '..', 'oxford_classified.json')
BAK = SRC + '.bak'

LEVEL_ORDER = ['a1', 'a2', 'b1', 'b2', 'c1']


def slugify(text: str) -> str:
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9\s-]', '', text.lower()).strip()).replace(' ', '-')


def main():
    with open(SRC, encoding='utf-8') as f:
        old = json.load(f)

    # Backup original
    shutil.copy(SRC, BAK)
    print(f"📦 Backup saved → {BAK}")

    lessons = []
    lesson_id = 1

    levels = sorted(old.keys(), key=lambda l: LEVEL_ORDER.index(l) if l in LEVEL_ORDER else 99)
    for level in levels:
        categories = sorted(old[level].keys())
        for category in categories:
            raw_words = old[level][category]
            if not raw_words:
                continue

            # Strip redundant `category` field from each word, sort alpha
            words = sorted(
                [
                    {
                        'word':          w.get('word', ''),
                        'class':         w.get('class', ''),
                        'meaning':       w.get('meaning', ''),
                        'full_sentence': w.get('full_sentence', ''),
                    }
                    for w in raw_words
                ],
                key=lambda x: x['word'].lower(),
            )

            lessons.append({
                'id':       lesson_id,
                'level':    level,
                'category': category,
                'slug':     f"{level}/{slugify(category)}",
                'words':    words,
            })
            lesson_id += 1

    with open(SRC, 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)

    # Summary
    print(f"✅ Converted {len(lessons)} lessons → flat array")
    by_level = {}
    for l in lessons:
        by_level.setdefault(l['level'], []).append(l)
    print(f"\n{'Level':<8} {'Lessons':>8} {'Words':>8}")
    print('-' * 28)
    for lv in LEVEL_ORDER:
        if lv not in by_level:
            continue
        lvl_lessons = by_level[lv]
        total_words = sum(len(l['words']) for l in lvl_lessons)
        print(f"  {lv:<6} {len(lvl_lessons):>8} {total_words:>8}")
    print('-' * 28)
    total = sum(len(l['words']) for l in lessons)
    print(f"  {'TOTAL':<6} {len(lessons):>8} {total:>8}")
    print(f"\n📄 Output: {os.path.abspath(SRC)}")


if __name__ == '__main__':
    main()
