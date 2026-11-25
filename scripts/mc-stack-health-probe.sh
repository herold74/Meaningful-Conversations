#!/bin/bash
#
# MC stack health probe (run on server via cron every ~10 min).
# Observes public API/root, backend :8080 on pod IP, nginx upstream drift, podman health.
# Complements mc-stack-watchdog.timer (repair) and server-ops-report.sh (daily mail).
#
# Install: scripts/install-mc-health-probe-cron.sh
# Log: /var/log/mc-stack-health-probe.log
#
# Config (server): /root/.mc-ops-report.env
#   MC_OPS_REPORT_EMAIL — default recipient
#   MC_PROBE_ALERT_EMAIL — optional override for prod alerts only
#
# Usage:
#   mc-stack-health-probe.sh [--test-mail]
#
set -uo pipefail

LOG_FILE="/var/log/mc-stack-health-probe.log"
STATE_FILE="/var/run/mc-stack-health-probe.state"
PROD_STATE_FILE="/var/run/mc-stack-health-probe.prod.state"
PROD_MAIL_TS_FILE="/var/run/mc-stack-health-probe.prod-mail.ts"
WATCHDOG_LOG="/var/log/mc-stack-watchdog.log"
OPS_ENV_FILE="/root/.mc-ops-report.env"
PROD_REMINDER_SEC="${MC_PROBE_REMINDER_SEC:-3600}"

TEST_MAIL=false
[[ "${1:-}" == "--test-mail" ]] && TEST_MAIL=true

