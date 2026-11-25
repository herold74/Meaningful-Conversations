#!/bin/bash
#
# Ensure MC Podman stacks (production + staging) are running and serving traffic.
# Detects zombie backends and nginx upstream drift (backend or frontend IP stale vs podman).
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
  curl -s -o /dev/null -w '%{http_code}' --connect-timeout 8 --max-time 15 "$url" 2>/dev/null || echo "000"
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

env_val() {
  local file="$1" key="$2"
  grep -m1 "^${key}=" "$file" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d '\r'
}

app_image_ref() {
  local env="$1" role="$2"
  local file="/opt/manualmode-${env}/.env"
  local version registry prefix
  version=$(env_val "$file" VERSION)
  registry=$(env_val "$file" REGISTRY_URL)
  prefix=$(env_val "$file" REGISTRY_IMAGE_PREFIX)
  registry=${registry:-localhost}
  prefix=${prefix:-gherold/meaningful-conversations}
  version=${version:-latest}
  echo "${registry}/${prefix}/meaningful-conversations-${role}:${version}"
}

app_images_present() {
  local env="$1"
  podman image exists "$(app_image_ref "$env" frontend)" 2>/dev/null \
    && podman image exists "$(app_image_ref "$env" backend)" 2>/dev/null
}

restore_accepted_release() {
  local env="$1"
  local file="/opt/manualmode-${env}/.accepted-release"
  local envfile="/opt/manualmode-${env}/.env"
  [[ "$env" == "production" ]] || return 1
  [[ -f "$file" && -f "$envfile" ]] || return 1
  local version cur fe_id be_id
  version=$(env_val "$file" VERSION)
  fe_id=$(env_val "$file" FRONTEND_ID)
  be_id=$(env_val "$file" BACKEND_ID)
  [[ -n "$version" && -n "$fe_id" && -n "$be_id" ]] || return 1
  cur=$(env_val "$envfile" VERSION)
  if [[ "$cur" != "$version" ]]; then
    sed -i '/^VERSION=/d' "$envfile"
    echo "VERSION=$version" >> "$envfile"
    log "Production VERSION ${cur:-empty} -> $version (.accepted-release)"
  fi
  local fe_ref be_ref
  fe_ref=$(app_image_ref "$env" frontend)
  be_ref=$(app_image_ref "$env" backend)
  if ! podman image exists "$fe_ref" 2>/dev/null; then
    podman image exists "$fe_id" 2>/dev/null || return 1
    podman tag "$fe_id" "$fe_ref"
    log "Re-tagged accepted frontend as $fe_ref"
  fi
  if ! podman image exists "$be_ref" 2>/dev/null; then
    podman image exists "$be_id" 2>/dev/null || return 1
    podman tag "$be_id" "$be_ref"
    log "Re-tagged accepted backend as $be_ref"
  fi
  app_images_present "$env"
}

# Do not compose-up a VERSION whose frontend/backend images are missing.
# That pull hangs and leaves production down. Production falls back to the
# last accepted release instead of the branch version.
ensure_repair_images() {
  local env="$1"
  if app_images_present "$env"; then
    return 0
  fi
  log "WARN: frontend/backend image for current VERSION missing ($env)"
  if restore_accepted_release "$env"; then
    log "Using accepted production release"
    return 0
  fi
  log "ERROR: refusing to start containers ($env); app images are absent"
  return 1
}

repair_stack() {
  local env="$1"
  local dir="/opt/manualmode-${env}"
  local compose="${dir}/podman-compose-${env}.yml"
  if [[ ! -f "$compose" ]]; then
    log "WARN: missing $compose"
    return 1
  fi
  ensure_repair_images "$env" || return 1
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
  # Pod stacks (x-podman pod + depends_on mariadb): --force-recreate backend wedges
  # conmon and leaves zombie DB/backend containers — use stop/rm + up only.
  ensure_repair_images "$env" || return 1
  log "Repair: stop/rm $cname then compose up backend ($env)"
  podman stop -t 30 "$cname" >>"$LOG_FILE" 2>&1 || true
  podman rm -f "$cname" >>"$LOG_FILE" 2>&1 || true
  (cd "$dir" && podman-compose -f "podman-compose-${env}.yml" up -d backend >>"$LOG_FILE" 2>&1) || {
    log "WARN: backend repair failed for $env"
    return 1
  }
  wait_app_tier "$env"
}

public_health_ok() {
  [[ "$(http_code "$1")" == "200" ]]
}

