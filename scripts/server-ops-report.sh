#!/bin/bash
#
# Meaningful Conversations — server ops report (health, backups, patches).
# Run on production server as root (cron). Mail only on WARN/FAIL unless
# --weekly-summary is used (brief OK line on Mondays before deploy).
#
# Usage:
#   server-ops-report.sh [--dry-run] [--weekly-summary] [--test-mail]
#
# Config (server only, not in repo): /root/.mc-ops-report.env
#   MC_OPS_REPORT_EMAIL=support@manualmode.at
#
set -euo pipefail

ENV_FILE="/root/.mc-ops-report.env"
LOG_FILE="/var/log/mc-ops-report.log"
BACKUP_LOG="/var/log/meaningful-conversations-backup.log"
BACKUP_DIRS=(
  "/var/backups/meaningful-conversations"
  "/root/backups/meaningful-conversations-production"
)
BACKUP_MAX_AGE_HOURS=26
BACKUP_MIN_BYTES=10240
DISK_WARN_PCT=85
HEALTH_PROD_URL="https://mc-app.manualmode.at/api/health"
HEALTH_STAGING_URL="https://mc-beta.manualmode.at/api/health"
CHECK_STAGING_HEALTH=true

PROD_CONTAINERS=(
  meaningful-conversations-mariadb-production
  meaningful-conversations-backend-production
  meaningful-conversations-frontend-production
  meaningful-conversations-tts-production
)

DRY_RUN=false
WEEKLY_SUMMARY=false
TEST_MAIL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --weekly-summary) WEEKLY_SUMMARY=true ;;
    --test-mail) TEST_MAIL=true ;;
    -h|--help)
      sed -n '2,12p' "$0"
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

log_line() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >> "$LOG_FILE"
  echo "$msg"
}

# Overall: 0=OK, 1=WARN, 2=FAIL
OVERALL=0
REPORT=""

section() {
  REPORT+=$'\n'"=== $* ==="$'\n'
}

append() {
  REPORT+="$*"$'\n'
}

bump_status() {
  local level="$1"
  if [[ "$level" == "FAIL" && "$OVERALL" -lt 2 ]]; then
    OVERALL=2
  elif [[ "$level" == "WARN" && "$OVERALL" -lt 1 ]]; then
    OVERALL=1
  fi
}

