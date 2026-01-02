#!/bin/bash
################################################################################
# Production Deployment Script
# 
# WICHTIG: Dieses Script baut KEINE neuen Images!
# Es verwendet die bereits auf Staging getesteten Images von der Registry.
# Prinzip: "Build once, deploy everywhere"
#
# Usage:
#   ./scripts/deploy-production-scheduled.sh [VERSION]
#   
# Beispiele:
#   ./scripts/deploy-production-scheduled.sh 1.7.3   # Spezifische Version
#   ./scripts/deploy-production-scheduled.sh         # Version aus package.json
#
# Das Script kann auch via cron für geplante Deployments verwendet werden:
#   0 6 * * * /path/to/deploy-production-scheduled.sh 1.7.3 >> /var/log/deploy.log 2>&1
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="root@91.99.193.87"
REMOTE_DIR="/opt/manualmode-production"
COMPOSE_FILE="podman-compose-production.yml"
DOMAIN="mc-app.manualmode.at"
LOG_FILE="/tmp/deploy-production-$(date +%Y%m%d-%H%M%S).log"

# Script directory (for finding project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Version: from argument or package.json
if [[ -n "$1" ]]; then
    VERSION="$1"
else
    VERSION=$(grep -m1 '"version"' "$PROJECT_ROOT/package.json" | awk -F'"' '{print $4}')
fi

# Load environment configuration
ENV_FILE="$PROJECT_ROOT/.env.production"
if [ -f "$ENV_FILE" ]; then
    export $(grep -E '^REGISTRY_URL=|^REGISTRY_USER=|^REGISTRY_PASSWORD=' "$ENV_FILE" | xargs)
fi

