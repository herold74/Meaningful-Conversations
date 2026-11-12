#!/bin/bash
#
# Application software stack — weekly Friday digest (laufende npm-Updates).
# Tabelle: Patches, Features, Migrationsrisiko, Abhängigkeiten (stack-package-tracker.json).
# Plan: PLANS/software-stack-update-plan.md — nicht Host-Ops (server-ops-report.sh).
#
# Cron (CRON_TZ=Europe/Vienna): Fri 20:00 — always emails.
#
# Usage:
#   sw-stack-ops-report.sh [--dry-run] [--test-mail] [--skip-npm-scan]
#
# Config: /root/.mc-ops-report.env → MC_OPS_REPORT_EMAIL, optional SW_STACK_OPS_REPORT_EMAIL
# Data:   stack-package-tracker.json, sw-stack-merge-table.jq (neben diesem Skript)
#
set -euo pipefail

ENV_FILE="/root/.mc-ops-report.env"
LOG_FILE="/var/log/sw-stack-ops-report.log"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TRACKER_FILE="${SCRIPT_DIR}/stack-package-tracker.json"
MERGE_JQ="${SCRIPT_DIR}/sw-stack-merge-table.jq"
NPM_OUT_DIR="/tmp/sw-stack-npm-out"

HEALTH_PROD_URL="https://mc-app.manualmode.at/api/health"
HEALTH_STAGING_URL="https://mc-beta.manualmode.at/api/health"
SW_PROD_URL="https://mc-app.manualmode.at/sw.js"
SW_STAGING_URL="https://mc-beta.manualmode.at/sw.js"

NODE_IMAGE="${SW_STACK_NODE_IMAGE:-docker.io/library/node:22-bookworm-slim}"
DEFAULT_GIT_REPO="https://github.com/herold74/Meaningful-Conversations.git"
DEFAULT_SCAN_DIR="/var/lib/mc-sw-stack-scan"

DRY_RUN=false
TEST_MAIL=false
SKIP_NPM=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --test-mail) TEST_MAIL=true ;;
    --skip-npm-scan) SKIP_NPM=true ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
  shift
done

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
fi

MC_OPS_REPORT_EMAIL="${MC_OPS_REPORT_EMAIL:-support@manualmode.at}"
SW_STACK_OPS_REPORT_EMAIL="${SW_STACK_OPS_REPORT_EMAIL:-$MC_OPS_REPORT_EMAIL}"

log_line() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >>"$LOG_FILE"
  if [[ -t 1 ]] || [[ "$DRY_RUN" == true ]]; then
    echo "$msg"
  fi
}

OVERALL=0
DETAILS=""
ACTIONS=()
SUMMARY_PARITY="—"
SUMMARY_NPM="—"
SUMMARY_AUDIT="—"
PACKAGE_TABLE=""

section() { DETAILS+=$'\n'"=== $* ==="$'\n'; }
append() { DETAILS+="$*"$'\n'; }

bump_status() {
  local level="$1"
  if [[ "$level" == "FAIL" && "$OVERALL" -lt 2 ]]; then OVERALL=2; fi
  if [[ "$level" == "WARN" && "$OVERALL" -lt 1 ]]; then OVERALL=1; fi
}

add_action() {
  ACTIONS+=("[$1] $2 — $3")
}

_ops_http_code() {
  curl -s -o "$2" -w '%{http_code}' --connect-timeout 15 --max-time 30 "$1" 2>/dev/null || echo "000"
}

_sw_cache_line() {
  local url="$1" out="$2"
  _ops_http_code "$url" "$out" >/dev/null
  if [[ -f "$out" ]]; then
    grep -m1 "CACHE_NAME" "$out" 2>/dev/null | sed "s/.*'\([^']*\)'.*/\1/" || echo "?"
  fi
}

