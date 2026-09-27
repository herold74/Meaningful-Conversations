#!/bin/bash
#
# Ensure MC Podman stacks (production + staging) are running; repair + nginx if not.
# Uses flock to avoid overlapping with podman-compose-boot or manual compose.
#
# Install: /usr/local/bin/mc-stack-watchdog.sh
# Timer: mc-stack-watchdog.timer (every 3 min)
# Log: /var/log/mc-stack-watchdog.log
#
set -euo pipefail

LOG_FILE="/var/log/mc-stack-watchdog.log"
LOCK_FILE="/var/run/mc-compose.lock"
NGINX_IP_SCRIPT="/opt/manualmode-production/update-nginx-ips-all.sh"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >> "$LOG_FILE"
  echo "$msg"
}

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  exit 0
fi

stack_containers_ok() {
  local env="$1"
  local c
  for c in mariadb tts backend frontend; do
    local name="meaningful-conversations-${c}-${env}"
    if ! podman ps --filter "name=^${name}$" --filter status=running --quiet | grep -q .; then
      return 1
    fi
  done
  return 0
}

repair_stack() {
  local env="$1"
  local dir="/opt/manualmode-${env}"
  local compose="${dir}/podman-compose-${env}.yml"
  if [[ ! -f "$compose" ]]; then
    log "WARN: missing $compose"
    return 1
  fi
  log "Repair: podman-compose up -d ($env)"
  (cd "$dir" && podman-compose -f "podman-compose-${env}.yml" up -d >>"$LOG_FILE" 2>&1) || {
    log "WARN: compose up failed for $env"
    return 1
  }
  return 0
}

health_ok() {
  local url="$1"
  local code
  code=$(curl -sf -o /dev/null -w '%{http_code}' --connect-timeout 8 --max-time 15 "$url" 2>/dev/null || echo "000")
  [[ "$code" == "200" ]]
}

repaired=false

if ! stack_containers_ok production; then
  repair_stack production && repaired=true
fi
if ! stack_containers_ok staging; then
  repair_stack staging && repaired=true
fi

if ! health_ok "https://mc-app.manualmode.at/api/health"; then
  log "WARN: production health not 200"
  repair_stack production && repaired=true
fi
if ! health_ok "https://mc-beta.manualmode.at/api/health"; then
  log "WARN: staging health not 200"
  repair_stack staging && repaired=true
  repaired=true
fi

if [[ "$repaired" == true ]] && [[ -x "$NGINX_IP_SCRIPT" ]]; then
  log "Updating nginx IPs after repair..."
  timeout 120 "$NGINX_IP_SCRIPT" >>"$LOG_FILE" 2>&1 || log "WARN: nginx IP update failed"
fi

if stack_containers_ok production && stack_containers_ok staging \
  && health_ok "https://mc-app.manualmode.at/api/health" \
  && health_ok "https://mc-beta.manualmode.at/api/health"; then
  exit 0
fi

log "WARN: stack still unhealthy after watchdog pass"
exit 1