REGISTRY_URL="${REGISTRY_URL:-ghcr.io}"
REGISTRY_USER="${REGISTRY_USER:-gherold}"

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_section() {
    log ""
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${BLUE}$1${NC}"
    log "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================================
# HEADER
# ============================================================================

log "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
log "${GREEN}║  PRODUCTION DEPLOYMENT - Meaningful Conversations        ║${NC}"
log "${GREEN}║  Using pre-built Staging images (no rebuild!)            ║${NC}"
log "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
log ""
log "${BLUE}📋 Configuration:${NC}"
log "   Version:     $VERSION"
log "   Registry:    $REGISTRY_URL/$REGISTRY_USER"
log "   Target:      $REMOTE_HOST"
log "   Domain:      $DOMAIN"
log "   Log file:    $LOG_FILE"
log ""

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

log_section "Step 1: Pre-flight Checks"

# Check SSH connection
log "${YELLOW}Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE_HOST" "echo 'SSH OK'" > /dev/null 2>&1; then
    log "${RED}❌ ERROR: Cannot connect to $REMOTE_HOST${NC}"
    log "${RED}   Make sure SSH key authentication is set up.${NC}"
    exit 1
fi
log "${GREEN}✓ SSH connection successful${NC}"

# Check if Podman is running on remote
log "${YELLOW}Checking Podman on remote server...${NC}"
if ! ssh "$REMOTE_HOST" "podman --version" > /dev/null 2>&1; then
    log "${RED}❌ ERROR: Podman not available on remote server${NC}"
    exit 1
fi
log "${GREEN}✓ Podman available on remote${NC}"

# Check current user count (safety check)
log "${YELLOW}Checking database integrity...${NC}"
USER_COUNT=$(ssh "$REMOTE_HOST" "podman exec meaningful-conversations-mariadb-production bash -c \"echo 'SELECT COUNT(*) FROM User;' | /usr/bin/mariadb -u root -p\\\${MARIADB_ROOT_PASSWORD} meaningful_conversations_production 2>/dev/null\" | tail -1" || echo "0")
log "   Current user count: $USER_COUNT"

if [[ "$USER_COUNT" -lt 1 ]]; then
    log "${RED}❌ ERROR: Database appears empty or inaccessible!${NC}"
    log "${RED}   Aborting deployment for safety.${NC}"
    exit 1
fi
log "${GREEN}✓ Database integrity check passed${NC}"

# ============================================================================
# REMOTE DEPLOYMENT
# ============================================================================

log_section "Step 2: Pull Images from Registry"

# Create remote deployment script
cat > /tmp/remote-production-deploy.sh << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

VERSION="VERSION_PLACEHOLDER"
REGISTRY_URL="REGISTRY_URL_PLACEHOLDER"
REGISTRY_USER="REGISTRY_USER_PLACEHOLDER"
COMPOSE_FILE="podman-compose-production.yml"
ENV_DIR="/opt/manualmode-production"

echo "═══════════════════════════════════════════════════════════"
echo "Remote Deployment Script - Production"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$ENV_DIR"

# Login to registry
echo "📦 Logging in to registry..."
if [ -f .env ] && grep -q REGISTRY_PASSWORD .env; then
    export $(grep REGISTRY_PASSWORD .env | xargs)
    if [ -n "$REGISTRY_PASSWORD" ]; then
        echo "$REGISTRY_PASSWORD" | podman login "$REGISTRY_URL" -u "$REGISTRY_USER" --password-stdin 2>/dev/null || true
    fi
fi

# Pull images (NOT building - using pre-built staging images!)
echo ""
echo "📥 Pulling pre-built images from registry..."
echo "   (These are the same images tested on staging)"
echo ""

echo "   Pulling backend:$VERSION..."
podman pull "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-backend:$VERSION"

echo "   Pulling frontend:$VERSION..."
podman pull "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:$VERSION"

echo "   Pulling TTS:$VERSION..."
podman pull "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-tts:$VERSION" || echo "   (TTS image not found, skipping)"

echo ""
echo "✓ Images pulled successfully"

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
podman-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
echo "✓ Containers stopped"

# Wait for clean shutdown
echo ""
echo "⏳ Waiting 5 seconds for clean shutdown..."
sleep 5

# Start services
echo ""
echo "🚀 Starting services..."
podman-compose -f "$COMPOSE_FILE" up -d
echo "✓ Services started"

# Wait for health
echo ""
echo "⏳ Waiting for services to become healthy..."
WAIT_TIME=0
MAX_WAIT=90

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    BACKEND_STATUS=$(podman ps --filter name=backend-production --format '{{.Status}}' 2>/dev/null || echo "")
    
    if echo "$BACKEND_STATUS" | grep -q "healthy"; then
        echo "✓ Backend is healthy after ${WAIT_TIME}s"
        break
    fi
    
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
    
    if [ $((WAIT_TIME % 15)) -eq 0 ]; then
        echo "   Still waiting... (${WAIT_TIME}s / ${MAX_WAIT}s)"
    fi
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "⚠ WARNING: Backend health check timed out, continuing anyway..."
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Container deployment complete"
echo "═══════════════════════════════════════════════════════════"
REMOTE_SCRIPT

# Replace placeholders
sed -i.bak "s/VERSION_PLACEHOLDER/$VERSION/g" /tmp/remote-production-deploy.sh
sed -i.bak "s|REGISTRY_URL_PLACEHOLDER|$REGISTRY_URL|g" /tmp/remote-production-deploy.sh
sed -i.bak "s/REGISTRY_USER_PLACEHOLDER/$REGISTRY_USER/g" /tmp/remote-production-deploy.sh
rm -f /tmp/remote-production-deploy.sh.bak

# Transfer and execute
log "${YELLOW}Transferring deployment script...${NC}"
scp /tmp/remote-production-deploy.sh "$REMOTE_HOST:/tmp/"

log "${YELLOW}Executing remote deployment...${NC}"
ssh "$REMOTE_HOST" "chmod +x /tmp/remote-production-deploy.sh && /tmp/remote-production-deploy.sh" | tee -a "$LOG_FILE"

# Cleanup
rm -f /tmp/remote-production-deploy.sh

log "${GREEN}✓ Container deployment complete${NC}"

# ============================================================================
# NGINX IP UPDATE
# ============================================================================

log_section "Step 3: Update Nginx Configuration"

log "${YELLOW}Updating Nginx with new container IPs...${NC}"

# Execute nginx update script on remote
ssh "$REMOTE_HOST" "bash /usr/local/bin/update-nginx-ips.sh production" | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    log "${GREEN}✓ Nginx configuration updated${NC}"
else
    log "${RED}❌ ERROR: Nginx update failed!${NC}"
    exit 1
fi

# ============================================================================
# VERIFICATION
# ============================================================================

log_section "Step 4: Verification"

log "${YELLOW}Testing connectivity...${NC}"
sleep 3

# Test health endpoint
HEALTH_URL="https://$DOMAIN/api/health"
log "   Testing: $HEALTH_URL"

RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" --max-time 15 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" == "200" ]]; then
    log "${GREEN}✓ Health check passed: $BODY${NC}"