_truncate() {
  local s="$1" max="${2:-42}"
  if [[ ${#s} -le $max ]]; then printf '%s' "$s"
  else printf '%s…' "${s:0:$((max - 1))}"
  fi
}

build_package_table() {
  PACKAGE_TABLE=""
  if [[ ! -f "$TRACKER_FILE" || ! -f "$MERGE_JQ" ]]; then
    PACKAGE_TABLE="(Tabelle fehlt: stack-package-tracker.json oder sw-stack-merge-table.jq nicht deployt)"$'\n'
    bump_status FAIL
    add_action "FAIL" "Tracker/JQ fehlt" "Dateien neben /usr/local/bin/sw-stack-ops-report.sh kopieren"
    return
  fi
  if [[ ! -f "$NPM_OUT_DIR/frontend.json" ]]; then
    PACKAGE_TABLE="(npm-Scan ausstehend — Tabelle nach erfolgreichem Scan)"$'\n'
    return
  fi

  local header fmt row pkg cur want lat patches risk qa feat deps pri scope
  header=$(printf '%-24s %-5s %-4s %-14s %-12s %-7s %-6s %-28s %-28s\n' \
    "Paket" "Prio" "Art" "Ist→Latest" "Patches" "Risiko" "QA" "Features" "Abhängigkeiten")
  PACKAGE_TABLE="PAKET-TABELLE (main branch, npm registry)"$'\n'"$header"
  PACKAGE_TABLE+=$(printf '%.0s-' {1..155})$'\n'

  local major_rows=0 patch_rows=0 qa_hoch=0
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    pkg=$(jq -r '.package' <<<"$row")
    pri=$(jq -r '.priority' <<<"$row")
    scope=$(jq -r '.scope' <<<"$row")
    cur=$(jq -r '.current' <<<"$row")
    want=$(jq -r '.wanted' <<<"$row")
    lat=$(jq -r '.latest' <<<"$row")
    patches=$(jq -r '.patches' <<<"$row")
    risk=$(jq -r '.risk' <<<"$row")
    qa=$(jq -r '.qa' <<<"$row")
    feat=$(_truncate "$(jq -r '.features' <<<"$row")" 28)
    deps=$(_truncate "$(jq -r '.dependencies' <<<"$row")" 28)
    [[ "$patches" == "Major" ]] && major_rows=$((major_rows + 1))
    [[ "$patches" == "Patch/Minor" ]] && patch_rows=$((patch_rows + 1))
    [[ "$qa" == "hoch" && "$patches" != "—" ]] && qa_hoch=$((qa_hoch + 1))
    vers="${cur}"
    [[ "$want" != "$cur" && "$want" != "aktuell" ]] && vers+="/${want}"
    [[ "$lat" != "aktuell" ]] && vers+="→${lat}"
    PACKAGE_TABLE+=$(printf '%-24s %-5s %-4s %-14s %-12s %-7s %-6s %-28s %-28s\n' \
      "$(_truncate "$pkg" 24)" "$pri" "$scope" "$(_truncate "$vers" 14)" "$patches" "$risk" "$qa" "$feat" "$deps")
  done < <(jq -n -c -f "$MERGE_JQ" \
    --slurpfile tracker "$TRACKER_FILE" \
    --slurpfile feout "$NPM_OUT_DIR/frontend.json" \
    --slurpfile beout "$NPM_OUT_DIR/backend.json")

  section "Paket-Tabelle (Details)"
  append "$header"
  append "$(printf '%.0s-' {1..80})"
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    append "$(jq -r '[.package, .priority, .scope, .current, .wanted, .latest, .patches, .risk, .qa, .features, .dependencies] | @tsv' <<<"$row")"
  done < <(jq -n -c -f "$MERGE_JQ" \
    --slurpfile tracker "$TRACKER_FILE" \
    --slurpfile feout "$NPM_OUT_DIR/frontend.json" \
    --slurpfile beout "$NPM_OUT_DIR/backend.json")

  if [[ "$major_rows" -gt 0 ]]; then
    bump_status WARN
    add_action "WARN" "$major_rows Major-Update(s) in Tabelle" "Neue Welle planen — kein Auto-Merge (Freitag-Workflow)"
  fi
  if [[ "$qa_hoch" -gt 0 && "$patch_rows" -gt 0 ]]; then
    add_action "Hinweis" "$qa_hoch Paket(e) mit QA=hoch + offenen Patches" "Regression vor Merge einplanen"
  fi
  SUMMARY_NPM="${major_rows} Major, ${patch_rows} Patch/Minor"
  [[ "$qa_hoch" -gt 0 ]] && SUMMARY_NPM+=", ${qa_hoch}× QA-hoch (offen)"
}

check_deploy_parity() {
  section "Deployed builds (Prod vs Staging)"
  local prod_line staging_line prod_ver staging_ver
  prod_line=$(_sw_cache_line "$SW_PROD_URL" /tmp/sw-stack-prod.js)
  staging_line=$(_sw_cache_line "$SW_STAGING_URL" /tmp/sw-stack-staging.js)
  append "Production sw.js: ${prod_line:-?}"
  append "Staging sw.js:    ${staging_line:-?}"

  _ops_http_code "$HEALTH_PROD_URL" /tmp/sw-stack-h-prod.json >/dev/null
  _ops_http_code "$HEALTH_STAGING_URL" /tmp/sw-stack-h-staging.json >/dev/null
  prod_ver=$(grep -o '"version":"[^"]*"' /tmp/sw-stack-h-prod.json 2>/dev/null | head -1 | cut -d'"' -f4)
  staging_ver=$(grep -o '"version":"[^"]*"' /tmp/sw-stack-h-staging.json 2>/dev/null | head -1 | cut -d'"' -f4)
  append "API version prod=${prod_ver:-?} staging=${staging_ver:-?}"

  if [[ -n "$prod_line" && -n "$staging_line" && "$prod_line" != "$staging_line" ]]; then
    SUMMARY_PARITY="DRIFT PWA $prod_line ≠ $staging_line"
    bump_status WARN
    add_action "WARN" "Staging voraus (normal während Soak)" "Nach Go: ./deploy-manualmode.sh -e production"
  else
    SUMMARY_PARITY="OK ($prod_line)"
  fi
}

_sync_scan_repo() {
  local repo_url="$DEFAULT_GIT_REPO"
  local scan_dir="$DEFAULT_SCAN_DIR"

  if [[ "$DRY_RUN" == true ]]; then
    append "DRY-RUN: would sync $repo_url -> $scan_dir"
    echo "$scan_dir"
    return 0
  fi

  if [[ ! -d "$scan_dir/.git" ]]; then
    mkdir -p "$(dirname "$scan_dir")"
    git clone --depth 1 --branch main "$repo_url" "$scan_dir" >>"$LOG_FILE" 2>&1 || return 1
  else
    git -C "$scan_dir" pull --ff-only >>"$LOG_FILE" 2>&1 || return 1
  fi
  echo "$scan_dir"
}

check_npm_stack() {
  section "npm outdated (lockfile/registry, no npm ci — $NODE_IMAGE)"
  if [[ "$SKIP_NPM" == true ]]; then
    append "Skipped (--skip-npm-scan)"
    SUMMARY_NPM="skipped"
    SUMMARY_AUDIT="skipped"
    if [[ -f "$NPM_OUT_DIR/frontend.json" ]]; then
      build_package_table
    else
      PACKAGE_TABLE="(npm-Scan übersprungen — keine Tabelle)"$'\n'
    fi
    return
  fi

  local scan_dir
  if ! scan_dir=$(_sync_scan_repo); then
    append "FAIL: could not sync git repo for npm scan"
    bump_status FAIL
    SUMMARY_NPM="FAIL (git)"
    SUMMARY_AUDIT="—"
    add_action "FAIL" "Git-Scan fehlgeschlagen" "SSH: Verzeichnis $DEFAULT_SCAN_DIR; Repo-Zugriff"
    return
  fi

  mkdir -p "$NPM_OUT_DIR"
  local npm_log=/tmp/sw-stack-npm-scan.log
  : >"$npm_log"

  if [[ "$DRY_RUN" == true ]]; then
    append "DRY-RUN: would run npm outdated --json in container on $scan_dir"
    echo '{}' >"$NPM_OUT_DIR/frontend.json"
    echo '{}' >"$NPM_OUT_DIR/backend.json"
    SUMMARY_NPM="dry-run"
    SUMMARY_AUDIT="dry-run"
  elif ! podman run --rm \
    -v "${scan_dir}:/repo:Z" \
    -v "${NPM_OUT_DIR}:/out:Z" \
    -w /repo \
    "$NODE_IMAGE" \
    bash -c '
      cd /repo
      npm outdated --json > /out/frontend.json 2>/dev/null || true
      [[ -s /out/frontend.json ]] || echo "{}" > /out/frontend.json
      cd /repo/meaningful-conversations-backend
      npm outdated --json > /out/backend.json 2>/dev/null || true
      [[ -s /out/backend.json ]] || echo "{}" > /out/backend.json
      exit 0
    ' >>"$npm_log" 2>&1; then
    append "WARN: npm scan container failed (see log)"
    bump_status WARN
    SUMMARY_NPM="WARN (scan error)"
    SUMMARY_AUDIT="—"
    add_action "WARN" "npm-Scan fehlgeschlagen" "tail $npm_log; Podman/Netz prüfen"
    echo '{}' >"$NPM_OUT_DIR/frontend.json"
    echo '{}' >"$NPM_OUT_DIR/backend.json"
  else
    section "npm audit (high+)"
    podman run --rm -v "${scan_dir}:/repo:Z" -w /repo "$NODE_IMAGE" \
      bash -c 'cd /repo && npm audit --audit-level=high --omit=dev 2>/dev/null | tail -12' >>"$npm_log" 2>&1 || true
    podman run --rm -v "${scan_dir}:/repo:Z" -w /repo/meaningful-conversations-backend "$NODE_IMAGE" \
      bash -c 'npm audit --audit-level=high 2>/dev/null | tail -12' >>"$npm_log" 2>&1 || true
    while IFS= read -r line; do append "$line"; done <"$npm_log"
    if grep -qiE 'critical|high' "$npm_log" && grep -qi 'vulnerabilit' "$npm_log"; then
      bump_status WARN
      add_action "WARN" "npm audit high/critical" "P0 — Patch-PR nach Plan"
      SUMMARY_AUDIT="WARN"
    else
      SUMMARY_AUDIT="OK"
    fi
  fi

  build_package_table
}

build_report() {
  local status_label host_line ts body
  STATUS_LABEL=OK
  [[ "$OVERALL" -eq 1 ]] && STATUS_LABEL=WARN
  [[ "$OVERALL" -eq 2 ]] && STATUS_LABEL=FAIL

  host_line="${HOSTNAME:-$(hostname -f 2>/dev/null || hostname)}"
  ts=$(date '+%Y-%m-%d %H:%M %Z')

  body="Software-Stack — Freitags-Update-Übersicht"$'\n'
  body+="Plan: PLANS/software-stack-update-plan.md (laufende npm-Updates, Wellen W1–W6 abgeschlossen)"$'\n\n'
  body+="Gesamtstatus: ${STATUS_LABEL} — ${host_line} — ${ts}"$'\n\n'
  body+="${PACKAGE_TABLE}"$'\n\n'
  body+="HANDLUNG ERFORDERLICH"$'\n'
  if [[ ${#ACTIONS[@]} -eq 0 ]]; then
    body+="Keine — nur Patch-Bündel oder bewusst warten."$'\n\n'
  else
    local i=1 a
    for a in "${ACTIONS[@]}"; do body+="${i}. ${a}"$'\n'; i=$((i + 1)); done
    body+=$'\n'
  fi

  body+="KURZÜBERSICHT"$'\n'
  body+="• Deploy Prod/Staging: ${SUMMARY_PARITY}"$'\n'
  body+="• npm Tabelle:        ${SUMMARY_NPM}"$'\n'
  body+="• npm audit:          ${SUMMARY_AUDIT}"$'\n\n'
  body+="Legende: QA = leicht|mittel|hoch (Regression-Aufwand) · Risiko = Migration · Abhängigkeiten = was testen/deployen (Details)"$'\n'
  body+="QA leicht: make ci · mittel: Staging+Smoke · hoch: llm-regression/IAP/iOS breit"$'\n\n'
  body+="DETAILS"$'\n'
  body+="${DETAILS}"

  REPORT="$body"
  SUBJECT="SW stack [${STATUS_LABEL}] ${host_line} $(date +%Y-%m-%d)"
}

send_mail() {
  local subject="$1" body="$2"
  if [[ "$DRY_RUN" == true ]]; then
    log_line "DRY-RUN: would email $SW_STACK_OPS_REPORT_EMAIL subject=$subject"
    return 0
  fi
  if command -v msmtp >/dev/null && { [[ -f /etc/msmtprc ]] || [[ -f /root/.msmtprc ]]; }; then
    {
      [[ -n "${MC_OPS_REPORT_FROM:-}" ]] && echo "From: $MC_OPS_REPORT_FROM"
      echo "To: $SW_STACK_OPS_REPORT_EMAIL"
      echo "Subject: $subject"
      echo ""
      echo "$body"
    } | msmtp -a default "$SW_STACK_OPS_REPORT_EMAIL" 2>>"$LOG_FILE" && {
      log_line "Mail sent via msmtp"
      return 0
    }
  fi
  if command -v mail >/dev/null; then
    echo "$body" | mail -r "sw-stack@$(hostname -f 2>/dev/null || hostname)" -s "$subject" "$SW_STACK_OPS_REPORT_EMAIL"
    return 0
  fi
  log_line "ERROR: no mail/msmtp"
  return 1
}

if [[ "$TEST_MAIL" == true ]]; then
  send_mail "SW stack test" "Test from $(hostname) at $(date)." && log_line "Test mail sent"
  exit 0
fi

HOSTNAME=$(hostname -f 2>/dev/null || hostname)

check_deploy_parity
check_npm_stack

build_report
log_line "Run complete: $STATUS_LABEL (code=$OVERALL)"

if [[ "$DRY_RUN" == true ]]; then
  echo "$REPORT"
else
  send_mail "$SUBJECT" "$REPORT" || true
fi

exit "$OVERALL"
