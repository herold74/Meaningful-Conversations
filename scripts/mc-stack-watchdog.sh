#!/bin/bash
#
# Ensure MC Podman stacks (production + staging) are running and serving traffic.
# Detects "zombie" backends (container running but :8080 refused / unhealthy).
# Uses flock to avoid overlapping with podman-compose-boot or manual compose.
#
# Install: /usr/local/bin/mc-stack-watchdog.sh
# Timer: mc-stack-watchdog.timer (every 3 min)
# Log: /var/log/mc-stack-watchdog.log
#
set -uo pipefail

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

container_ip() {
  podman inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$1" 2>/dev/null || true
}

http_code() {
  local url="$1"
  curl -sf -o /dev/null -w '%{http_code}' --connect-timeout 8 --max-time 15 "$url" 2>/dev/null || echo "000"
}

backend_local_health_ok() {
  local name="$1"
  local ip
  ip=$(container_ip "$name")
  [[ -z "$ip" ]] && return 1
  [[ "$(http_code "http://${ip}:8080/api/health")" == "200" ]]
}

container_running() {
  podman ps --filter "name=^${1}$" --filter status=running -q 2>/dev/null | grep -q .
}

container_is_unhealthy() {
  local name="$1"
  if ! container_running "$name"; then
    return 1
  fi
  local status
  status=$(podman inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || echo "none")
  [[ "$status" == "unhealthy" ]]
}

stack_containers_running() {
  local env="$1"
  local c
  for c in mariadb tts backend frontend; do
    if ! container_running "meaningful-conversations-${c}-${env}"; then
      return 1
    fi
  done
  return 0
}

app_tier_ok() {
  local env="$1"
  local backend="meaningful-conversations-backend-${env}"
  local frontend="meaningful-conversations-frontend-${env}"
  if ! container_running "$backend" || ! container_running "$frontend"; then
    return 1
  fi
  if container_is_unhealthy "$backend"; then
    return 1
  fi
  if ! backend_local_health_ok "$backend"; then
    return 1
  fi
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

repair_backend() {
  local env="$1"
  local dir="/opt/manualmode-${env}"
  local compose="${dir}/podman-compose-${env}.yml"
  local cname="meaningful-conversations-backend-${env}"
  if [[ ! -f "$compose" ]]; then
    log "WARN: missing $compose"
    return 1
  fi
  log "Repair: recreate backend ($env)"
  (cd "$dir" && podman-compose -f "podman-compose-${env}.yml" up -d --force-recreate backend >>"$LOG_FILE" 2>&1) || true
  sleep 5
  if app_tier_ok "$env"; then
    return 0
  fi
  log "Repair: stop/rm $cname then compose up backend ($env)"
  podman stop -t 15 "$cname" >>"$LOG_FILE" 2>&1 || true
  podman rm -f "$cname" >>"$LOG_FILE" 2>&1 || true
  (cd "$dir" && podman-compose -f "podman-compose-${env}.yml" up -d backend >>"$LOG_FILE" 2>&1) || {
    log "WARN: backend recreate failed for $env"
    return 1
  }
  sleep 8
  app_tier_ok "$env"
}

public_health_ok() {
  [[ "$(http_code "$1")" == "200" ]]
}

update_nginx() {
  if [[ -x "$NGINX_IP_SCRIPT" ]]; then
    log "Updating nginx IPs after repair..."
    timeout 180 "$NGINX_IP_SCRIPT" >>"$LOG_FILE" 2>&1 || log "WARN: nginx IP update failed"
  elif [[ -x /usr/local/bin/update-nginx-ips.sh ]]; then
    log "Updating nginx IPs (production + staging)..."
    timeout 90 /usr/local/bin/update-nginx-ips.sh all >>"$LOG_FILE" 2>&1 || log "WARN: nginx IP update failed"
  fi
}

repaired=false

for env in production staging; do
  if ! stack_containers_running "$env"; then
    repair_stack "$env" && repaired=true
  elif ! app_tier_ok "$env"; then
    log "WARN: app tier unhealthy ($env) — backend local health or podman health failed"
    repair_backend "$env" && repaired=true
  fi
done

# Public URL checks (catches nginx stale IP or API 502 while static frontend may work)
if ! public_health_ok "https://mc-app.manualmode.at/api/health"; then
  log "WARN: production public API health not 200"
  repair_backend production && repaired=true
  if ! public_health_ok "https://mc-app.manualmode.at/api/health"; then
    repair_stack production && repaired=true
  fi
fi

if ! public_health_ok "https://mc-beta.manualmode.at/api/health"; then
  log "WARN: staging public API health not 200"
  repair_backend staging && repaired=true
  if ! public_health_ok "https://mc-beta.manualmode.at/api/health"; then
    repair_stack staging && repaired=true
  fi
fi

if [[ "$repaired" == true ]]; then
  update_nginx
fi

if stack_containers_running production && stack_containers_running staging \
  && public_health_ok "https://mc-app.manualmode.at/api/health" \
  && public_health_ok "https://mc-beta.manualmode.at/api/health"; then
  exit 0
fi

log "WARN: stack still unhealthy after watchdog pass"
exit 1