check_backups() {
  section "Database backups"
  local found_any=false

  if [[ -f "$BACKUP_LOG" ]]; then
    append "Backup log (last 3 lines):"
    while IFS= read -r line; do append "  $line"; done < <(tail -n 3 "$BACKUP_LOG")
  else
    append "Backup log missing: $BACKUP_LOG"
    bump_status WARN
  fi

  for dir in "${BACKUP_DIRS[@]}"; do
    [[ -d "$dir" ]] || continue
    found_any=true
    local latest
    latest=$(find "$dir" -maxdepth 1 -type f \( -name '*.sql.gz' -o -name '*.sql' -o -name '*.gz' \) -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [[ -z "$latest" ]]; then
      append "FAIL $dir: no backup files"
      bump_status FAIL
      continue
    fi
    local age_hours size
    age_hours=$(( ( $(date +%s) - $(stat -c %Y "$latest" 2>/dev/null || stat -f %m "$latest") ) / 3600 ))
    size=$(stat -c %s "$latest" 2>/dev/null || stat -f %z "$latest")
    append "OK $dir: $(basename "$latest") age=${age_hours}h size=${size}B"
    if [[ "$age_hours" -gt "$BACKUP_MAX_AGE_HOURS" ]]; then
      append "  -> FAIL backup older than ${BACKUP_MAX_AGE_HOURS}h"
      bump_status FAIL
    fi
    if [[ "$size" -lt "$BACKUP_MIN_BYTES" ]]; then
      append "  -> FAIL backup smaller than ${BACKUP_MIN_BYTES}B"
      bump_status FAIL
    fi
    if [[ "$latest" == *.gz ]] && command -v gzip >/dev/null; then
      if ! gzip -t "$latest" 2>/dev/null; then
        append "  -> FAIL gzip integrity check failed"
        bump_status FAIL
      fi
    fi
  done

  if [[ "$found_any" == false ]]; then
    append "FAIL: no backup directory found (checked: ${BACKUP_DIRS[*]})"
    bump_status FAIL
  fi
}

check_health() {
  section "Health / availability"
  local code body
  if code=$(curl -sf -o /tmp/mc-ops-health-prod.json -w '%{http_code}' --connect-timeout 15 --max-time 30 "$HEALTH_PROD_URL"); then
    body=$(head -c 200 /tmp/mc-ops-health-prod.json 2>/dev/null || true)
    append "Production $HEALTH_PROD_URL -> HTTP $code $body"
    if [[ "$code" != "200" ]] || ! grep -q '"status":"ok"' /tmp/mc-ops-health-prod.json 2>/dev/null; then
      bump_status FAIL
    fi
  else
    append "FAIL Production health check: $HEALTH_PROD_URL unreachable"
    bump_status FAIL
  fi

  if [[ "$CHECK_STAGING_HEALTH" == true ]]; then
    if staging_running=$(podman ps --filter "name=meaningful-conversations-backend-staging" --format '{{.Names}}' 2>/dev/null | wc -l); then
      if [[ "${staging_running:-0}" -gt 0 ]]; then
        if code=$(curl -sf -o /tmp/mc-ops-health-staging.json -w '%{http_code}' --connect-timeout 15 --max-time 30 "$HEALTH_STAGING_URL"); then
          body=$(head -c 200 /tmp/mc-ops-health-staging.json 2>/dev/null || true)
          append "Staging $HEALTH_STAGING_URL -> HTTP $code $body"
        else
          append "WARN Staging health check failed (containers running)"
          bump_status WARN
        fi
      else
        append "Staging: not running (skipped)"
      fi
    fi
  fi

  section "Production containers (podman)"
  local missing=0
  for c in "${PROD_CONTAINERS[@]}"; do
    if podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$c"; then
      status=$(podman ps --filter "name=^${c}$" --format '{{.Status}}' 2>/dev/null | head -1)
      append "OK $c: $status"
    else
      append "FAIL $c: not running"
      missing=$((missing + 1))
    fi
  done
  if [[ "$missing" -gt 0 ]]; then
    bump_status FAIL
  fi
}

check_disk() {
  section "Disk usage"
  while read -r line; do
    pct=$(echo "$line" | awk '{print $5}' | tr -d '%')
    mount=$(echo "$line" | awk '{print $6}')
    [[ "$mount" == "/" || "$mount" == "/var" || "$mount" == /var/backups* || "$mount" == /root/backups* ]] || continue
    append "$line"
    if [[ "$pct" =~ ^[0-9]+$ ]] && [[ "$pct" -ge "$DISK_WARN_PCT" ]]; then
      append "  -> WARN usage >= ${DISK_WARN_PCT}% on $mount"
      bump_status WARN
    fi
  done < <(df -hP / /var 2>/dev/null | tail -n +2)
  if [[ -d /var/backups ]]; then
    while IFS= read -r line; do append "$line"; done < <(df -hP /var/backups 2>/dev/null | tail -n +2)
  fi
}

check_patches() {
  section "Security / important patches (report only, no install)"
  if command -v apt-get >/dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    local sim
    sim=$(apt-get -s upgrade 2>/dev/null | grep -E '^Inst' | grep -Ei 'security|important' || true)
    if [[ -n "$sim" ]]; then
      append "$sim"
      bump_status WARN
    else
      append "No pending security/important apt upgrades (simulated)."
    fi
  elif command -v dnf >/dev/null; then
    local sec_lines count
    sec_lines=$(dnf check-update --security -q 2>/dev/null | grep -E '^[[:alnum:]]' || true)
    count=$(echo "$sec_lines" | grep -c . || true)
    if [[ "${count:-0}" -gt 0 ]]; then
      append "${count} security-related package(s) available (dnf check-update --security):"
      while IFS= read -r l; do append "  $l"; done < <(echo "$sec_lines" | head -n 25)
      [[ "$count" -gt 25 ]] && append "  ... ($(( count - 25 )) more)"
      bump_status WARN
    else
      append "No pending security updates (dnf check-update --security)."
    fi
  else
    append "WARN: no apt-get or dnf — patch check skipped"
    bump_status WARN
  fi
}

check_monday_logs() {
  section "Weekly maintenance logs (if present)"
  if [[ -f /var/log/update-check.log ]]; then
    append "update-check.log (tail):"
    while IFS= read -r line; do append "  $line"; done < <(tail -n 8 /var/log/update-check.log)
  fi
  if [[ -f /var/log/schema-drift.log ]]; then
    append "schema-drift.log (tail):"
    while IFS= read -r line; do append "  $line"; done < <(tail -n 8 /var/log/schema-drift.log)
    if grep -q "DRIFT DETECTED\|drift detected\|Unterschied" /var/log/schema-drift.log 2>/dev/null; then
      if tail -n 30 /var/log/schema-drift.log | grep -qi "drift"; then
        bump_status WARN
        append "  -> WARN possible schema drift (see log)"
      fi
    fi
  fi
}

send_mail() {
  local subject="$1"
  local body="$2"
  if [[ "$DRY_RUN" == true ]]; then
    log_line "DRY-RUN: would email $MC_OPS_REPORT_EMAIL subject=$subject"
    return 0
  fi
  if command -v msmtp >/dev/null && { [[ -f /etc/msmtprc ]] || [[ -f /root/.msmtprc ]]; }; then
    {
      echo "To: $MC_OPS_REPORT_EMAIL"
      echo "Subject: $subject"
      echo ""
      echo "$body"
    } | msmtp -a default "$MC_OPS_REPORT_EMAIL" 2>>"$LOG_FILE" && return 0
  fi
  if command -v mail >/dev/null; then
    echo "$body" | mail -r "mc-ops@$(hostname -f 2>/dev/null || hostname)" -s "$subject" "$MC_OPS_REPORT_EMAIL" 2>>"$LOG_FILE"
    return 0
  fi
  log_line "ERROR: no mail/msmtp available"
  return 1
}

if [[ "$TEST_MAIL" == true ]]; then
  if send_mail "MC ops report test" "Test message from $(hostname) at $(date). If you receive this, outbound mail works."; then
    log_line "Test mail queued/sent to $MC_OPS_REPORT_EMAIL"
    exit 0
  fi
  exit 2
fi

HOSTNAME=$(hostname -f 2>/dev/null || hostname)
REPORT="MC server ops report — $HOSTNAME — $(date '+%Y-%m-%d %H:%M %Z')"

check_backups
check_health
check_disk
check_patches
check_monday_logs

STATUS_LABEL=OK
[[ "$OVERALL" -eq 1 ]] && STATUS_LABEL=WARN
[[ "$OVERALL" -eq 2 ]] && STATUS_LABEL=FAIL

log_line "Run complete: $STATUS_LABEL (code=$OVERALL)"

SUBJECT="MC ops [$STATUS_LABEL] $HOSTNAME $(date +%Y-%m-%d)"

should_send=false
if [[ "$OVERALL" -ge 1 ]]; then
  should_send=true
elif [[ "$WEEKLY_SUMMARY" == true && "$OVERALL" -eq 0 ]]; then
  REPORT=$'Weekly summary: all checks OK.\n\n'"$REPORT"
  SUBJECT="MC ops [OK] weekly summary $HOSTNAME $(date +%Y-%m-%d)"
  should_send=true
fi

if [[ "$should_send" == true ]]; then
  send_mail "$SUBJECT" "$REPORT" || true
elif [[ "$DRY_RUN" == true ]]; then
  log_line "DRY-RUN: no mail (status OK, not weekly summary)"
fi

if [[ "$DRY_RUN" == true ]]; then
  echo "$REPORT"
fi

exit "$OVERALL"
