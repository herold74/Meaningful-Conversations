#!/bin/bash
#
# Start Meaningful Conversations Podman stacks after host reboot (AlmaLinux server).
# Uses podman-compose only — not Docker.
#
# Install: /usr/local/bin/podman-compose-boot.sh
# systemd: mc-podman-compose-boot.service (After=network-online.target, TimeoutStartSec=900)
# Log: /var/log/podman-compose-boot.log
#
set -euo pipefail

LOG_FILE="/var/log/podman-compose-boot.log"
LOCK_FILE="/var/run/mc-compose.lock"
NGINX_IP_SCRIPT="/opt/manualmode-production/update-nginx-ips-all.sh"
MAX_NETWORK_WAIT=120
MAX_APP_TIER_WAIT=180

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >> "$LOG_FILE"
  echo "$msg"
}

container_ip() {
  podman inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$1" 2>/dev/null || true
}

http_code() {
  local url="$1"
  curl -s -o /dev/null -w '%{http_code}' --connect-timeout 8 --max-time 15 "$url" 2>/dev/null || echo "000"
}

app_tier_ready() {
  local env="$1"
  local backend="meaningful-conversations-backend-${env}"
  local frontend="meaningful-conversations-frontend-${env}"
  local be_ip fe_ip
  be_ip=$(container_ip "$backend")
  fe_ip=$(container_ip "$frontend")
  [[ -z "$be_ip" || -z "$fe_ip" ]] && return 1
  [[ "$(http_code "http://${be_ip}:8080/api/health")" == "200" ]]
}

wait_for_app_tier() {
  local env="$1"
  local waited=0
  while [[ "$waited" -lt "$MAX_APP_TIER_WAIT" ]]; do
    if app_tier_ready "$env"; then
      log "OK ${env} app tier healthy after ${waited}s"
      return 0
    fi
    sleep 5
    waited=$((waited + 5))
  done
  log "WARN ${env}: app tier not healthy after ${MAX_APP_TIER_WAIT}s (continuing)"
  return 1
}

start_stack() {
  local env_name="$1"
  local dir="/opt/manualmode-${env_name}"
  local compose_file="${dir}/podman-compose-${env_name}.yml"

  if [[ ! -f "$compose_file" ]]; then
    log "SKIP ${env_name}: missing ${compose_file}"
    return 0
  fi

  log "Starting ${env_name} (podman-compose)..."
  if (cd "$dir" && podman-compose -f "podman-compose-${env_name}.yml" up -d >>"$LOG_FILE" 2>&1); then
    log "OK ${env_name} compose up"
  else
    log "WARN ${env_name}: podman-compose up failed (see log)"
    return 1
  fi
}

wait_for_network() {
  local waited=0
  while [[ "$waited" -lt "$MAX_NETWORK_WAIT" ]]; do
    if ping -c1 -W2 1.1.1.1 >/dev/null 2>&1 || ping -c1 -W2 8.8.8.8 >/dev/null 2>&1; then
      log "Network reachable after ${waited}s"
      return 0
    fi
    sleep 5
    waited=$((waited + 5))
  done
  log "WARN: network wait timeout (${MAX_NETWORK_WAIT}s), continuing anyway"
  return 0
}

update_nginx() {
  if [[ -x "$NGINX_IP_SCRIPT" ]]; then
    log "Updating nginx upstream IPs (timeout 120s)..."
    if timeout 120 "$NGINX_IP_SCRIPT" >>"$LOG_FILE" 2>&1; then
      log "OK nginx IP update"
      return 0
    fi
    log "WARN nginx IP update failed or timed out"
    return 1
  fi
  log "SKIP: nginx IP script missing"
  return 1
}

public_api_ok() {
  [[ "$(http_code "$1")" == "200" ]]
}

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] SKIP: another compose operation holds lock" >> "$LOG_FILE"
  exit 0
fi

log "=== podman-compose boot ==="
wait_for_network
start_stack production || true
start_stack staging || true
wait_for_app_tier production || true
wait_for_app_tier staging || true
update_nginx || true
if ! public_api_ok "https://mc-app.manualmode.at/api/health" \
  || ! public_api_ok "https://mc-beta.manualmode.at/api/health"; then
  log "WARN: public API not 200 after nginx update — retry nginx once"
  update_nginx || true
fi
log "=== done ==="