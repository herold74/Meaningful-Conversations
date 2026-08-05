#!/usr/bin/env bash
# After frontend TS/TSX edits, remind agent to run tsc if errors likely.
set -euo pipefail

input=$(cat)
file_path=""

if command -v jq >/dev/null 2>&1; then
  file_path=$(echo "$input" | jq -r '.file_path // .path // .filePath // empty' 2>/dev/null || true)
fi

# Only frontend TypeScript — skip backend and node_modules
if [ -n "$file_path" ]; then
  case "$file_path" in
    meaningful-conversations-backend/*|node_modules/*|*.d.ts) exit 0 ;;
    *.ts|*.tsx) ;;
    *) exit 0 ;;
  esac
else
  exit 0
fi

cat <<EOF
{
  "additional_context": "Frontend TypeScript file edited ($file_path). Before deploy, run 'npx tsc --noEmit' or use /pre-deploy-check — staging build fails on TS errors."
}
EOF
exit 0
