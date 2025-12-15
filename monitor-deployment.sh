#!/bin/bash
################################################################################
# Blue-Green Deployment Session Monitor
# Displays real-time session counts for Blue and Green containers
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

REMOTE_HOST="root@91.99.193.87"
API_URL="http://localhost:8082/api/deployment/active-sessions"
REFRESH_INTERVAL=10

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    echo -e "${YELLOW}Install it with: brew install jq${NC}"
    exit 1
fi

echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Blue-Green Deployment Session Monitor               ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Connecting to $REMOTE_HOST...${NC}"
echo ""

# Test connection
if ! ssh -o ConnectTimeout=5 "$REMOTE_HOST" "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to $REMOTE_HOST${NC}"
    exit 1
fi

while true; do
    # Fetch session data
    RESPONSE=$(ssh "$REMOTE_HOST" "curl -s $API_URL" 2>/dev/null)
    
    if [ -z "$RESPONSE" ]; then
        clear
        echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ERROR: Unable to reach session endpoint             ${RED}║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}Retrying in ${REFRESH_INTERVAL}s...${NC}"
        sleep $REFRESH_INTERVAL
        continue
    fi
    
    # Parse response
    TOTAL=$(echo "$RESPONSE" | jq -r '.totalActiveUsers // 0')
    OLD=$(echo "$RESPONSE" | jq -r '.oldVersionSessions // 0')
    VERSION=$(echo "$RESPONSE" | jq -r '.currentVersion // "unknown"')
    DEPLOYMENT_TIME=$(echo "$RESPONSE" | jq -r '.deploymentTime // "unknown"')
    
    NEW=$(($TOTAL - $OLD))
    
    # Check container status
    BLUE_STATUS=$(ssh "$REMOTE_HOST" "podman inspect meaningful-conversations-frontend-blue --format '{{.State.Status}}' 2>/dev/null" || echo "not found")
    GREEN_STATUS=$(ssh "$REMOTE_HOST" "podman inspect meaningful-conversations-frontend-green --format '{{.State.Status}}' 2>/dev/null" || echo "not found")
    
    # Clear screen and display dashboard
    clear
    
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Blue-Green Deployment Monitor                        ${CYAN}║${NC}"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  Current Version: ${GREEN}$VERSION${NC}"
    echo -e "${CYAN}║${NC}  Deployment Time: $DEPLOYMENT_TIME"
    echo -e "${CYAN}║${NC}  Last Updated:    $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Container Status
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Container Status${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ "$BLUE_STATUS" == "running" ]; then
        BLUE_PORT=$(ssh "$REMOTE_HOST" "podman port meaningful-conversations-frontend-blue 2>/dev/null | grep 3000 | cut -d':' -f2" || echo "?")
        echo -e "  Blue (Old):  ${GREEN}●${NC} Running on port $BLUE_PORT"
    elif [ "$BLUE_STATUS" == "not found" ]; then
        echo -e "  Blue (Old):  ${YELLOW}○${NC} Not deployed"
    else
        echo -e "  Blue (Old):  ${RED}●${NC} Status: $BLUE_STATUS"
    fi
    
    if [ "$GREEN_STATUS" == "running" ]; then
        GREEN_PORT=$(ssh "$REMOTE_HOST" "podman port meaningful-conversations-frontend-green 2>/dev/null | grep 3001 | cut -d':' -f2" || echo "?")
        echo -e "  Green (New): ${GREEN}●${NC} Running on port $GREEN_PORT"
    elif [ "$GREEN_STATUS" == "not found" ]; then
        echo -e "  Green (New): ${YELLOW}○${NC} Not deployed"
    else
        echo -e "  Green (New): ${RED}●${NC} Status: $GREEN_STATUS"
    fi
    
    echo ""
    
    # Session Statistics
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Active Sessions${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Total sessions
    if [ $TOTAL -gt 0 ]; then
        echo -e "  Total Active Users:   ${CYAN}$TOTAL${NC}"
    else
        echo -e "  Total Active Users:   ${YELLOW}0${NC} (no active sessions)"
    fi
    
    echo ""
    
    # Blue container sessions
    if [ $OLD -eq 0 ]; then
        echo -e "  ${BLUE}Blue Container:${NC}  ${GREEN}✓ 0 sessions${NC}"
        echo -e "                       ${GREEN}Safe to shutdown${NC}"
    else
        BAR=$(printf '█%.0s' $(seq 1 $OLD))
        echo -e "  ${BLUE}Blue Container:${NC}  ${YELLOW}$OLD sessions${NC}"
        echo -e "                       ${YELLOW}$BAR${NC}"
    fi
    
    echo ""
    
    # Green container sessions  
    if [ $NEW -gt 0 ]; then
        BAR=$(printf '█%.0s' $(seq 1 $NEW))
        echo -e "  ${GREEN}Green Container:${NC} ${GREEN}$NEW sessions${NC}"
        echo -e "                       ${GREEN}$BAR${NC}"
    else
        echo -e "  ${GREEN}Green Container:${NC} ${YELLOW}0 sessions${NC}"
    fi
    
    echo ""
    
    # User List (if any on old version)
    if [ $OLD -gt 0 ]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Users on Blue (Old Version)${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        # Parse user list
        USERS=$(echo "$RESPONSE" | jq -r '.users[]? | "  • \(.email) (Last: \(.lastActivity))"')
        if [ -n "$USERS" ]; then
            echo "$USERS"
        else
            echo -e "  ${YELLOW}(No user details available)${NC}"
        fi
        
        echo ""
    fi
    
    # Deployment Progress
    if [ $OLD -gt 0 ] && [ $TOTAL -gt 0 ]; then
        PROGRESS=$((($NEW * 100) / $TOTAL))
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Migration Progress${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        # Progress bar (50 chars wide)
        FILLED=$((PROGRESS / 2))
        EMPTY=$((50 - FILLED))
        BAR_FILLED=$(printf '█%.0s' $(seq 1 $FILLED))
        BAR_EMPTY=$(printf '░%.0s' $(seq 1 $EMPTY))
        
        echo -e "  [${GREEN}$BAR_FILLED${NC}${YELLOW}$BAR_EMPTY${NC}] ${CYAN}${PROGRESS}%${NC}"
        echo ""
    fi
    
    # Instructions
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    echo -e "${YELLOW}Refreshing every ${REFRESH_INTERVAL}s...${NC}"
    
    sleep $REFRESH_INTERVAL
done

