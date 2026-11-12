#!/bin/bash
#
# Podman image cleanup (production server).
# Keeps: images used by running containers + the newest KEEP_VERSIONS images per
# repository that is referenced by a running container. Removes everything else.
#
# Usage: podman-image-cleanup.sh [--dry-run]
# Log: /var/log/podman-image-cleanup.log
#
set -euo pipefail

LOG_FILE="/var/log/podman-image-cleanup.log"
KEEP_VERSIONS="${KEEP_VERSIONS:-2}"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
elif [[ -n "${1:-}" ]]; then
  echo "Usage: $0 [--dry-run]" >&2
  exit 2
fi

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >> "$LOG_FILE"
  echo "$msg"
}

normalize_id() {
  local id="$1"
  id="${id#sha256:}"
  echo "${id:0:12}"
}

# Repository path without tag (handles registry:port paths via last colon).
repo_from_image_ref() {
  local ref="$1"
  if [[ "$ref" == *@sha256:* ]]; then
    echo "${ref%%@*}"
    return 0
  fi
  if [[ "$ref" == *:* ]] && [[ "$ref" == */* ]]; then
    echo "${ref%:*}"
    return 0
  fi
  local tag0
  tag0=$(podman image inspect "$ref" --format '{{if .RepoTags}}{{index .RepoTags 0}}{{else}}{{end}}' 2>/dev/null || true)
  if [[ -n "$tag0" && "$tag0" != "<none>:<none>" ]]; then
    echo "${tag0%:*}"
    return 0
  fi
  echo ""
}

declare -A KEEP_IDS
declare -A RUNNING_REPOS

if ! podman ps --quiet >/dev/null 2>&1; then
  log "ERROR: podman not available"
  exit 1
fi

while IFS= read -r image_ref; do
  [[ -z "$image_ref" ]] && continue
  img_id=$(podman image inspect "$image_ref" --format '{{.Id}}' 2>/dev/null || true)
  [[ -z "$img_id" ]] && continue
  KEEP_IDS["$(normalize_id "$img_id")"]=1
  repo=$(repo_from_image_ref "$image_ref")
  [[ -n "$repo" ]] && RUNNING_REPOS["$repo"]=1
done < <(podman ps --format '{{.Image}}')

for repo in "${!RUNNING_REPOS[@]}"; do
  count=0
  while IFS=$'\t' read -r img_id _created; do
    [[ -z "$img_id" ]] && continue
    KEEP_IDS["$(normalize_id "$img_id")"]=1
    count=$((count + 1))
    [[ "$count" -ge "$KEEP_VERSIONS" ]] && break
  done < <(podman images "$repo" --format '{{.ID}}\t{{.CreatedAt}}' 2>/dev/null | sort -t $'\t' -k2 -r)
done

log "Keep set: ${#KEEP_IDS[@]} image id(s) across ${#RUNNING_REPOS[@]} running repo(s) (KEEP_VERSIONS=$KEEP_VERSIONS) dry_run=$DRY_RUN"

removed=0
failed=0

while IFS=$'\t' read -r img_id repository tag; do
  [[ -z "$img_id" ]] || [[ "$repository" == "REPOSITORY" ]] && continue
  nid=$(normalize_id "$img_id")
  if [[ -n "${KEEP_IDS[$nid]:-}" ]]; then
    continue
  fi
  ref="${repository}:${tag}"
  if [[ "$repository" == "<none>" || "$tag" == "<none>" ]]; then
    ref="$img_id"
  fi
  if [[ "$DRY_RUN" == true ]]; then
    log "DRY-RUN: would remove $ref ($img_id)"
    removed=$((removed + 1))
    continue
  fi
  if podman rmi "$ref" >>"$LOG_FILE" 2>&1 || podman rmi -f "$img_id" >>"$LOG_FILE" 2>&1; then
    log "Removed $ref"
    removed=$((removed + 1))
  else
    log "WARN: failed to remove $ref"
    failed=$((failed + 1))
  fi
done < <(podman images --format '{{.ID}}\t{{.Repository}}\t{{.Tag}}')

if [[ "$DRY_RUN" == false ]]; then
  podman image prune -f >>"$LOG_FILE" 2>&1 || true
fi

df_line=$(df -hP / | tail -1)
podman_df=$(podman system df 2>/dev/null | tail -n +2 | tr '\n' '; ' || true)
log "Done: removed=$removed failed=$failed disk_root=$df_line podman=$podman_df"

exit 0
