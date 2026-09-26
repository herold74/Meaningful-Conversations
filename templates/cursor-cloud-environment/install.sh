#!/usr/bin/env bash
# Idempotent build-time setup for Cursor Cloud Agent Builds.
# Runs from repository root (see .cursor/environment.json → install).
set -euo pipefail

# Cursor runs `install` from the repository root.
if [[ ! -f package.json ]] || [[ ! -d meaningful-conversations-backend ]]; then
  echo "Expected repo root (package.json + meaningful-conversations-backend)"
  exit 1
fi

echo "==> Node $(node -v)"
node -e "const v=parseInt(process.versions.node.split('.')[0],10); if(v<22) { console.error('Node >= 22 required'); process.exit(1); }"

echo "==> Frontend dependencies"
npm ci

echo "==> Backend dependencies + Prisma client"
(
  cd meaningful-conversations-backend
  npm ci
  npx prisma generate
)

echo "==> Static checks (no DB required)"
npm run typecheck
npm test
npm run test:backend
npm run build

echo "==> Install complete"
