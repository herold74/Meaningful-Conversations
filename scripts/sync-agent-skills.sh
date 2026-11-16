#!/usr/bin/env bash
# Mirror domain skills: .cursor/skills/meaningful-conversations → .agents/skills/meaningful-conversations
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.cursor/skills/meaningful-conversations"
DST="$ROOT/.agents/skills/meaningful-conversations"

if [[ ! -d "$SRC" ]]; then
  echo "Missing source: $SRC" >&2
  exit 1
fi

if [[ "${1:-}" == "--from-mirror" ]]; then
  if [[ ! -d "$DST" ]]; then
    echo "Missing mirror: $DST" >&2
    exit 1
  fi
  mkdir -p "$SRC"
  rsync -a --delete "$DST/" "$SRC/"
  echo "Restored $DST → $SRC (bootstrap local Cursor skills from git)"
  exit 0
fi

if [[ "${1:-}" == "--check" ]]; then
  if [[ ! -d "$DST" ]]; then
    echo "Mirror missing: $DST — run: ./scripts/sync-agent-skills.sh" >&2
    exit 1
  fi
  if diff -rq "$SRC" "$DST" >/dev/null 2>&1; then
    echo "Skills mirror OK"
    exit 0
  fi
  echo "Skills mirror drift (.cursor vs .agents):" >&2
  diff -rq "$SRC" "$DST" >&2 || true
  echo "Fix: ./scripts/sync-agent-skills.sh" >&2
  exit 1
fi

mkdir -p "$DST"
rsync -a --delete "$SRC/" "$DST/"
echo "Synced $SRC → $DST"