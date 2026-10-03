#!/bin/bash
#
# Meaningful Conversations — server ops report (health, backups, patches).
# Cron (CRON_TZ=Europe/Vienna): 07:30 daily; Mon 07:45 --weekly-summary;
# Mon 08:30 deploy-mc-production (see MONITORING-QUICK-REFERENCE.md).
#
# Usage:
#   server-ops-report.sh [--dry-run] [--weekly-summary] [--test-mail]
#
# Config (server only): /root/.mc-ops-report.env → MC_OPS_REPORT_EMAIL
#
set -euo pipefail

ENV_FILE="/root/.mc-ops-report.env"
LOG_FILE="/var/log/mc-ops-report.log"
BACKUP_LOG="/var/log/meaningful-conversations-backup.log"
BACKUP_DIRS=(
  "/var/backups/meaningful-conversations"
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
  if [[ -t 1 ]] || [[ "$DRY_RUN" == true ]]; then
    echo "$msg"
  fi
}

OVERALL=0
DETAILS=""
ACTIONS=()
SUMMARY_BACKUP="OK"
SUMMARY_PROD="OK"
SUMMARY_STAGING="—"
SUMMARY_DISK="OK"
SUMMARY_KERNEL="OK"
SUMMARY_PATCHES="OK"

section() {
  DETAILS+=$'\n'"=== $* ==="$'\n'
}

append() {
  DETAILS+="$*"$'\n'
}

bump_status() {
  local level="$1"
  if [[ "$level" == "FAIL" && "$OVERALL" -lt 2 ]]; then
    OVERALL=2
  elif [[ "$level" == "WARN" && "$OVERALL" -lt 1 ]]; then
    OVERALL=1
  fi
}

add_action() {
  local level="$1" what="$2" todo="$3"
  ACTIONS+=("[$level] $what — $todo")
}

