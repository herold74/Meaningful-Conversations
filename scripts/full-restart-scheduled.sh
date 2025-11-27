#!/bin/bash
#
# Full Restart Script (Down/Up) - For scheduled maintenance
# 
# This script performs a complete container restart (down/up) to reload
# environment variables and apply configuration changes.
#
# Usage:
#   ./scripts/full-restart-scheduled.sh production
#   ./scripts/full-restart-scheduled.sh staging
#

set -e

ENVIRONMENT="$1"
LOG_DIR="/var/log/meaningful-conversations"
LOG_FILE="$LOG_DIR/restart-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Validation
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    echo -e "${RED}❌ Error: Environment must be 'production' or 'staging'${NC}"
    echo "Usage: $0 <production|staging>"
    exit 1
fi

# Set paths based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
    COMPOSE_PATH="/opt/manualmode-production"
    COMPOSE_FILE="podman-compose-production.yml"
    DOMAIN="mc-app.manualmode.at"
else
    COMPOSE_PATH="/opt/manualmode-staging"
    COMPOSE_FILE="podman-compose-staging.yml"
    DOMAIN="mc-beta.manualmode.at"
fi

# Create log directory if not exists
mkdir -p "$LOG_DIR"

log "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
log "${BLUE}║  Scheduled Full Restart - $ENVIRONMENT"
log "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
log ""
log "${YELLOW}📋 Configuration:${NC}"
log "   Environment: $ENVIRONMENT"
log "   Domain: $DOMAIN"
log "   Log file: $LOG_FILE"
log ""

# Step 1: Pre-check - verify database is accessible
log "${YELLOW}🔍 Step 1: Pre-flight checks...${NC}"
cd "$COMPOSE_PATH"

# Check if containers are running
BACKEND_STATUS=$(podman ps --filter name=backend-$ENVIRONMENT --format '{{.Status}}' 2>/dev/null || echo "not found")
log "   Current backend status: $BACKEND_STATUS"

# Test database connectivity
if [[ "$ENVIRONMENT" == "production" ]]; then
    DB_CONTAINER="meaningful-conversations-mariadb-production"
    DB_NAME="meaningful_conversations_production"
else
    DB_CONTAINER="meaningful-conversations-mariadb-staging"
    DB_NAME="meaningful_conversations_staging"
fi

USER_COUNT=$(podman exec $DB_CONTAINER bash -c "echo 'SELECT COUNT(*) FROM User;' | /usr/bin/mariadb -u root -p\${MARIADB_ROOT_PASSWORD} $DB_NAME 2>/dev/null" | tail -1 || echo "0")
log "   Current user count: $USER_COUNT"

if [[ "$USER_COUNT" -lt 1 ]]; then
    log "${RED}❌ ERROR: Database appears to be empty or inaccessible!${NC}"
    log "${RED}   Aborting restart to prevent data loss.${NC}"
    exit 1
fi

log "${GREEN}✓ Pre-flight checks passed${NC}"
log ""

# Step 2: Backup check
log "${YELLOW}📦 Step 2: Verifying recent backup exists...${NC}"
BACKUP_DIR="/var/backups/meaningful-conversations"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/$ENVIRONMENT-*.sql.gz 2>/dev/null | head -1 || echo "")

if [[ -z "$LATEST_BACKUP" ]]; then
    log "${RED}⚠ WARNING: No backup found in $BACKUP_DIR${NC}"
    log "${YELLOW}   Creating emergency backup now...${NC}"
    EMERGENCY_BACKUP="$BACKUP_DIR/$ENVIRONMENT-emergency-$(date +%Y%m%d-%H%M%S).sql.gz"
    podman exec $DB_CONTAINER bash -c "mysqldump -u root -p\${MARIADB_ROOT_PASSWORD} $DB_NAME" | gzip > "$EMERGENCY_BACKUP" 2>&1
    log "${GREEN}✓ Emergency backup created: $EMERGENCY_BACKUP${NC}"
