#!/bin/bash
# PostToolUse (Edit|Write): type-check the app after a .ts/.tsx edit under beerRecommenderApp/src.
# Exit 2 sends the errors back to Claude so it fixes them right away.
file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
case "$file" in
  */beerRecommenderApp/src/*.ts|*/beerRecommenderApp/src/*.tsx) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR/beerRecommenderApp" || exit 0
if ! out=$(npx tsc --noEmit 2>&1); then
  echo "Type errors after editing ${file#$CLAUDE_PROJECT_DIR/}:" >&2
  echo "$out" | head -30 >&2
  exit 2
fi
