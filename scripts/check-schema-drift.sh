#!/bin/bash
#
# Weekly schema drift check — Meaningful Conversations staging vs production only.
# Server: /usr/local/bin/check-schema-drift.sh (Mon 07:00 Europe/Vienna)
#
set -euo pipefail

LOG_FILE="/var/log/schema-drift.log"
REPORT_DIR="/var/log/schema-reports"
DATE=$(date +%Y%m%d-%H%M%S)

log() {
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

mkdir -p "$REPORT_DIR"

log "=== Weekly Schema Drift Check Started ==="

PROJECT="meaningful-conversations"
DRIFT_DETECTED=0

log "Checking project: $PROJECT"

PROD_CONTAINER="meaningful-conversations-mariadb-production"
STAGING_CONTAINER="meaningful-conversations-mariadb-staging"
# Legacy path names; active compose often under /opt/manualmode-*
if [[ -f /opt/manualmode-production/.env ]]; then
  PROD_ENV="/opt/manualmode-production/.env"
else
  PROD_ENV="/opt/meaningful-conversations-production/.env"
fi
if [[ -f /opt/manualmode-staging/.env ]]; then
  STAGING_ENV="/opt/manualmode-staging/.env"
else
  STAGING_ENV="/opt/meaningful-conversations-staging/.env"
fi

if ! podman ps --filter "name=$STAGING_CONTAINER" --filter "status=running" | grep -q "$STAGING_CONTAINER"; then
  log "WARNING: Staging container $STAGING_CONTAINER not running - skipping"
  log "=== Weekly Schema Drift Check Completed ==="
  exit 0
fi

if ! podman ps --filter "name=$PROD_CONTAINER" --filter "status=running" | grep -q "$PROD_CONTAINER"; then
  log "WARNING: Production container $PROD_CONTAINER not running - skipping"
  log "=== Weekly Schema Drift Check Completed ==="
  exit 0
fi

cd "$(dirname "$STAGING_ENV")"
STAGING_USER=$(grep "^DB_USER=" "$STAGING_ENV" | cut -d= -f2)
STAGING_PASS=$(grep "^DB_PASSWORD=" "$STAGING_ENV" | cut -d= -f2)
STAGING_DB=$(grep "^DB_NAME=" "$STAGING_ENV" | cut -d= -f2)

cd "$(dirname "$PROD_ENV")"
PROD_USER=$(grep "^DB_USER=" "$PROD_ENV" | cut -d= -f2)
PROD_PASS=$(grep "^DB_PASSWORD=" "$PROD_ENV" | cut -d= -f2)
PROD_DB=$(grep "^DB_NAME=" "$PROD_ENV" | cut -d= -f2)

TEMP_DIR="/tmp/schema-drift-$PROJECT-$$"
mkdir -p "$TEMP_DIR"

podman exec "$STAGING_CONTAINER" mariadb-dump \
  -u"$STAGING_USER" -p"$STAGING_PASS" \
  --no-data --skip-triggers --skip-routines --skip-comments \
  "$STAGING_DB" > "$TEMP_DIR/schema-staging.sql" 2>/dev/null || {
  log "ERROR: Could not export Staging schema for $PROJECT"
  rm -rf "$TEMP_DIR"
  log "=== Weekly Schema Drift Check Completed ==="
  exit 0
}

podman exec "$PROD_CONTAINER" mariadb-dump \
  -u"$PROD_USER" -p"$PROD_PASS" \
  --no-data --skip-triggers --skip-routines --skip-comments \
  "$PROD_DB" > "$TEMP_DIR/schema-production.sql" 2>/dev/null || {
  log "ERROR: Could not export Production schema for $PROJECT"
  rm -rf "$TEMP_DIR"
  log "=== Weekly Schema Drift Check Completed ==="
  exit 0
}

sed -i 's/ AUTO_INCREMENT=[0-9]*//g' "$TEMP_DIR/schema-staging.sql"
sed -i 's/ AUTO_INCREMENT=[0-9]*//g' "$TEMP_DIR/schema-production.sql"

STAGING_TABLES=$(grep "^CREATE TABLE" "$TEMP_DIR/schema-staging.sql" | sed 's/CREATE TABLE `//' | sed 's/`.*//' | sort)
PROD_TABLES=$(grep "^CREATE TABLE" "$TEMP_DIR/schema-production.sql" | sed 's/CREATE TABLE `//' | sed 's/`.*//' | sort)

SCHEMA_IDENTICAL=1

while read -r table; do
  podman exec "$STAGING_CONTAINER" mariadb -u"$STAGING_USER" -p"$STAGING_PASS" -N -e \
    "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY 
     FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA='$STAGING_DB' AND TABLE_NAME='$table' 
     ORDER BY COLUMN_NAME;" \
    > "$TEMP_DIR/staging_$table.txt" 2>/dev/null || continue

  podman exec "$PROD_CONTAINER" mariadb -u"$PROD_USER" -p"$PROD_PASS" -N -e \
    "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY 
     FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA='$PROD_DB' AND TABLE_NAME='$table' 
     ORDER BY COLUMN_NAME;" \
    > "$TEMP_DIR/prod_$table.txt" 2>/dev/null || continue

  if ! diff -q "$TEMP_DIR/staging_$table.txt" "$TEMP_DIR/prod_$table.txt" > /dev/null 2>&1; then
    SCHEMA_IDENTICAL=0
    diff "$TEMP_DIR/staging_$table.txt" "$TEMP_DIR/prod_$table.txt" > "$REPORT_DIR/drift-$PROJECT-$table-$DATE.txt" || true
  fi
done < <(echo "$STAGING_TABLES")

MISSING_IN_STAGING=$(comm -13 <(echo "$STAGING_TABLES") <(echo "$PROD_TABLES") | wc -l)
EXTRA_IN_STAGING=$(comm -23 <(echo "$STAGING_TABLES") <(echo "$PROD_TABLES") | wc -l)

if [ "$SCHEMA_IDENTICAL" -eq 1 ] && [ "$MISSING_IN_STAGING" -eq 0 ] && [ "$EXTRA_IN_STAGING" -eq 0 ]; then
  log "✓ $PROJECT: Schemas are functionally identical"
else
  DRIFT_DETECTED=1
  log "⚠ DRIFT DETECTED in $PROJECT"
  log "  - Tables missing in Staging: $MISSING_IN_STAGING"
  log "  - Tables only in Staging: $EXTRA_IN_STAGING"
  if command -v mail &> /dev/null; then
    echo "Schema drift in $PROJECT — see $REPORT_DIR/drift-$PROJECT-*-$DATE.txt" | \
      mail -s "⚠️ Schema Drift Detected: $PROJECT" root
    log "  - E-Mail notification sent"
  fi
fi

rm -rf "$TEMP_DIR"

log "=== Weekly Schema Drift Check Completed ==="

if [ "$DRIFT_DETECTED" -eq 1 ]; then
  logger -t schema-drift "Schema drift detected - check $REPORT_DIR"
else
  logger -t schema-drift "All schemas are in sync"
fi
exit 0