if [[ -f "$OPS_ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$OPS_ENV_FILE"
fi
MC_PROBE_ALERT_EMAIL="${MC_PROBE_ALERT_EMAIL:-${MC_OPS_REPORT_EMAIL:-support@manualmode.at}}"

PROD_ISSUES=""
PROD_METRICS=""

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >>"$LOG_FILE"
}

send_alert_mail() {
  local urgency="$1" subject="$2" body="$3"
  local to="$MC_PROBE_ALERT_EMAIL"
  if command -v msmtp >/dev/null && { [[ -f /etc/msmtprc ]] || [[ -f /root/.msmtprc ]]; }; then
    {
      if [[ -n "${MC_OPS_REPORT_FROM:-}" ]]; then
        echo "From: $MC_OPS_REPORT_FROM"
      fi
      echo "To: $to"
      echo "Subject: $subject"
      if [[ "$urgency" == "urgent" ]]; then
        echo "Priority: urgent"
        echo "Importance: high"
        echo "X-Priority: 1"
      fi
      echo ""
      echo "$body"
    } | msmtp -a default "$to" 2>>"$LOG_FILE" && {
      log "MAIL sent ($urgency) to $to subject=$subject"
      return 0
    }
  fi
  if command -v mail >/dev/null; then
    if [[ "$urgency" == "urgent" ]]; then
      echo "$body" | mail -r "mc-probe@$(hostname -f 2>/dev/null || hostname)" -s "$subject" -a "Priority: urgent" "$to" 2>>"$LOG_FILE"
    else
      echo "$body" | mail -r "mc-probe@$(hostname -f 2>/dev/null || hostname)" -s "$subject" "$to" 2>>"$LOG_FILE"
    fi
    log "MAIL sent via mail(1) ($urgency) to $to"
    return 0
  fi
  log "MAIL ERROR: no msmtp/mail; cannot alert"
  return 1
}

maybe_mail_prod_alert() {
  local kind="$1" detail="$2"
  local now last=0
  now=$(date +%s)
  [[ -f "$PROD_MAIL_TS_FILE" ]] && last=$(cat "$PROD_MAIL_TS_FILE" 2>/dev/null || echo 0)
  if [[ "$kind" == "ongoing" ]] && (( now - last < PROD_REMINDER_SEC )); then
    log "MAIL skip ongoing reminder (cooldown ${PROD_REMINDER_SEC}s)"
    return 0
  fi
  local host hn body
  hn=$(hostname -f 2>/dev/null || hostname)
  body="Meaningful Conversations — Production impairment detected

Host: $hn
Time: $(date '+%Y-%m-%d %H:%M:%S %Z')

$detail

Watchdog (auto-repair): systemctl start mc-stack-watchdog.service
Log probe:  tail -30 $LOG_FILE
Log watchdog: tail -30 $WATCHDOG_LOG
Nginx refresh: /usr/local/bin/update-nginx-ips.sh production

This is an automated alert from mc-stack-health-probe.sh (cron */10)."
  local subject
  if [[ "$kind" == "recovered" ]]; then
    subject="MC Production recovered — mc-app.manualmode.at OK"
    send_alert_mail "normal" "$subject" "$body"
  else
    subject="URGENT: MC Production impaired — mc-app.manualmode.at"
    send_alert_mail "urgent" "$subject" "$body"
  fi
  echo "$now" >"$PROD_MAIL_TS_FILE"
}

http_code() {
  curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 8 --max-time 15 "$1" 2>/dev/null || echo "000"
}

container_ip() {
  podman inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$1" 2>/dev/null || true
}

podman_health() {
  podman inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$1" 2>/dev/null || echo "none"
}

nginx_backend_upstream() {
  local conf="/etc/nginx/conf.d/${1}-meaningful-conversations.conf"
  [[ -f "$conf" ]] || return 0
  grep -m1 'proxy_pass http://' "$conf" 2>/dev/null | sed -n 's|.*http://\([0-9.]*\):8080.*|\1|p'
}

nginx_frontend_upstream() {
  local conf="/etc/nginx/conf.d/${1}-meaningful-conversations.conf"
  [[ -f "$conf" ]] || return 0
  grep 'proxy_pass http://' "$conf" 2>/dev/null | sed -n 's|.*http://\([0-9.]*\):3000.*|\1|p' | head -1
}

probe_env() {
  local env="$1" api_url="$2" root_url="$3"
  local backend="meaningful-conversations-backend-${env}"
  local frontend="meaningful-conversations-frontend-${env}"
  local issues=()
  local pub_api pub_root bip fip local_be nginx_be nginx_fe php

  if ! podman ps --filter "name=^${backend}$" --filter status=running -q 2>/dev/null | grep -q .; then
    issues+=("backend-not-running")
    log "ALERT $env: backend container not running"
    return 1
  fi

  pub_api=$(http_code "$api_url")
  pub_root=$(http_code "$root_url")
  bip=$(container_ip "$backend")
  fip=$(container_ip "$frontend")
  nginx_be=$(nginx_backend_upstream "$env")
  nginx_fe=$(nginx_frontend_upstream "$env")
  php=$(podman_health "$backend")

  if [[ -n "$bip" ]]; then
    local_be=$(http_code "http://${bip}:8080/api/health")
  else
    local_be="000"
    issues+=("no-backend-ip")
  fi

  [[ "$pub_api" != "200" ]] && issues+=("public-api=${pub_api}")
  [[ "$pub_root" != "200" ]] && issues+=("public-root=${pub_root}")
  [[ "$local_be" != "200" ]] && issues+=("local-backend=${local_be}")
  [[ "$php" == "unhealthy" ]] && issues+=("podman-health=unhealthy")
  if [[ -n "$bip" && -n "$nginx_be" && "$bip" != "$nginx_be" ]]; then
    issues+=("nginx-backend-drift pod=${bip} nginx=${nginx_be}")
  fi
  if [[ -n "$fip" && -n "$nginx_fe" && "$fip" != "$nginx_fe" ]]; then
    issues+=("nginx-frontend-drift pod=${fip} nginx=${nginx_fe}")
  fi

  if [[ ${#issues[@]} -gt 0 ]]; then
    local summary
    summary="$(IFS='; '; echo "${issues[*]}") | pub_api=$pub_api pub_root=$pub_root local=$local_be health=$php"
    log "ALERT $env: $summary"
    if [[ "$env" == "production" ]]; then
      PROD_ISSUES="$summary"
      PROD_METRICS="api=$pub_api root=$pub_root local_backend=$local_be nginx_be=${nginx_be:-?} pod_ip=${bip:-?} health=$php"
    fi
    if [[ -f "$WATCHDOG_LOG" ]]; then
      while IFS= read -r line; do log "  watchdog: $line"; done < <(grep -E 'WARN|Repair|force-recreate|dependent containers' "$WATCHDOG_LOG" 2>/dev/null | tail -5)
    fi
    return 1
  fi

  log "OK $env: pub_api=$pub_api pub_root=$pub_root local=$local_be nginx_be=$nginx_be health=$php"
  return 0
}

if [[ "$TEST_MAIL" == true ]]; then
  send_alert_mail "urgent" "URGENT: MC Production probe mail test" \
    "Test urgent alert from $(hostname) at $(date). If you receive this, prod impairment mail works."
  exit $?
fi

overall=0
prod_ok=0
probe_env production "https://mc-app.manualmode.at/api/health" "https://mc-app.manualmode.at/" && prod_ok=1 || overall=1

if podman ps --filter "name=^meaningful-conversations-backend-staging$" --filter status=running -q 2>/dev/null | grep -q .; then
  probe_env staging "https://mc-beta.manualmode.at/api/health" "https://mc-beta.manualmode.at/" || overall=1
else
  log "SKIP staging: backend not running"
fi

prev=ok
[[ -f "$STATE_FILE" ]] && prev=$(cat "$STATE_FILE" 2>/dev/null || echo ok)
prod_prev=ok
[[ -f "$PROD_STATE_FILE" ]] && prod_prev=$(cat "$PROD_STATE_FILE" 2>/dev/null || echo ok)

if [[ "$overall" -eq 0 ]]; then
  echo ok >"$STATE_FILE"
  [[ "$prev" != "ok" ]] && log "RECOVERED: stack probe back to OK (was $prev)"
else
  echo fail >"$STATE_FILE"
  [[ "$prev" == "ok" ]] && log "TRANSITION: OK -> FAIL (watchdog should heal; verify no force-recreate in $WATCHDOG_LOG)"
fi

if [[ "$prod_ok" -eq 1 ]]; then
  echo ok >"$PROD_STATE_FILE"
  if [[ "$prod_prev" != "ok" ]]; then
    log "RECOVERED: production probe OK (was $prod_prev)"
    watchdog_tail=""
    [[ -f "$WATCHDOG_LOG" ]] && watchdog_tail=$(grep -E 'WARN|Repair|OK' "$WATCHDOG_LOG" 2>/dev/null | tail -5)
    maybe_mail_prod_alert "recovered" "Production checks are green again.

Metrics: all probes returned HTTP 200.

Recent watchdog:
${watchdog_tail:-(no lines)}"
  fi
else
  echo fail >"$PROD_STATE_FILE"
  detail="Issues: ${PROD_ISSUES:-unknown}
Metrics: ${PROD_METRICS:-n/a}"
  if [[ -f "$WATCHDOG_LOG" ]]; then
    detail+=$'\n\nRecent watchdog:'
    while IFS= read -r line; do detail+=$'\n'"  $line"; done < <(grep -E 'WARN|Repair|force-recreate|dependent containers' "$WATCHDOG_LOG" 2>/dev/null | tail -8)
  fi
  if [[ "$prod_prev" == "ok" ]]; then
    log "TRANSITION: production OK -> FAIL — sending urgent mail"
    maybe_mail_prod_alert "new" "$detail"
  else
    maybe_mail_prod_alert "ongoing" "$detail"
  fi
fi

exit "$overall"