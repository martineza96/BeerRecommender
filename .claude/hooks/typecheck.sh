#!/bin/bash
# PostToolUse (Edit|Write): type-check the app after a .ts/.tsx edit under beerRecommenderApp/src.
# Exit 2 sends the errors back to Claude so it fixes them right away.
file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
case "$file" in
  */beerRecommenderApp/src/*.ts|*/beerRecommenderApp/src/*.tsx) ;;
  *) exit 0 ;;
esac

# Check the checkout the file belongs to, so edits in a git worktree are type-checked there.
root=$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null) || root=$CLAUDE_PROJECT_DIR
cd "$root/beerRecommenderApp" || exit 0
if ! out=$(npx tsc --noEmit 2>&1); then
  echo "Type errors after editing ${file#$root/}:" >&2
  echo "$out" | head -30 >&2
  exit 2
fi
