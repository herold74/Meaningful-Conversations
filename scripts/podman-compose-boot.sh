#!/bin/bash
#
# Start Meaningful Conversations Podman stacks after host reboot (AlmaLinux server).
# Uses podman-compose only — not Docker.
#
# Install: /usr/local/bin/podman-compose-boot.sh
# Cron: @reboot /usr/local/bin/podman-compose-boot.sh
# Log: /var/log/podman-compose-boot.log
#
set -euo pipefail

LOG_FILE="/var/log/podman-compose-boot.log"

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

log "=== podman-compose boot ==="
start_stack production || true
start_stack staging || true
log "=== done ==="
