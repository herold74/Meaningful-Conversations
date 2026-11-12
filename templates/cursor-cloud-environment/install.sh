#!/usr/bin/env bash
# Idempotent Build-time setup for Cursor Cloud Agents (app v2.6.0).
# Cursor runs `install` from the repository root.
set -euo pipefail

if [[ ! -f package.json ]] || [[ ! -d meaningful-conversations-backend ]]; then
  echo "Expected repo root (package.json + meaningful-conversations-backend)"
  exit 1
fi

echo "==> Node $(node -v)"
node -e "const v=parseInt(process.versions.node.split('.')[0],10); if(v<22) { console.error('Node >= 22 required (package.json engines)'); process.exit(1); }"

echo "==> Frontend dependencies"
npm ci

echo "==> Backend dependencies + Prisma 7 client"
(
  cd meaningful-conversations-backend
  npm ci
  # prisma.config.ts supplies a placeholder URL when DATABASE_URL is unset.
  npx prisma generate
)

echo "==> Install complete. Full check when you want it: npm run ci"