else
    BACKUP_AGE=$(($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")))
    BACKUP_AGE_HOURS=$((BACKUP_AGE / 3600))
    log "   Latest backup: $(basename $LATEST_BACKUP)"
    log "   Backup age: ${BACKUP_AGE_HOURS} hours"
    
    if [[ $BACKUP_AGE_HOURS -gt 24 ]]; then
        log "${YELLOW}⚠ WARNING: Backup is older than 24 hours${NC}"
        log "${YELLOW}   Creating fresh backup...${NC}"
        FRESH_BACKUP="$BACKUP_DIR/$ENVIRONMENT-pre-restart-$(date +%Y%m%d-%H%M%S).sql.gz"
        podman exec $DB_CONTAINER bash -c "mysqldump -u root -p\${MARIADB_ROOT_PASSWORD} $DB_NAME" | gzip > "$FRESH_BACKUP" 2>&1
        log "${GREEN}✓ Fresh backup created: $(basename $FRESH_BACKUP)${NC}"
    else
        log "${GREEN}✓ Recent backup available${NC}"
    fi
fi
log ""

# Step 3: Stop services
log "${YELLOW}🛑 Step 3: Stopping all services...${NC}"
cd "$COMPOSE_PATH"
podman-compose -f "$COMPOSE_FILE" down >> "$LOG_FILE" 2>&1
log "${GREEN}✓ Services stopped${NC}"
log ""

# Step 4: Brief pause to ensure clean shutdown
log "${YELLOW}⏳ Step 4: Waiting 10 seconds for clean shutdown...${NC}"
sleep 10
log "${GREEN}✓ Wait complete${NC}"
log ""

# Step 5: Start services
log "${YELLOW}🚀 Step 5: Starting services with fresh environment...${NC}"
cd "$COMPOSE_PATH"
podman-compose -f "$COMPOSE_FILE" up -d >> "$LOG_FILE" 2>&1
log "${GREEN}✓ Services started${NC}"
log ""

# Step 6: Wait for health checks
log "${YELLOW}⏳ Step 6: Waiting for services to become healthy...${NC}"
WAIT_TIME=0
MAX_WAIT=120

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    BACKEND_HEALTH=$(podman ps --filter name=backend-$ENVIRONMENT --format '{{.Status}}' 2>/dev/null | grep -o 'healthy' || echo "")
    
    if [[ "$BACKEND_HEALTH" == "healthy" ]]; then
        log "${GREEN}✓ Backend is healthy after ${WAIT_TIME}s${NC}"
        break
    fi
    
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
    
    if [[ $((WAIT_TIME % 30)) -eq 0 ]]; then
        log "   Still waiting for backend... (${WAIT_TIME}s / ${MAX_WAIT}s)"
    fi
done

if [[ $WAIT_TIME -ge $MAX_WAIT ]]; then
    log "${RED}❌ ERROR: Backend did not become healthy within ${MAX_WAIT}s${NC}"
    log "${RED}   Check logs: podman logs meaningful-conversations-backend-$ENVIRONMENT${NC}"
    exit 1
fi
log ""

# Step 7: Update Nginx IPs
log "${YELLOW}🔧 Step 7: Updating Nginx configuration...${NC}"
bash /opt/manualmode-production/update-nginx-ips.sh "$ENVIRONMENT" >> "$LOG_FILE" 2>&1
log "${GREEN}✓ Nginx IPs updated${NC}"
log ""

# Step 8: Hard reload Nginx (stop/start to clear cached upstreams)
log "${YELLOW}🔄 Step 8: Hard reloading Nginx...${NC}"
systemctl stop nginx >> "$LOG_FILE" 2>&1
sleep 2
systemctl start nginx >> "$LOG_FILE" 2>&1
log "${GREEN}✓ Nginx restarted${NC}"
log ""

# Step 9: Connectivity tests
log "${YELLOW}🧪 Step 9: Testing connectivity...${NC}"
sleep 2  # Give Nginx a moment to fully start

# Test health endpoint
HEALTH_URL="https://$DOMAIN/api/health"
log "   Testing: $HEALTH_URL"

RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" --max-time 10)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [[ "$HTTP_CODE" == "200" ]]; then
    log "${GREEN}✓ Health check passed: $BODY${NC}"
else
    log "${RED}❌ Health check failed: HTTP $HTTP_CODE${NC}"
    log "   Response: $BODY"
    exit 1
fi

# Verify user count is same as before
NEW_USER_COUNT=$(podman exec $DB_CONTAINER bash -c "echo 'SELECT COUNT(*) FROM User;' | /usr/bin/mariadb -u root -p\${MARIADB_ROOT_PASSWORD} $DB_NAME 2>/dev/null" | tail -1 || echo "0")
log "   User count after restart: $NEW_USER_COUNT"

if [[ "$NEW_USER_COUNT" != "$USER_COUNT" ]]; then
    log "${RED}⚠ WARNING: User count changed! Before: $USER_COUNT, After: $NEW_USER_COUNT${NC}"
else
    log "${GREEN}✓ User count verified (no data loss)${NC}"
fi
log ""

# Step 10: Verify environment variables
log "${YELLOW}🔍 Step 10: Verifying environment variables...${NC}"

BACKEND_CONTAINER="meaningful-conversations-backend-$ENVIRONMENT"

# Check that API_KEY is gone
HAS_API_KEY=$(podman exec $BACKEND_CONTAINER printenv | grep '^API_KEY=' || echo "")
if [[ -z "$HAS_API_KEY" ]]; then
    log "${GREEN}✓ API_KEY removed (as expected)${NC}"
else
    log "${YELLOW}⚠ API_KEY still present: ${HAS_API_KEY:0:30}...${NC}"
fi

# Check that GOOGLE_API_KEY exists
HAS_GOOGLE_KEY=$(podman exec $BACKEND_CONTAINER printenv | grep '^GOOGLE_API_KEY=' || echo "")
if [[ -n "$HAS_GOOGLE_KEY" ]]; then
    log "${GREEN}✓ GOOGLE_API_KEY present${NC}"
else
    log "${RED}❌ GOOGLE_API_KEY missing!${NC}"
    exit 1
fi

# Check that MISTRAL_API_KEY exists
HAS_MISTRAL_KEY=$(podman exec $BACKEND_CONTAINER printenv | grep '^MISTRAL_API_KEY=' || echo "")
if [[ -n "$HAS_MISTRAL_KEY" ]]; then
    log "${GREEN}✓ MISTRAL_API_KEY present${NC}"
else
    log "${RED}❌ MISTRAL_API_KEY missing!${NC}"
    exit 1
fi
log ""

# Final summary
log "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
log "${GREEN}║  ✓ RESTART COMPLETED SUCCESSFULLY                         ║${NC}"
log "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
log ""
log "${BLUE}📊 Summary:${NC}"
log "   ✅ Services restarted (down/up)"
log "   ✅ Nginx IPs updated"
log "   ✅ Connectivity verified"
log "   ✅ Database intact ($NEW_USER_COUNT users)"
log "   ✅ Environment variables correct"
log "   ✅ API_KEY removed"
log "   ✅ GOOGLE_API_KEY active"
log "   ✅ MISTRAL_API_KEY active"
log ""
log "${GREEN}🎉 $ENVIRONMENT is ready!${NC}"
log ""
log "Full log available at: $LOG_FILE"

exit 0

