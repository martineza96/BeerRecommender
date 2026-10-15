#!/bin/bash
# Stop: run the unit tests before Claude finishes, if app code has uncommitted changes.
# Exit 2 blocks stopping and sends the failures back to Claude.
input=$(cat)
# Already continuing because of this hook: don't loop forever.
[ "$(echo "$input" | jq -r '.stop_hook_active')" = "true" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -z "$(git status --porcelain -- beerRecommenderApp/src)" ] && exit 0

cd beerRecommenderApp || exit 0
if ! out=$(npx vitest run 2>&1); then
  echo "Unit tests are failing. Fix them before finishing:" >&2
  echo "$out" | grep -E "FAIL|✗|×|AssertionError|Expected|Received|Tests " | head -30 >&2
  exit 2
fi
