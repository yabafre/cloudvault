#!/bin/bash
# Track Feature Completion
#
# Records metrics for a completed feature.
# Called at the end of the pipeline by docs-writer.
#
# Usage: ./scripts/claude/track-feature.sh <feature-slug> [--tokens=X] [--files-created=Y] [--files-modified=Z]

set -e

FEATURES_FILE="docs/claude/metrics/features.json"
COSTS_FILE="docs/claude/metrics/costs.json"
QUEUE_FILE="enhancements/_queue.json"

# Parse arguments
SLUG="$1"
TOKENS=0
FILES_CREATED=0
FILES_MODIFIED=0
TESTS_ADDED=0

shift || true
for arg in "$@"; do
  case "$arg" in
    --tokens=*) TOKENS="${arg#*=}" ;;
    --files-created=*) FILES_CREATED="${arg#*=}" ;;
    --files-modified=*) FILES_MODIFIED="${arg#*=}" ;;
    --tests-added=*) TESTS_ADDED="${arg#*=}" ;;
  esac
done

if [ -z "$SLUG" ]; then
  echo "Usage: track-feature.sh <feature-slug> [--tokens=X] [--files-created=Y]"
  exit 1
fi

echo "Tracking feature: $SLUG"

# Ensure directories exist
mkdir -p "$(dirname "$FEATURES_FILE")"
mkdir -p "$(dirname "$COSTS_FILE")"
mkdir -p "$(dirname "$QUEUE_FILE")"

# Initialize files if they don't exist
[ ! -f "$FEATURES_FILE" ] && echo "[]" > "$FEATURES_FILE"
[ ! -f "$COSTS_FILE" ] && echo '{"total": 0, "features": {}}' > "$COSTS_FILE"

# Get timestamps
NOW=$(date -Iseconds 2>/dev/null || date)
TODAY=$(date +%Y-%m-%d)

# Get started_at from queue
STARTED_AT=""
if [ -f "$QUEUE_FILE" ]; then
  STARTED_AT=$(jq -r '.started_at // empty' "$QUEUE_FILE" 2>/dev/null || echo "")
fi
[ -z "$STARTED_AT" ] && STARTED_AT="$NOW"

# Calculate duration
START_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${STARTED_AT%%+*}" "+%s" 2>/dev/null || date -d "${STARTED_AT%%+*}" "+%s" 2>/dev/null || echo "0")
NOW_EPOCH=$(date "+%s")
DURATION_MINUTES=$(( (NOW_EPOCH - START_EPOCH) / 60 ))
[ "$DURATION_MINUTES" -lt 0 ] && DURATION_MINUTES=0

# Get completed phases from queue
PHASES_COMPLETED="[]"
if [ -f "$QUEUE_FILE" ]; then
  PHASES_COMPLETED=$(jq -c '[.phases | to_entries[] | select(.value == "COMPLETED" or .value == "DONE" or .value == "SKIPPED") | .key]' "$QUEUE_FILE" 2>/dev/null || echo "[]")
fi

# Create feature entry
FEATURE_ENTRY=$(cat <<EOF
{
  "slug": "$SLUG",
  "started_at": "$STARTED_AT",
  "completed_at": "$NOW",
  "duration_minutes": $DURATION_MINUTES,
  "phases_completed": $PHASES_COMPLETED,
  "files_created": $FILES_CREATED,
  "files_modified": $FILES_MODIFIED,
  "tests_added": $TESTS_ADDED,
  "tokens_estimated": $TOKENS
}
EOF
)

# Append to features file (filter out examples)
jq --argjson entry "$FEATURE_ENTRY" '. + [$entry]' "$FEATURES_FILE" > "${FEATURES_FILE}.tmp" && mv "${FEATURES_FILE}.tmp" "$FEATURES_FILE"

# Calculate estimated cost (Claude pricing approximation)
INPUT_TOKENS=$((TOKENS * 7 / 10))
OUTPUT_TOKENS=$((TOKENS * 3 / 10))
# Cost in millicents: input=$3/1M, output=$15/1M
COST_MILLICENTS=$(( (INPUT_TOKENS * 3 + OUTPUT_TOKENS * 15) / 1000 ))
COST_DOLLARS=$(echo "scale=2; $COST_MILLICENTS / 100" | bc 2>/dev/null || echo "0.00")

# Update costs file
jq --arg slug "$SLUG" \
   --argjson input "$INPUT_TOKENS" \
   --argjson output "$OUTPUT_TOKENS" \
   --arg cost "$COST_DOLLARS" \
   --arg date "$TODAY" \
   '.features[$slug] = {input_tokens: $input, output_tokens: $output, total: ($cost | tonumber), completed_at: $date} | .total = ([.features[].total] | add)' \
   "$COSTS_FILE" > "${COSTS_FILE}.tmp" && mv "${COSTS_FILE}.tmp" "$COSTS_FILE" 2>/dev/null || true

# Reset queue for next feature
if [ -f "$QUEUE_FILE" ]; then
  HISTORY=$(jq -c '.history // []' "$QUEUE_FILE" 2>/dev/null || echo "[]")
  METRICS=$(jq -c '.metrics // {}' "$QUEUE_FILE" 2>/dev/null || echo "{}")

  # Update metrics
  FEATURES_COUNT=$(echo "$METRICS" | jq -r '.features_completed // 0')
  TOTAL_TOKENS=$(echo "$METRICS" | jq -r '.total_tokens_estimated // 0')
  TOTAL_CREATED=$(echo "$METRICS" | jq -r '.total_files_created // 0')
  TOTAL_MODIFIED=$(echo "$METRICS" | jq -r '.total_files_modified // 0')

  cat > "$QUEUE_FILE" <<EOF
{
  "current_feature": null,
  "description": null,
  "status": "IDLE",
  "phases": {
    "spec": "PENDING",
    "architecture": "PENDING",
    "data-model": "PENDING",
    "backend": "PENDING",
    "frontend": "PENDING",
    "mobile": "PENDING",
    "tests": "PENDING",
    "security": "PENDING",
    "performance": "PENDING",
    "review": "PENDING",
    "docs": "PENDING"
  },
  "started_at": null,
  "completed_at": "$NOW",
  "history": $(echo "$HISTORY" | jq --arg slug "$SLUG" --arg date "$NOW" --argjson dur "$DURATION_MINUTES" '. + [{slug: $slug, completed_at: $date, duration_minutes: $dur}]'),
  "metrics": {
    "features_completed": $((FEATURES_COUNT + 1)),
    "total_tokens_estimated": $((TOTAL_TOKENS + TOKENS)),
    "total_files_created": $((TOTAL_CREATED + FILES_CREATED)),
    "total_files_modified": $((TOTAL_MODIFIED + FILES_MODIFIED))
  }
}
EOF
fi

echo ""
echo "Feature tracked successfully"
echo "  Duration: ${DURATION_MINUTES} minutes"
echo "  Estimated cost: \$${COST_DOLLARS:-0.00}"
echo ""
