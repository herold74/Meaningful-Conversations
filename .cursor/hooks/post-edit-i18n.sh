#!/usr/bin/env bash
# Remind to update DE + EN locale files when editing UI components.
set -euo pipefail

input=$(cat)
file_path=""

if command -v jq >/dev/null 2>&1; then
  file_path=$(echo "$input" | jq -r '.file_path // .path // .filePath // empty' 2>/dev/null || true)
fi

if [ -z "$file_path" ]; then
  exit 0
fi

case "$file_path" in
  components/*.tsx|components/**/*.tsx) ;;
  *) exit 0 ;;
esac

cat <<EOF
{
  "additional_context": "UI component edited ($file_path). If you added user-facing text, add keys to BOTH public/locales/de.json and public/locales/en.json. See i18n-keys.mdc and i18n-and-theming skill."
}
EOF
exit 0
