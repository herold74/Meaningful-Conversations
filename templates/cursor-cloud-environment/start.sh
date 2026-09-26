#!/usr/bin/env bash
# Runs at the beginning of each Cloud Agent session (after Build snapshot).
set -euo pipefail

if [[ ! -f package.json ]]; then
  echo "Expected repository root"
  exit 1
fi

COMPOSE_FILE=".cursor/docker-compose.dev.yml"

if [[ "${MC_CLOUD_DEV_DB:-1}" == "1" ]] && [[ -f "$COMPOSE_FILE" ]]; then
  echo "==> Docker + MariaDB (MC_CLOUD_DEV_DB=1)"
  if command -v docker >/dev/null; then
    sudo service docker start 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" up -d

    echo "==> Waiting for MariaDB"
    for _ in $(seq 1 60); do
      if docker compose -f "$COMPOSE_FILE" exec -T mariadb healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1; then
        break
      fi
      sleep 2
    done

    if [[ -n "${DATABASE_URL:-}" ]]; then
      echo "==> Prisma migrate deploy"
      (cd meaningful-conversations-backend && npx prisma migrate deploy)
    else
      echo "WARN: DATABASE_URL not set — skip prisma migrate (set in Cloud Secrets)"
    fi
  else
    echo "WARN: docker not available — use staging API or set MC_CLOUD_DEV_DB=0"
  fi
else
  echo "==> Skipping local DB (MC_CLOUD_DEV_DB=${MC_CLOUD_DEV_DB:-0})"
fi

# Required so Cursor launches configured terminals (platform ties tmux to `start`).
echo "==> Session ready"
