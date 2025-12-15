#!/bin/bash
################################################################################
# Blue-Green Zero-Downtime Deployment Script
# Deploys new version alongside old one, monitors sessions, then switches
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
REMOTE_HOST="root@91.99.193.87"
REMOTE_DIR="/opt/manualmode-production"
COMPOSE_FILE="podman-compose-production.yml"
VERSION=$(grep -m1 '"version"' package.json | awk -F'"' '{print $4}')

# Registry
REGISTRY_URL="${REGISTRY_URL:-registry.manualmode.at}"
REGISTRY_USER="${REGISTRY_USER:-gherold}"

# Parse arguments
AUTO_SHUTDOWN=false
MONITOR_INTERVAL=30
SKIP_BUILD=false

show_help() {
    echo -e "${GREEN}Blue-Green Zero-Downtime Deployment${NC}"
    echo ""
    echo "Usage: ./deploy-blue-green.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -a, --auto        Automatically shutdown Blue when no sessions (default: manual)"
    echo "  -i, --interval N  Monitoring interval in seconds (default: 30)"
    echo "  -s, --skip-build  Skip building images (use existing)"
    echo "  -h, --help        Show this help"
    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--auto)
            AUTO_SHUTDOWN=true
            shift
            ;;
        -i|--interval)
            MONITOR_INTERVAL="$2"
            shift 2
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Blue-Green Zero-Downtime Deployment                 ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Version:${NC}         $VERSION"
echo -e "${BLUE}Target:${NC}          $REMOTE_HOST"
echo -e "${BLUE}Auto-Shutdown:${NC}   $AUTO_SHUTDOWN"
echo -e "${BLUE}Monitor Interval:${NC} ${MONITOR_INTERVAL}s"
echo ""

# ============================================================================
# STEP 1: BUILD & PUSH GREEN CONTAINER
# ============================================================================