check_backups() {
  section "Database backups"
  local found_any=false
  local backup_status="OK"

  if [[ -f "$BACKUP_LOG" ]]; then
    append "Backup log (last 3 lines):"
    while IFS= read -r line; do append "  $line"; done < <(tail -n 3 "$BACKUP_LOG")
  else
    append "Backup log missing: $BACKUP_LOG"
    bump_status WARN
    backup_status="WARN"
    add_action "WARN" "Backup-Log fehlt" "SSH: ls -la $BACKUP_LOG; Cron backup-databases.sh (06:00 Vienna) prüfen"
  fi

  for dir in "${BACKUP_DIRS[@]}"; do
    [[ -d "$dir" ]] || continue
    found_any=true
    local latest
    latest=$(find "$dir" -maxdepth 1 -type f \( -name '*.sql.gz' -o -name '*.sql' -o -name '*.gz' \) -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [[ -z "$latest" ]]; then
      append "FAIL $dir: no backup files"
      bump_status FAIL
      backup_status="FAIL"
      add_action "FAIL" "Keine Backup-Dateien in $dir" "SSH: /usr/local/bin/backup-databases.sh manuell; Log $BACKUP_LOG"
      continue
    fi
    local age_hours size
    age_hours=$(( ( $(date +%s) - $(stat -c %Y "$latest" 2>/dev/null || stat -f %m "$latest") ) / 3600 ))
    size=$(stat -c %s "$latest" 2>/dev/null || stat -f %z "$latest")
    append "OK $dir: $(basename "$latest") age=${age_hours}h size=${size}B"
    SUMMARY_BACKUP="OK (neuestes Dump ${age_hours}h, $(basename "$latest"))"
    if [[ "$age_hours" -gt "$BACKUP_MAX_AGE_HOURS" ]]; then
      append "  backup older than ${BACKUP_MAX_AGE_HOURS}h"
      bump_status FAIL
      backup_status="FAIL"
      SUMMARY_BACKUP="FAIL (älter als ${BACKUP_MAX_AGE_HOURS}h)"
      add_action "FAIL" "DB-Backup zu alt (${age_hours}h)" "SSH: /usr/local/bin/backup-databases.sh; Verzeichnis $dir prüfen"
    fi
    if [[ "$size" -lt "$BACKUP_MIN_BYTES" ]]; then
      bump_status FAIL
      backup_status="FAIL"
      SUMMARY_BACKUP="FAIL (Datei zu klein)"
      add_action "FAIL" "Backup-Datei zu klein (${size}B)" "Dump/DB prüfen; backup-databases.sh Log lesen"
    fi
    if [[ "$latest" == *.gz ]] && command -v gzip >/dev/null; then
      if ! gzip -t "$latest" 2>/dev/null; then
        bump_status FAIL
        backup_status="FAIL"
        SUMMARY_BACKUP="FAIL (gzip defekt)"
        add_action "FAIL" "Backup gzip-Integrität" "SSH: gzip -t $latest; neues Backup erzeugen"
      fi
    fi
  done

  if [[ "$found_any" == false ]]; then
    append "FAIL: no backup directory found (checked: ${BACKUP_DIRS[*]})"
    bump_status FAIL
    SUMMARY_BACKUP="FAIL (kein Verzeichnis)"
    add_action "FAIL" "Backup-Verzeichnis fehlt" "SSH: mkdir/Permissions $BACKUP_DIRS; backup-databases.sh"
  fi
}

check_health() {
  section "Health / availability"
  local code body missing=0

  if code=$(curl -sf -o /tmp/mc-ops-health-prod.json -w '%{http_code}' --connect-timeout 15 --max-time 30 "$HEALTH_PROD_URL"); then
    body=$(head -c 120 /tmp/mc-ops-health-prod.json 2>/dev/null || true)
    append "Production $HEALTH_PROD_URL -> HTTP $code $body"
    if [[ "$code" == "200" ]] && grep -q '"status":"ok"' /tmp/mc-ops-health-prod.json 2>/dev/null; then
      SUMMARY_PROD="OK (HTTP 200)"
    else
      bump_status FAIL
      SUMMARY_PROD="FAIL (HTTP $code)"
      add_action "FAIL" "Production Health nicht OK" "curl -sS $HEALTH_PROD_URL; SSH: podman ps; podman-compose-production logs backend"
    fi
  else
    append "Production health unreachable: $HEALTH_PROD_URL"
    bump_status FAIL
    SUMMARY_PROD="FAIL (unreachable)"
    add_action "FAIL" "Production Health nicht erreichbar" "curl -sS $HEALTH_PROD_URL; nginx + podman ps auf Server"
  fi

  if [[ "$CHECK_STAGING_HEALTH" == true ]]; then
    if staging_running=$(podman ps --filter "name=meaningful-conversations-backend-staging" --format '{{.Names}}' 2>/dev/null | wc -l); then
      if [[ "${staging_running:-0}" -gt 0 ]]; then
        if code=$(curl -sf -o /tmp/mc-ops-health-staging.json -w '%{http_code}' --connect-timeout 15 --max-time 30 "$HEALTH_STAGING_URL"); then
          body=$(head -c 120 /tmp/mc-ops-health-staging.json 2>/dev/null || true)
          append "Staging $HEALTH_STAGING_URL -> HTTP $code $body"
          if [[ "$code" == "200" ]] && grep -q '"status":"ok"' /tmp/mc-ops-health-staging.json 2>/dev/null; then
            SUMMARY_STAGING="OK (HTTP 200)"
          else
            bump_status WARN
            SUMMARY_STAGING="WARN (HTTP $code)"
            add_action "WARN" "Staging Health nicht OK" "curl -sS $HEALTH_STAGING_URL; podman ps staging; ggf. compose up"
          fi
        else
          append "Staging health check failed (containers running)"
          bump_status WARN
          SUMMARY_STAGING="WARN (curl failed)"
          add_action "WARN" "Staging Health curl fehlgeschlagen" "curl -sS $HEALTH_STAGING_URL; nginx IPs / staging containers"
        fi
      else
        append "Staging: not running (skipped)"
        SUMMARY_STAGING="— (nicht gestartet)"
      fi
    fi
  fi

  section "Production containers (podman)"
  for c in "${PROD_CONTAINERS[@]}"; do
    # Avoid `podman ps | grep` under pipefail (SIGPIPE → false "not running").
    running_id=$(podman ps --filter "name=^${c}$" --filter status=running -q 2>/dev/null | head -1)
    if [[ -n "$running_id" ]]; then
      status=$(podman ps --filter "name=^${c}$" --format '{{.Status}}' 2>/dev/null | head -1)
      append "OK $c: $status"
    else
      append "FAIL $c: not running"
      missing=$((missing + 1))
    fi
  done
  if [[ "$missing" -gt 0 ]]; then
    bump_status FAIL
    SUMMARY_PROD="FAIL ($missing Container fehlen)"
    add_action "FAIL" "$missing Production-Container fehlen" "SSH: podman ps -a; cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml up -d; watchdog-Log prüfen"
  fi
}

check_disk() {
  section "Disk usage"
  local line pct mount
  line=$(df -hP / 2>/dev/null | tail -1)
  if [[ -n "$line" ]]; then
    append "$line"
    pct=$(echo "$line" | awk '{print $5}' | tr -d '%')
    mount=$(echo "$line" | awk '{print $6}')
    if [[ "$pct" =~ ^[0-9]+$ ]] && [[ "$pct" -ge "$DISK_WARN_PCT" ]]; then
      bump_status WARN
      SUMMARY_DISK="WARN (${pct}% auf $mount)"
      add_action "WARN" "Disk ≥${DISK_WARN_PCT}% auf $mount" "SSH: df -h; /usr/local/bin/podman-image-cleanup.sh; große Logs prüfen"
    else
      SUMMARY_DISK="OK (${pct:-?}% auf $mount)"
    fi
  fi
}

check_patches() {
  section "Security patches (report only)"
  if command -v apt-get >/dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    local sim
    sim=$(apt-get -s upgrade 2>/dev/null | grep -E '^Inst' | grep -Ei 'security|important' || true)
    if [[ -n "$sim" ]]; then
      append "$sim"
      bump_status WARN
      SUMMARY_PATCHES="WARN (apt security updates)"
      add_action "WARN" "Security-Updates (apt) ausstehend" "SSH: apt-get upgrade (HTIL + Wartungsfenster); nicht automatisch per Cron"
    else
      append "No pending security/important apt upgrades."
      SUMMARY_PATCHES="OK (keine apt security)"
    fi
  elif command -v dnf >/dev/null; then
    local sec_lines count
    sec_lines=$(dnf check-update --security -q 2>/dev/null | grep -E '^[[:alnum:]]' || true)
    count=$(echo "$sec_lines" | grep -c . || true)
    if [[ "${count:-0}" -gt 0 ]]; then
      append "${count} security package(s) available:"
      while IFS= read -r l; do append "  $l"; done < <(echo "$sec_lines" | head -n 15)
      [[ "$count" -gt 15 ]] && append "  ... ($(( count - 15 )) more)"
      bump_status WARN
      SUMMARY_PATCHES="WARN ($count dnf security)"
      add_action "WARN" "$count DNF-Security-Updates" "SSH: dnf check-update --security; Patch-Fenster mit Banner planen (HTIL, kein Auto-dnf)"
    else
      append "No pending security updates (dnf check-update --security)."
      SUMMARY_PATCHES="OK (keine dnf security)"
    fi
  else
    append "Patch check skipped (no apt/dnf)"
    bump_status WARN
    SUMMARY_PATCHES="WARN (kein dnf)"
  fi
}

check_kernel_reboot() {
  section "Kernel / reboot (live)"
  local running latest
  running=$(uname -r)
  append "Running: $running"
  if command -v rpm >/dev/null; then
    latest=$(rpm -q kernel --last 2>/dev/null | head -1 | sed 's/^kernel-//' | awk '{print $1}')
    append "Latest installed: ${latest:-unknown}"
    if [[ -n "$latest" && "$running" != "$latest" ]]; then
      bump_status WARN
      SUMMARY_KERNEL="WARN (Reboot für $latest)"
      add_action "WARN" "Kernel: läuft $running, installiert $latest" "Wartungsfenster + Reboot planen (HTIL); uname -r nach Boot prüfen"
    else
      SUMMARY_KERNEL="OK ($running)"
    fi
  fi
  if command -v dnf >/dev/null; then
    if dnf needs-restarting -r >/dev/null 2>&1; then
      append "dnf needs-restarting: no reboot required"
    else
      append "dnf needs-restarting: reboot suggested"
      bump_status WARN
      [[ "$SUMMARY_KERNEL" == OK* ]] && SUMMARY_KERNEL="WARN (dnf needs-reboot)"
      add_action "WARN" "dnf needs-restarting meldet Reboot" "SSH: dnf needs-restarting -r; Reboot im Wartungsfenster (HTIL)"
    fi
  fi
}

check_weekly_maintenance() {
  section "Weekly maintenance (log references)"
  if [[ -f /var/log/update-check.log ]]; then
    local last_header
    last_header=$(grep "^Update-Check:" /var/log/update-check.log 2>/dev/null | tail -1 || true)
    [[ -n "$last_header" ]] && append "Last check-updates.sh: $last_header"
  fi

  if [[ -f /var/log/schema-drift.log ]]; then
    local last_run_start last_block
    last_run_start=$(grep -n 'Weekly Schema Drift Check Started' /var/log/schema-drift.log 2>/dev/null | tail -1 | cut -d: -f1)
    if [[ -n "$last_run_start" ]]; then
      append "schema-drift (latest run):"
      while IFS= read -r line; do append "  $line"; done < <(tail -n +"$last_run_start" /var/log/schema-drift.log | head -n 10)
      last_block=$(tail -n +"$last_run_start" /var/log/schema-drift.log 2>/dev/null)
      if echo "$last_block" | grep -qiE 'drift detected|schema drift found|unterschied|✗.*schema'; then
        bump_status WARN
        add_action "WARN" "Schema-Drift (letzter Mo-Lauf)" "SSH: tail /var/log/schema-drift.log; Staging/Prod Migrationen vergleichen"
      fi
    fi
  fi
}

build_report() {
  local status_label host_line ts
  STATUS_LABEL=OK
  [[ "$OVERALL" -eq 1 ]] && STATUS_LABEL=WARN
  [[ "$OVERALL" -eq 2 ]] && STATUS_LABEL=FAIL

  host_line="${HOSTNAME:-$(hostname)}"
  ts=$(date '+%Y-%m-%d %H:%M %Z')

  local body=""
  if [[ "$WEEKLY_SUMMARY" == true && "$OVERALL" -eq 0 ]]; then
    body+="Wochenzusammenfassung — alle Checks OK."$'\n\n'
  fi

  body+="Gesamtstatus: ${STATUS_LABEL} — ${host_line} — ${ts}"$'\n\n'
  body+="HANDLUNG ERFORDERLICH"$'\n'
  if [[ ${#ACTIONS[@]} -eq 0 ]]; then
    body+="Keine — alles im grünen Bereich."$'\n\n'
  else
    local i=1
    for action in "${ACTIONS[@]}"; do
      body+="${i}. ${action}"$'\n'
      i=$((i + 1))
    done
    body+=$'\n'
  fi

  body+="KURZÜBERSICHT"$'\n'
  body+="• Backup:   ${SUMMARY_BACKUP}"$'\n'
  body+="• Prod:     ${SUMMARY_PROD}"$'\n'
  body+="• Staging:  ${SUMMARY_STAGING}"$'\n'
  body+="• Disk:     ${SUMMARY_DISK}"$'\n'
  body+="• Kernel:   ${SUMMARY_KERNEL}"$'\n'
  body+="• Patches:  ${SUMMARY_PATCHES}"$'\n\n'
  body+="DETAILS"$'\n'
  body+="${DETAILS}"

  REPORT="$body"
  SUBJECT="MC ops [${STATUS_LABEL}] ${host_line} $(date +%Y-%m-%d)"
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
      if [[ -n "${MC_OPS_REPORT_FROM:-}" ]]; then
        echo "From: $MC_OPS_REPORT_FROM"
      fi
      echo "To: $MC_OPS_REPORT_EMAIL"
      echo "Subject: $subject"
      echo ""
      echo "$body"
    } | msmtp -a default "$MC_OPS_REPORT_EMAIL" 2>>"$LOG_FILE" && {
      log_line "Mail sent via msmtp (account default)"
      return 0
    }
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

check_backups
check_health
check_disk
check_patches
check_kernel_reboot
check_weekly_maintenance

build_report

log_line "Run complete: $STATUS_LABEL (code=$OVERALL)"

should_send=false
if [[ "$OVERALL" -ge 1 ]]; then
  should_send=true
elif [[ "$WEEKLY_SUMMARY" == true && "$OVERALL" -eq 0 ]]; then
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
