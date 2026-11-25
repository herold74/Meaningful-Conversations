#!/bin/bash
#
# MC stack health probe (run on server via cron every ~10 min).
# Observes public API/root, backend :8080 on pod IP, nginx upstream drift, podman health.
# Complements mc-stack-watchdog.timer (repair) and server-ops-report.sh (daily mail).
#
# Install: scripts/install-mc-health-probe-cron.sh
# Log: /var/log/mc-stack-health-probe.log
#
set -uo pipefail

LOG_FILE="/var/log/mc-stack-health-probe.log"
STATE_FILE="/var/run/mc-stack-health-probe.state"
WATCHDOG_LOG="/var/log/mc-stack-watchdog.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >>"$LOG_FILE"
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
    log "ALERT $env: $(IFS='; '; echo "${issues[*]}") | pub_api=$pub_api pub_root=$pub_root local=$local_be health=$php"
    if [[ -f "$WATCHDOG_LOG" ]]; then
      while IFS= read -r line; do log "  watchdog: $line"; done < <(grep -E 'WARN|Repair|force-recreate|dependent containers' "$WATCHDOG_LOG" 2>/dev/null | tail -5)
    fi
    return 1
  fi

  log "OK $env: pub_api=$pub_api pub_root=$pub_root local=$local_be nginx_be=$nginx_be health=$php"
  return 0
}

overall=0
probe_env production "https://mc-app.manualmode.at/api/health" "https://mc-app.manualmode.at/" || overall=1

if podman ps --filter "name=^meaningful-conversations-backend-staging$" --filter status=running -q 2>/dev/null | grep -q .; then
  probe_env staging "https://mc-beta.manualmode.at/api/health" "https://mc-beta.manualmode.at/" || overall=1
else
  log "SKIP staging: backend not running"
fi

prev=ok
[[ -f "$STATE_FILE" ]] && prev=$(cat "$STATE_FILE" 2>/dev/null || echo ok)
if [[ "$overall" -eq 0 ]]; then
  echo ok >"$STATE_FILE"
  [[ "$prev" != "ok" ]] && log "RECOVERED: stack probe back to OK (was $prev)"
else
  echo fail >"$STATE_FILE"
  [[ "$prev" == "ok" ]] && log "TRANSITION: OK -> FAIL (watchdog should heal; verify no force-recreate in $WATCHDOG_LOG)"
fi

exit "$overall"