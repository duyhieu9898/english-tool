#!/usr/bin/env python3
"""
flat_utils.py

Shared utilities for reading/writing the new flat-array oxford_classified.json
format from reclassify scripts that work per-level.

Usage in reclassify scripts:
    from flat_utils import load_level, save_level, rebuild_ids
"""

import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLASSIFIED = os.path.join(SCRIPT_DIR, '..', 'oxford_classified.json')

LEVEL_ORDER = ['a1', 'a2', 'b1', 'b2', 'c1']


def slugify(text: str) -> str:
    text = text.replace('&', 'and')
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9\s-]', '', text.lower()).strip()).replace(' ', '-')


def load_flat() -> list:
    """Load the entire flat lessons array."""
    with open(CLASSIFIED, encoding='utf-8') as f:
        return json.load(f)


def flat_to_nested(lessons: list, level: str) -> dict:
    """Extract a single level from flat array → nested {category: [words]} dict."""
    nested = {}
    for lesson in lessons:
        if lesson['level'] == level:
            nested[lesson['category']] = lesson['words']
    return nested


def nested_to_flat_lessons(nested: dict, level: str, start_id: int) -> list:
    """Convert {category: [words]} dict back to flat lessons for one level."""
    lessons = []
    lesson_id = start_id
    for category in sorted(nested.keys()):
        words = sorted(nested[category], key=lambda w: w['word'].lower())
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
    return lessons


def rebuild_ids(lessons: list) -> list:
    """Re-assign sequential IDs respecting CEFR level order."""
    sorted_lessons = sorted(
        lessons,
        key=lambda l: (
            LEVEL_ORDER.index(l['level']) if l['level'] in LEVEL_ORDER else 99,
            l['category'],
        ),
    )
    for i, lesson in enumerate(sorted_lessons, start=1):
        lesson['id'] = i
        lesson['slug'] = f"{lesson['level']}/{slugify(lesson['category'])}"
    return sorted_lessons


def save_flat(lessons: list) -> None:
    """Save flat array back to oxford_classified.json."""
    with open(CLASSIFIED, 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)


def replace_level(lessons: list, level: str, new_nested: dict) -> list:
    """
    Replace all lessons for a given level with new_nested content.
    Preserves lessons for other levels. Re-assigns stable IDs after.
    """
    other_levels = [l for l in lessons if l['level'] != level]

    # Get the lowest ID used by levels that come after this level
    level_idx = LEVEL_ORDER.index(level) if level in LEVEL_ORDER else 0
    earlier_count = sum(
        1 for l in lessons
        if l['level'] in LEVEL_ORDER and LEVEL_ORDER.index(l['level']) < level_idx
    )
    start_id = earlier_count + 1

    new_lessons_for_level = nested_to_flat_lessons(new_nested, level, start_id)
    all_lessons = other_levels + new_lessons_for_level
    return rebuild_ids(all_lessons)
