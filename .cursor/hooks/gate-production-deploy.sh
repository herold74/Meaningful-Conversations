#!/usr/bin/env bash
# Gate production deploys — require explicit user approval in Cursor.
set -euo pipefail

input=$(cat)
command=""
if command -v jq >/dev/null 2>&1; then
  command=$(echo "$input" | jq -r '.command // empty')
else
  command=$(echo "$input" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true)
fi

if echo "$command" | grep -qE 'deploy-manualmode\.sh.*-e[[:space:]]+production|make deploy-production|deploy-manualmode-production'; then
  cat <<'EOF'
{
  "permission": "ask",
  "user_message": "Production deploy detected. This kicks active users and requires explicit approval. Confirm staging is verified and App Store parity gate is satisfied.",
  "agent_message": "Production deploy blocked for review. Read deployment skill App Store gate and memory-bank/activeContext.md before proceeding."
}
EOF
  exit 0
fi

echo '{ "permission": "allow" }'
exit 0
