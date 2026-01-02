#!/bin/bash
#
# Restart Containers & Auto-Update Nginx IPs
# 
# This wrapper script ALWAYS updates Nginx after container restarts
# to prevent 502 errors due to changed container IPs.
#
# Usage:
#   ./scripts/restart-with-nginx-update.sh production [service]
#   ./scripts/restart-with-nginx-update.sh staging [service]
#

set -e

ENVIRONMENT="$1"
SERVICE="$2"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    echo -e "${RED}❌ Error: Environment must be 'production' or 'staging'${NC}"
    echo "Usage: $0 <production|staging> [service]"
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

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Container Restart with Automatic Nginx IP Update        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Environment: $ENVIRONMENT"
echo "   Service: ${SERVICE:-all services}"
echo "   Domain: $DOMAIN"
echo ""

# Step 1: Restart containers
echo -e "${YELLOW}🔄 Step 1: Restarting containers...${NC}"
cd "$COMPOSE_PATH"
if [[ -n "$SERVICE" ]]; then
    echo "   Restarting service: $SERVICE"
    podman-compose -f "$COMPOSE_FILE" restart "$SERVICE"
else
    echo "   Restarting all services"
    podman-compose -f "$COMPOSE_FILE" restart
fi
echo -e "${GREEN}✓ Containers restarted${NC}"
echo ""

# Step 2: Wait for health
echo -e "${YELLOW}⏳ Step 2: Waiting for services to be healthy...${NC}"
sleep 15
echo -e "${GREEN}✓ Wait complete${NC}"
echo ""

# Step 3: Update Nginx IPs
echo -e "${YELLOW}🔧 Step 3: Updating Nginx configuration...${NC}"
bash /opt/manualmode-production/update-nginx-ips.sh "$ENVIRONMENT"
echo -e "${GREEN}✓ Nginx IPs updated${NC}"
echo ""

# Step 4: Reload Nginx
echo -e "${YELLOW}🔄 Step 4: Reloading Nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

# Step 5: Test connectivity
echo -e "${YELLOW}🧪 Step 5: Testing connectivity...${NC}"
HEALTH_URL="https://$DOMAIN/api/health"
echo "   Testing: $HEALTH_URL"

RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" --max-time 10)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed "$d")

if [[ "$HTTP_CODE" == "200" ]]; then
    echo -e "${GREEN}✓ Health check passed: $BODY${NC}"
else
    echo -e "${RED}❌ Health check failed: HTTP $HTTP_CODE${NC}"
    echo "   Response: $BODY"
    exit 1
fi
echo ""

# Step 6: Final status
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ RESTART COMPLETED SUCCESSFULLY                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "   ✅ Containers restarted"
echo "   ✅ Nginx IPs updated"
echo "   ✅ Nginx reloaded"
echo "   ✅ Connectivity verified"
echo ""
echo -e "${GREEN}🎉 $ENVIRONMENT is ready!${NC}"

