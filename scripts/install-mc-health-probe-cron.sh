#!/bin/bash
#
# Sync mc-stack-health-probe.sh to the MC server and install cron (every 10 min).
# Run from repo root on maintainer Mac (needs .env.server with SERVER_HOST).
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROBE_SRC="$ROOT/scripts/mc-stack-health-probe.sh"
REMOTE_PROBE="/usr/local/bin/mc-stack-health-probe.sh"
CRON_FILE="/etc/cron.d/mc-stack-health-probe"

if [[ ! -f "$ROOT/.env.server" ]]; then
  echo "Missing .env.server (SERVER_HOST)" >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$ROOT/.env.server"
REMOTE="root@${SERVER_HOST}"

chmod +x "$PROBE_SRC"
scp "$PROBE_SRC" "$REMOTE:$REMOTE_PROBE"
ssh "$REMOTE" "chmod 0755 $REMOTE_PROBE"

ssh "$REMOTE" "cat > $CRON_FILE" <<'CRON'
CRON_TZ=Europe/Vienna
# MC public + nginx drift observer (no deploy; complements mc-stack-watchdog.timer)
*/10 * * * * root flock -n /var/run/mc-health-probe.lock /usr/local/bin/mc-stack-health-probe.sh
CRON
ssh "$REMOTE" "chmod 644 $CRON_FILE"

echo "Installed $REMOTE_PROBE and $CRON_FILE (every 10 min Europe/Vienna)"
ssh "$REMOTE" "$REMOTE_PROBE; echo exit=\$?; tail -5 /var/log/mc-stack-health-probe.log"