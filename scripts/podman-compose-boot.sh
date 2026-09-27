#!/bin/bash
#
# Start Meaningful Conversations Podman stacks after host reboot (AlmaLinux server).
# Uses podman-compose only — not Docker.
#
# Install: /usr/local/bin/podman-compose-boot.sh
# systemd: mc-podman-compose-boot.service (After=network-online.target)
# Log: /var/log/podman-compose-boot.log
#
set -euo pipefail

LOG_FILE="/var/log/podman-compose-boot.log"
NGINX_IP_SCRIPT="/opt/manualmode-production/update-nginx-ips-all.sh"
MAX_NETWORK_WAIT=120

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >> "$LOG_FILE"
  echo "$msg"
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
    log "OK ${env_name}"
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

log "=== podman-compose boot ==="
wait_for_network
start_stack production || true
start_stack staging || true
if [[ -x "$NGINX_IP_SCRIPT" ]]; then
  log "Updating nginx upstream IPs (timeout 120s)..."
  if timeout 120 "$NGINX_IP_SCRIPT" >>"$LOG_FILE" 2>&1; then
    log "OK nginx IP update"
  else
    log "WARN nginx IP update failed or timed out"
  fi
fi
log "=== done ==="
