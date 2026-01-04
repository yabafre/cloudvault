#!/bin/bash
# Update Context Map
#
# Updates docs/claude/context/architecture.md after a feature is validated.
# Called by the post-review hook or manually.
#
# Usage: ./scripts/claude/update-context.sh <feature-slug>

set -e

ARCHITECTURE_FILE="docs/claude/context/architecture.md"
WORKING_NOTES_DIR="docs/claude/working-notes"
ADR_DIR="docs/claude/decisions"

FEATURE_SLUG="$1"

if [ -z "$FEATURE_SLUG" ]; then
  echo "Usage: update-context.sh <feature-slug>"
  exit 0
fi

echo "Updating context map for: $FEATURE_SLUG"

# Check if working note exists
WORKING_NOTE="$WORKING_NOTES_DIR/${FEATURE_SLUG}.md"
if [ ! -f "$WORKING_NOTE" ]; then
  echo "Warning: Working note not found: $WORKING_NOTE"
fi

# Check if architecture file exists
if [ ! -f "$ARCHITECTURE_FILE" ]; then
  echo "Warning: Architecture file not found: $ARCHITECTURE_FILE"
  exit 0
fi

# Get today's date
TODAY=$(date +%Y-%m-%d)

# Update the "last updated" line in architecture.md
if grep -q "Dernière mise à jour" "$ARCHITECTURE_FILE" 2>/dev/null; then
  # macOS sed syntax
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\*Dernière mise à jour.*\*/*Dernière mise à jour: $TODAY - Feature: $FEATURE_SLUG*/" "$ARCHITECTURE_FILE"
  else
    sed -i "s/\*Dernière mise à jour.*\*/*Dernière mise à jour: $TODAY - Feature: $FEATURE_SLUG*/" "$ARCHITECTURE_FILE"
  fi
fi

# Extract module info from working note if it exists
MODULE=""
ROUTE=""
if [ -f "$WORKING_NOTE" ]; then
  MODULE=$(grep -o 'apps/api/src/modules/[a-z_-]*' "$WORKING_NOTE" 2>/dev/null | head -1 | sed 's|apps/api/src/modules/||' || echo "")
  ROUTE=$(grep -o 'apps/web/app/[a-z/_-]*' "$WORKING_NOTE" 2>/dev/null | head -1 | sed 's|apps/web/app/||' || echo "")
fi

echo ""
echo "Context map updated"
echo "  Feature: $FEATURE_SLUG"
echo "  Module: ${MODULE:-N/A}"
echo "  Route: ${ROUTE:-N/A}"
echo "  Date: $TODAY"