wait_app_tier() {
  local env="$1" tries=0
  while [[ $tries -lt 12 ]]; do
    if app_tier_ok "$env"; then
      return 0
    fi
    sleep 5
    tries=$((tries + 1))
  done
  return 1
}

nginx_backend_ip_mismatch() {
  local env="$1"
  local conf="/etc/nginx/conf.d/${env}-meaningful-conversations.conf"
  local backend="meaningful-conversations-backend-${env}"
  local ip upstream
  [[ -f "$conf" ]] || return 1
  ip=$(container_ip "$backend")
  [[ -z "$ip" ]] && return 1
  upstream=$(grep -m1 'proxy_pass http://' "$conf" 2>/dev/null | sed -n 's|.*http://\([0-9.]*\):8080.*|\1|p')
  [[ -n "$upstream" && "$ip" != "$upstream" ]]
}

nginx_frontend_ip_mismatch() {
  local env="$1"
  local conf="/etc/nginx/conf.d/${env}-meaningful-conversations.conf"
  local frontend="meaningful-conversations-frontend-${env}"
  local ip upstream
  [[ -f "$conf" ]] || return 1
  ip=$(container_ip "$frontend")
  [[ -z "$ip" ]] && return 1
  upstream=$(grep 'proxy_pass http://' "$conf" 2>/dev/null | sed -n 's|.*http://\([0-9.]*\):3000.*|\1|p' | head -1)
  [[ -n "$upstream" && "$ip" != "$upstream" ]]
}

nginx_proxy_ip_mismatch() {
  local env="$1"
  nginx_backend_ip_mismatch "$env" && return 0
  nginx_frontend_ip_mismatch "$env" && return 0
  return 1
}

handle_public_api() {
  local env="$1" url="$2"
  if public_health_ok "$url"; then
    return 0
  fi
  log "WARN: public API health not 200 ($env) HTTP $(http_code "$url")"
  if app_tier_ok "$env" || nginx_proxy_ip_mismatch "$env"; then
    log "INFO: backend local OK or nginx IP mismatch ($env) — refresh nginx only"
    update_nginx
    if public_health_ok "$url"; then
      return 0
    fi
  fi
  repair_backend "$env" && repaired=true
  wait_app_tier "$env" || true
  update_nginx
  if public_health_ok "$url"; then
    return 0
  fi
  if ! app_tier_ok "$env"; then
    log "WARN: app tier still bad after backend repair ($env) — full stack up"
    repair_stack "$env" && repaired=true
    wait_app_tier "$env" || true
    update_nginx
  fi
  public_health_ok "$url"
}

handle_public_site() {
  local env="$1" base_url="$2"
  if public_health_ok "$base_url"; then
    return 0
  fi
  log "WARN: public site root not 200 ($env) HTTP $(http_code "$base_url")"
  if app_tier_ok "$env" || nginx_proxy_ip_mismatch "$env"; then
    log "INFO: app tier OK or nginx IP mismatch ($env) — refresh nginx for site root"
    update_nginx
    public_health_ok "$base_url"
    return $?
  fi
  return 1
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
    if nginx_proxy_ip_mismatch "$env"; then
      log "INFO: nginx upstream drift ($env) — refresh before backend repair"
      update_nginx
      if app_tier_ok "$env"; then
        continue
      fi
    fi
    repair_backend "$env" && repaired=true
    wait_app_tier "$env" || true
    update_nginx
  elif nginx_proxy_ip_mismatch "$env"; then
    if nginx_frontend_ip_mismatch "$env"; then
      log "WARN: nginx frontend IP mismatch ($env)"
    else
      log "WARN: nginx backend IP mismatch ($env)"
    fi
    update_nginx
  fi
done

handle_public_api production "https://mc-app.manualmode.at/api/health" || true
handle_public_api staging "https://mc-beta.manualmode.at/api/health" || true
handle_public_site production "https://mc-app.manualmode.at/" || true
handle_public_site staging "https://mc-beta.manualmode.at/" || true

if stack_containers_running production && stack_containers_running staging \
  && public_health_ok "https://mc-app.manualmode.at/api/health" \
  && public_health_ok "https://mc-beta.manualmode.at/api/health" \
  && public_health_ok "https://mc-app.manualmode.at/" \
  && public_health_ok "https://mc-beta.manualmode.at/"; then
  exit 0
fi

log "WARN: stack still unhealthy after watchdog pass"
exit 1
