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
LOCK_FILE="/var/run/mc-compose.lock"
NGINX_IP_SCRIPT="/opt/manualmode-production/update-nginx-ips-all.sh"
MAX_NETWORK_WAIT=120
# MariaDB start_period is 30s and the backend start_period is 40s. Rewrite nginx
# only after the backend answers on its current bridge IP, or the first write
# keeps a pre-recreate address and /api stays 502 until a later refresh.
STACK_READY_ATTEMPTS=36
STACK_READY_INTERVAL=5

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

container_ip() {
  podman inspect "$1" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || true
}

# Succeeds when both containers have bridge IPs and the backend serves /api/health.
# Frontend IP is required because update-nginx-ips.sh refuses to write a vhost
# when either address is empty.
wait_for_stack_ready() {
  local env_name="$1"
  local compose="/opt/manualmode-${env_name}/podman-compose-${env_name}.yml"
  local backend="meaningful-conversations-backend-${env_name}"
  local frontend="meaningful-conversations-frontend-${env_name}"
  local attempt=1 backend_ip="" frontend_ip=""

  [[ -f "$compose" ]] || return 0

  log "Waiting for ${env_name} backend HTTP before nginx (max $((STACK_READY_ATTEMPTS * STACK_READY_INTERVAL))s)..."
  while [[ "$attempt" -le "$STACK_READY_ATTEMPTS" ]]; do
    backend_ip=$(container_ip "$backend")
    frontend_ip=$(container_ip "$frontend")
    if [[ -n "$backend_ip" && -n "$frontend_ip" ]] && curl -fsS -m 5 "http://${backend_ip}:8080/api/health" >/dev/null 2>&1; then
      log "OK ${env_name} backend http://${backend_ip}:8080/api/health (frontend ${frontend_ip})"
      return 0
    fi
    log "  ${env_name} not ready (attempt ${attempt}/${STACK_READY_ATTEMPTS}, backend=${backend_ip:-none}, frontend=${frontend_ip:-none})"
    sleep "$STACK_READY_INTERVAL"
    attempt=$((attempt + 1))
  done
  log "WARN ${env_name} backend did not answer /api/health before nginx update"
  return 1
}

public_health_ok() {
  local url="$1"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 8 --max-time 15 "$url" 2>/dev/null || echo "000")
  [[ "$code" == "200" ]]
}

update_nginx() {
  if [[ -x "$NGINX_IP_SCRIPT" ]]; then
    log "Updating nginx upstream IPs via ${NGINX_IP_SCRIPT} (timeout 120s)..."
    if timeout 120 "$NGINX_IP_SCRIPT" >>"$LOG_FILE" 2>&1; then
      log "OK nginx IP update"
      return 0
    fi
    log "WARN nginx IP update failed or timed out"
    return 1
  fi
  if [[ -x /usr/local/bin/update-nginx-ips.sh ]]; then
    log "Updating nginx upstream IPs via /usr/local/bin/update-nginx-ips.sh all (timeout 120s)..."
    if timeout 120 /usr/local/bin/update-nginx-ips.sh all >>"$LOG_FILE" 2>&1; then
      log "OK nginx IP update"
      return 0
    fi
    log "WARN nginx IP update failed or timed out"
    return 1
  fi
  log "WARN nginx IP update script not found"
  return 1
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
wait_for_stack_ready production || true
wait_for_stack_ready staging || true
update_nginx || true

# If the wait timed out, the first nginx write can still capture a backend that
# is about to be recreated. Refresh once more when public /api/health is not 200.
if ! public_health_ok "https://mc-app.manualmode.at/api/health" || ! public_health_ok "https://mc-beta.manualmode.at/api/health"; then
  log "WARN public /api/health not 200 after nginx update — refreshing IPs once more"
  sleep 10
  update_nginx || true
fi
log "=== done ==="
