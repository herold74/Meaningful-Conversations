#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 [--dry-run] [--remote <remote>] [--source-file <path>] [--source-branch <branch>] [--stdin]
Modes (one required):
  --source-file <path>    Use a file path (can be outside repo)
  --source-branch <branch> Use LICENSE.md from the given remote branch (example: origin/template-branch)
  --stdin                 Read new LICENSE.md content from stdin

Common options:
  --dry-run               Don't push, only show what would be done
  --remote <remote>       Git remote name (default: origin)

Examples:
  # file outside repo
  ./update-license.sh --source-file ../NEW_LICENSE.md

  # use LICENSE.md from a remote branch
  ./update-license.sh --source-branch template-branch

  # pipe content from stdin
  cat NEW_LICENSE.md | ./update-license.sh --stdin

  # dry run
  ./update-license.sh --dry-run --source-file ../NEW_LICENSE.md
EOF
  exit 1
}

DRY_RUN=false
REMOTE="origin"
SOURCE_FILE=""
SOURCE_BRANCH=""
USE_STDIN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --remote) REMOTE="$2"; shift 2 ;;
    --source-file) SOURCE_FILE="$2"; shift 2 ;;
    --source-branch) SOURCE_BRANCH="$2"; shift 2 ;;
    --stdin) USE_STDIN=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $1"; usage ;;
  esac
done

# Validate mode
modes_set=0
[ -n "$SOURCE_FILE" ] && modes_set=$((modes_set+1))
[ -n "$SOURCE_BRANCH" ] && modes_set=$((modes_set+1))
$USE_STDIN && modes_set=$((modes_set+1))

if [ "$modes_set" -ne 1 ]; then
  echo "Fehler: Genau ein Eingabemodus muss angegeben werden (--source-file, --source-branch oder --stdin)."
  usage
fi

# Prepare temporary file with new license content
TMP=""
cleanup() {
  rc=$?
  [ -n "$TMP" ] && [ -f "$TMP" ] && rm -f "$TMP"
  exit $rc
}
trap cleanup INT TERM EXIT

if [ -n "$SOURCE_FILE" ]; then
  if [ ! -f "$SOURCE_FILE" ]; then
    echo "Quelle $SOURCE_FILE nicht gefunden."
    exit 1
  fi
  # If source file points to the repo's LICENSE.md, refuse
  if realpath --relative-to="." "$SOURCE_FILE" 2>/dev/null | grep -q "^LICENSE.md$" || [ "$(realpath "$SOURCE_FILE")" = "$(realpath LICENSE.md 2>/dev/null || true)" ]; then
    echo "Fehler: Die Quell-Datei ist dieselbe wie das Ziel LICENSE.md im Repo. Bitte benutze eine Datei außerhalb des Repo-Roots, --source-branch oder --stdin."
    exit 1
  fi
  TMP=$(mktemp)
  cp "$SOURCE_FILE" "$TMP"
elif [ -n "$SOURCE_BRANCH" ]; then
  # fetch remote refs first
  git fetch "$REMOTE" --prune
  # Try to read LICENSE.md from remote branch
  if ! git show "$REMOTE/$SOURCE_BRANCH:LICENSE.md" > /dev/null 2>&1; then
    echo "Fehler: LICENSE.md nicht in $REMOTE/$SOURCE_BRANCH gefunden."
    exit 1
  fi
  TMP=$(mktemp)
  git show "$REMOTE/$SOURCE_BRANCH:LICENSE.md" > "$TMP"
elif $USE_STDIN; then
  TMP=$(mktemp)
  cat - > "$TMP"
  if [ ! -s "$TMP" ]; then
    echo "Fehler: Keine Eingabe über stdin erkannt."
    exit 1
  fi
fi

# Now TMP contains the new LICENSE content
if [ -z "$TMP" ] || [ ! -f "$TMP" ]; then
  echo "Interner Fehler: temp file missing"
  exit 1
fi

# Main loop: go through remote branches and apply
git fetch --all --prune

branches=$(git for-each-ref --format='%(refname:short)' refs/remotes/"$REMOTE" | sed "s@^$REMOTE/@@" | grep -v '^HEAD$' || true)

echo "Branches gefunden:"
echo "$branches"
echo

for b in $branches; do
  echo "=== Verarbeite Branch: $b ==="
  git checkout -B "$b" "$REMOTE/$b"

  # Write TMP content into LICENSE.md (overwrite)
  cp "$TMP" LICENSE.md

  if git diff --quiet -- LICENSE.md; then
    echo "Keine Änderung an LICENSE.md in Branch $b — übersprungen."
  else
    git add LICENSE.md
    git commit -m "Update LICENSE.md: apply Apache-2.0 license (2025 Guenter Herold)" || true
    if [ "$DRY_RUN" = true ]; then
      echo "[DRY-RUN] Änderungen würden zu $REMOTE/$b gepusht (commit vorhanden)."
      # undo commit to keep working tree clean
      git reset --soft HEAD~1 || true
    else
      if git push "$REMOTE" "$b"; then
        echo "Erfolgreich gepusht: $b"
      else
        echo "Push nach $REMOTE/$b fehlgeschlagen (eventuell protected branch). Bitte PR erstellen oder Berechtigungen prüfen."
      fi
    fi
  fi
  echo
done

echo "Fertig."
