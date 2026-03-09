#!/usr/bin/env bash
# reclassify_all.sh — Rebuild and reclassify all CEFR levels in one command
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "📥 Step 1/3: Rebuild oxford_classified.json from CSV..."
python3 "$SCRIPT_DIR/classify_by_level.py"

echo ""
echo "🔵 Step 2/3: Reclassify A1..."
python3 "$SCRIPT_DIR/reclassify_a1.py" | grep -E "^✅|Too big|Too small|OK \("

echo ""
echo "🟢 Step 3/3: Reclassify A2, B1, B2, C1..."
python3 "$SCRIPT_DIR/reclassify_other_levels.py" | grep -E "^✅ [A-Z]"

echo ""
echo "🎉 Done! oxford_classified.json is up to date."
