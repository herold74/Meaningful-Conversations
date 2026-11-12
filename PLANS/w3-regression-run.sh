#!/usr/bin/env bash
# W3 regression harness — sources MC_DEV_* from .env.staging (not committed).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export MC_DEV_EMAIL="$(grep '^MC_DEV_EMAIL=' "$ROOT/.env.staging" | cut -d= -f2-)"
export MC_DEV_PASSWORD="$(grep '^MC_DEV_PASSWORD=' "$ROOT/.env.staging" | cut -d= -f2- | tr -d "'")"
export MC_API_BASE="${MC_API_BASE:-https://mc-beta.manualmode.at}"
LOG="$ROOT/PLANS/w3-regression-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1
echo "=== W3 regression started $(date -Iseconds) ==="
echo "API: $MC_API_BASE"
export CLASSIC_REGRESSION_DELAY_MS="${CLASSIC_REGRESSION_DELAY_MS:-45000}"

run_classic() {
  local provider=$1
  local run_id=$2
  npm run classic-regression -- baseline \
    --provider "$provider" \
    --run-id "$run_id" \
    --suite full \
    --api "$MC_API_BASE" \
    --language en
  local manifest
  manifest=$(node -e "
    const fs=require('fs');
    const idx=JSON.parse(fs.readFileSync('utils/classicRegressionBaselines/runs/index.json','utf8'));
    console.log(idx.runs[0].runId);
  ")
  npm run classic-regression -- compare-offline \
    --baseline-provider "$provider" \
    --current-provider "$provider" \
    --current-run "$manifest" \
    --suite full \
    --language en
}

run_practice() {
  local provider=$1
  local run_id=$2
  npm run practice-regression -- baseline \
    --provider "$provider" \
    --run-id "$run_id" \
    --api "$MC_API_BASE" \
    --language en
  local manifest
  manifest=$(node -e "
    const fs=require('fs');
    const idx=JSON.parse(fs.readFileSync('utils/practiceRegressionBaselines/runs/index.json','utf8'));
    console.log(idx.runs[0].runId);
  ")
  npm run practice-regression -- compare-offline \
    --baseline-provider "$provider" \
    --current-provider "$provider" \
    --current-run "$manifest" \
    --language en
}

run_classic gemini w3-genai-232-full
run_classic mistral w3-mistral-27-full
run_practice gemini w3-practice-genai-232
run_practice mistral w3-practice-mistral-27
echo "=== W3 regression finished $(date -Iseconds) — log: $LOG ==="