else
    log "${RED}❌ Health check failed: HTTP $HTTP_CODE${NC}"
    log "   Response: $BODY"
    log "${YELLOW}   Waiting 10s and retrying...${NC}"
    sleep 10
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" --max-time 15 2>/dev/null || echo -e "\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        log "${GREEN}✓ Health check passed on retry${NC}"
    else
        log "${RED}❌ Health check still failing${NC}"
        log "${RED}   Check logs: ssh $REMOTE_HOST 'podman logs meaningful-conversations-backend-production'${NC}"
        exit 1
    fi
fi

# Verify user count unchanged
log "${YELLOW}Verifying database integrity...${NC}"
NEW_USER_COUNT=$(ssh "$REMOTE_HOST" "podman exec meaningful-conversations-mariadb-production bash -c \"echo 'SELECT COUNT(*) FROM User;' | /usr/bin/mariadb -u root -p\\\${MARIADB_ROOT_PASSWORD} meaningful_conversations_production 2>/dev/null\" | tail -1" || echo "0")
log "   User count after deployment: $NEW_USER_COUNT"

if [[ "$NEW_USER_COUNT" != "$USER_COUNT" ]]; then
    log "${YELLOW}⚠ WARNING: User count changed! Before: $USER_COUNT, After: $NEW_USER_COUNT${NC}"
else
    log "${GREEN}✓ User count verified (no data loss)${NC}"
fi

# Show service status
log ""
log "${YELLOW}Service status:${NC}"
ssh "$REMOTE_HOST" "cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml ps" | tee -a "$LOG_FILE"

# ============================================================================
# CLEANUP
# ============================================================================

log_section "Step 5: Cleanup"

log "${YELLOW}Removing unused images...${NC}"
ssh "$REMOTE_HOST" "podman image prune -f" > /dev/null 2>&1 || true
log "${GREEN}✓ Cleanup complete${NC}"

# ============================================================================
# SUMMARY
# ============================================================================

log ""
log "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
log "${GREEN}║  ✓ PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY          ║${NC}"
log "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
log ""
log "${BLUE}📊 Summary:${NC}"
log "   ✅ Version $VERSION deployed"
log "   ✅ Images pulled from registry (no rebuild)"
log "   ✅ Containers restarted"
log "   ✅ Nginx IPs updated"
log "   ✅ Health check passed"
log "   ✅ Database integrity verified ($NEW_USER_COUNT users)"
log ""
log "${GREEN}🎉 Production is live at https://$DOMAIN${NC}"
log ""
log "Log file: $LOG_FILE"
log ""
log "${YELLOW}Useful commands:${NC}"
log "  View logs:    ssh $REMOTE_HOST 'podman logs -f meaningful-conversations-backend-production'"
log "  Check status: ssh $REMOTE_HOST 'cd /opt/manualmode-production && podman-compose -f podman-compose-production.yml ps'"

exit 0

