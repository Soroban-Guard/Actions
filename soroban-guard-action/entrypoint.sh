#!/bin/bash
set -e

# Parse inputs
INPUT_PATH="${INPUT_PATH:-.}"
INPUT_FORMAT="${INPUT_FORMAT:-sarif}"
INPUT_MIN_SEVERITY="${INPUT_MIN_SEVERITY:-high}"
INPUT_EXCLUDE="${INPUT_EXCLUDE:-}"
INPUT_FAIL_ON="${INPUT_FAIL_ON:-high}"

# Build args
ARGS=""

if [ -n "$INPUT_EXCLUDE" ]; then
  ARGS="$ARGS --exclude $INPUT_EXCLUDE"
fi

ARGS="$ARGS --min-severity $INPUT_MIN_SEVERITY"
ARGS="$ARGS --format $INPUT_FORMAT"
ARGS="$ARGS --output /tmp/soroban-guard-results.json"

# Run analysis
echo "Running Soroban Guard on $INPUT_PATH..."
soroban-guard $INPUT_PATH $ARGS
EXIT_CODE=$?

# Set outputs
if [ -f /tmp/soroban-guard-results.json ]; then
  SCORE=$(jq -r '.score // "N/A"' /tmp/soroban-guard-results.json)
  CRITICAL=$(jq -r '.breakdown.critical // 0' /tmp/soroban-guard-results.json)
  HIGH=$(jq -r '.breakdown.high // 0' /tmp/soroban-guard-results.json)

  echo "score=$SCORE" >> $GITHUB_OUTPUT
  echo "critical_count=$CRITICAL" >> $GITHUB_OUTPUT
  echo "high_count=$HIGH" >> $GITHUB_OUTPUT
  echo "report_path=/tmp/soroban-guard-results.json" >> $GITHUB_OUTPUT
fi

# Fail based on threshold
if [ "$INPUT_FAIL_ON" = "critical" ] && [ "$CRITICAL" -gt 0 ]; then
  echo "::error::Critical vulnerabilities found! Score: $SCORE"
  exit 1
elif [ "$INPUT_FAIL_ON" = "high" ] && [ "$HIGH" -gt 0 ]; then
  echo "::error::High severity vulnerabilities found! Score: $SCORE"
  exit 1
fi

exit $EXIT_CODE
