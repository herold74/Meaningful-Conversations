#!/usr/bin/env bash
# Runs at the start of each Cloud Agent session (after the Build snapshot).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f package.json ]] || [[ ! -d meaningful-conversations-backend ]]; then
  echo "Expected repo root (package.json + meaningful-conversations-backend)"
  exit 1
fi

COMPOSE_FILE="templates/cursor-cloud-environment/docker-compose.dev.yml"

if [[ "${MC_CLOUD_DEV_DB:-1}" == "1" ]] && [[ -f "$COMPOSE_FILE" ]]; then
  echo "==> Docker + MariaDB 11.2 (MC_CLOUD_DEV_DB=1)"
  if command -v docker >/dev/null; then
    sudo service docker start 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" up -d

    echo "==> Waiting for MariaDB"
    ready=0
    for _ in $(seq 1 60); do
      if docker compose -f "$COMPOSE_FILE" exec -T mariadb healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1; then
        ready=1
        break
      fi
      sleep 2
    done
    if [[ "$ready" != "1" ]]; then
      echo "WARN: MariaDB did not become ready — the backend terminal may fail until it is"
    fi

    if [[ -n "${DATABASE_URL:-}" ]]; then
      echo "==> Prisma migrate deploy"
      (cd meaningful-conversations-backend && npx prisma migrate deploy)
    else
      echo "WARN: DATABASE_URL not set — skip prisma migrate (set it in Cloud Secrets)"
    fi
  else
    echo "WARN: docker not available — open the app with ?backend=staging or set MC_CLOUD_DEV_DB=0"
  fi
else
  echo "==> Skipping local DB (MC_CLOUD_DEV_DB=${MC_CLOUD_DEV_DB:-0})"
fi

echo "==> Session ready"
echo "    Local API:   http://localhost:5173"
echo "    Staging API: http://localhost:5173/?backend=staging"
