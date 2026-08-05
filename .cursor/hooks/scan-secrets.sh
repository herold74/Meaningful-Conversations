#!/usr/bin/env bash
# Warn on likely secrets or sensitive content in prompts and write operations.
set -euo pipefail

input=$(cat)
text=""

if command -v jq >/dev/null 2>&1; then
  text=$(echo "$input" | jq -r '
    .prompt // .content // .text //
    (.tool_input.new_string // empty) //
    (.tool_input.contents // empty) //
    (.tool_input.command // empty) //
    empty
  ' 2>/dev/null || true)
  # Fallback: stringify whole input for pattern scan
  if [ -z "$text" ]; then
    text=$(echo "$input" | jq -r '. | tostring' 2>/dev/null || echo "$input")
  fi
else
  text="$input"
fi

# Patterns that should not appear in commits or chat (public repo)
PATTERNS=(
  'BEGIN (RSA |OPENSSH )?PRIVATE KEY'
  'MC_DEV_PASSWORD=[^[:space:]]+'
  'GOOGLE_API_KEY=[^[:space:]]+'
  'MISTRAL_API_KEY=[^[:space:]]+'
  'JWT_SECRET=[^[:space:]]+'
  'password=[^[:space:]]{8,}'
  'AKIA[0-9A-Z]{16}'
  'ghp_[a-zA-Z0-9]{20,}'
)

for pattern in "${PATTERNS[@]}"; do
  if echo "$text" | grep -qE "$pattern"; then
    cat <<EOF
{
  "permission": "ask",
  "user_message": "Possible secret or credential detected. Do not commit API keys, passwords, or private keys to this public repository.",
  "agent_message": "Hook flagged sensitive content matching pattern. Use .env files (gitignored) or placeholders like <YOUR_SERVER_IP> in docs."
}
EOF
    exit 0
  fi
done

# IPv4 that looks like a real server IP (exclude common private/local ranges in docs is hard — warn on bare IPs in write context)
if echo "$text" | grep -qE '(^|[^0-9])([0-9]{1,3}\.){3}[0-9]{1,3}([^0-9]|$)'; then
  if echo "$text" | grep -qEv '(127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'; then
    cat <<'EOF'
{
  "permission": "ask",
  "user_message": "Possible public IP address in content. This repo is public — use VITE_BRAND_SERVER_IP, $SERVER_HOST from .env.server, or <YOUR_SERVER_IP> in docs.",
  "agent_message": "Hook flagged a non-private IPv4 address. See core.mdc security rule."
}
EOF
    exit 0
  fi
fi

echo '{ "permission": "allow" }'
exit 0