if [[ "$SKIP_BUILD" == false ]]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Step 1: Building Green Container${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo -e "${YELLOW}Building frontend...${NC}"
    npm run build
    
    echo -e "${YELLOW}Building Docker image...${NC}"
    FRONTEND_IMAGE="$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:$VERSION"
    podman build --platform linux/amd64 -t "$FRONTEND_IMAGE" .
    podman tag "$FRONTEND_IMAGE" "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:latest"
    
    echo -e "${YELLOW}Pushing to registry...${NC}"
    podman push "$FRONTEND_IMAGE"
    
    echo -e "${GREEN}✓ Green container built and pushed${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping build phase${NC}"
    echo ""
fi

# ============================================================================
# STEP 2: START GREEN CONTAINER
# ============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Starting Green Container${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ssh "$REMOTE_HOST" << EOF
cd $REMOTE_DIR

# Get current Blue version
if podman inspect meaningful-conversations-frontend-blue &>/dev/null; then
    CURRENT_VERSION=\$(podman inspect meaningful-conversations-frontend-blue --format '{{.Config.Image}}' | cut -d: -f2)
    echo "Current Blue version: \$CURRENT_VERSION"
    export CURRENT_VERSION
else
    echo "No Blue container running, this is first deployment"
    export CURRENT_VERSION="none"
fi

# Set new version
export VERSION=$VERSION

# Pull new image
echo "Pulling Green image: $VERSION..."
podman pull $REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:$VERSION

# Start Green container (using profile to activate it)
echo "Starting Green container..."
podman-compose -f $COMPOSE_FILE --profile deployment up -d frontend-green

# Wait for health check
echo "Waiting for Green to be healthy..."
for i in {1..30}; do
  if podman healthcheck run meaningful-conversations-frontend-green 2>/dev/null; then
    echo "✓ Green is healthy!"
    break
  fi
  if [ \$i -eq 30 ]; then
    echo "ERROR: Green failed health check after 60s"
    exit 1
  fi
  sleep 2
done

echo "Green container is running on port 8083"
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start Green container${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Green container started and healthy${NC}"
echo ""

# ============================================================================
# STEP 3: UPDATE NGINX ROUTING
# ============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Updating Nginx Routing${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}Configuring Nginx for Blue-Green routing...${NC}"
ssh "$REMOTE_HOST" << 'EOF'
if [ -f "/usr/local/bin/update-nginx-blue-green.sh" ]; then
    /usr/local/bin/update-nginx-blue-green.sh enable-green
    echo "✓ Nginx configured for Blue-Green"
else
    echo "⚠ Warning: update-nginx-blue-green.sh not found"
    echo "Manual Nginx configuration required:"
    echo "  - Route new users to port 8083 (Green)"
    echo "  - Keep existing sessions on port 80 (Blue)"
fi
EOF

echo -e "${GREEN}✓ Nginx routing configured${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Green Deployment Active${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Blue container (old):  ${BLUE}Port 80${NC}  - Existing users"
echo -e "Green container (new): ${GREEN}Port 8083${NC} - New users"
echo ""

# ============================================================================
# STEP 4: MONITOR BLUE SESSIONS
# ============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Monitoring Blue Container Sessions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Waiting for all users to migrate to Green...${NC}"
echo -e "${YELLOW}(Press Ctrl+C to stop monitoring and keep both running)${NC}"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ jq not found, installing...${NC}"
    if command -v brew &> /dev/null; then
        brew install jq
    else
        echo -e "${RED}Please install jq manually: brew install jq${NC}"
        exit 1
    fi
fi

CONSECUTIVE_ZERO_COUNT=0
REQUIRED_ZERO_COUNT=3  # Require 3 consecutive zero readings before shutdown

while true; do
    RESPONSE=$(ssh "$REMOTE_HOST" "curl -s http://localhost:8082/api/deployment/active-sessions" 2>/dev/null)
    
    if [ -z "$RESPONSE" ]; then
        echo -e "${RED}[$(date +%H:%M:%S)] Failed to query session endpoint${NC}"
        sleep $MONITOR_INTERVAL
        continue
    fi
    
    OLD_COUNT=$(echo "$RESPONSE" | jq -r '.oldVersionSessions // 0' 2>/dev/null || echo "?")
    TOTAL_COUNT=$(echo "$RESPONSE" | jq -r '.totalActiveUsers // 0' 2>/dev/null || echo "?")
    
    if [ "$OLD_COUNT" == "?" ]; then
        echo -e "${RED}[$(date +%H:%M:%S)] Error parsing session data${NC}"
        sleep $MONITOR_INTERVAL
        continue
    fi
    
    # Display status
    if [ "$OLD_COUNT" -eq 0 ]; then
        echo -e "[$(date +%H:%M:%S)] ${GREEN}✓${NC} No sessions on Blue | Total active: $TOTAL_COUNT"
        CONSECUTIVE_ZERO_COUNT=$((CONSECUTIVE_ZERO_COUNT + 1))
    else
        echo -e "[$(date +%H:%M:%S)] ${YELLOW}⏳${NC} Sessions on Blue: $OLD_COUNT | Total: $TOTAL_COUNT"
        CONSECUTIVE_ZERO_COUNT=0
    fi
    
    # Check if we can shutdown
    if [ $CONSECUTIVE_ZERO_COUNT -ge $REQUIRED_ZERO_COUNT ]; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}No active sessions on Blue for $(($CONSECUTIVE_ZERO_COUNT * $MONITOR_INTERVAL))s${NC}"
        echo -e "${GREEN}Safe to shutdown Blue container${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
        echo ""
        
        if [[ "$AUTO_SHUTDOWN" == true ]]; then
            echo -e "${YELLOW}Auto-shutdown enabled, stopping Blue...${NC}"
            SHUTDOWN_CONFIRMED=true
        else
            read -p "Stop Blue container now? [y/N] " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                SHUTDOWN_CONFIRMED=true
            else
                echo -e "${YELLOW}Keeping both containers running${NC}"
                break
            fi
        fi
        
        if [[ "$SHUTDOWN_CONFIRMED" == true ]]; then
            # ============================================================================
            # STEP 5: SHUTDOWN BLUE CONTAINER
            # ============================================================================
            
            echo ""
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${BLUE}Step 5: Shutting Down Blue Container${NC}"
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            
            ssh "$REMOTE_HOST" << EOF
cd $REMOTE_DIR

# Stop Blue container
echo "Stopping Blue container..."
podman-compose -f $COMPOSE_FILE stop frontend-blue

# Remove Blue container
echo "Removing Blue container..."
podman-compose -f $COMPOSE_FILE rm -f frontend-blue

# Rename Green to Blue for next deployment
echo "Promoting Green to Blue..."
podman stop meaningful-conversations-frontend-green
podman rename meaningful-conversations-frontend-green meaningful-conversations-frontend-blue
podman start meaningful-conversations-frontend-blue

# Update Nginx to only use Blue (which is now the new version)
if [ -f "/usr/local/bin/update-nginx-blue-green.sh" ]; then
    /usr/local/bin/update-nginx-blue-green.sh disable-green
fi

echo "✓ Blue container removed, Green promoted to Blue"
EOF
            
            echo -e "${GREEN}✓ Old container removed${NC}"
            break
        fi
    fi
    
    sleep $MONITOR_INTERVAL
done

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete!                                 ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Version:${NC}       $VERSION"
echo -e "${BLUE}Frontend URL:${NC}  https://mc-app.manualmode.at"
echo ""
echo -e "${YELLOW}Testing connectivity...${NC}"
sleep 3

if curl -f -s -o /dev/null "https://mc-app.manualmode.at"; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not responding yet (may still be starting)${NC}"
fi

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  Monitor sessions: ${BLUE}./monitor-deployment.sh${NC}"
echo -e "  View logs:        ${BLUE}ssh $REMOTE_HOST 'cd $REMOTE_DIR && podman logs meaningful-conversations-frontend-blue'${NC}"
echo -e "  Rollback:         ${BLUE}# If issues occur, restart old version manually${NC}"
echo ""

