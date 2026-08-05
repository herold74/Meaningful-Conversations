#!/usr/bin/env bash
# Session start: orient agent to memory bank.
set -euo pipefail

cat <<'EOF'
{
  "additional_context": "Meaningful Conversations: read memory-bank/activeContext.md first, then pick a skill from .cursor/skills/meaningful-conversations/ or a slash command (/deploy-staging, /pre-deploy-check, etc.). Default mode is PLAN until user types ACT."
}
EOF
exit 0
