#!/bin/bash
################################################################################
# Nginx Blue-Green Routing Update Script
# Manages Nginx configuration during blue-green deployments
################################################################################

set -e

ACTION="${1:-help}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NGINX_CONF="/etc/nginx/sites-available/meaningful-conversations-production.conf"
NGINX_LINK="/etc/nginx/sites-enabled/meaningful-conversations-production.conf"

show_help() {
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  enable-green   Enable Green container routing (Blue still accessible)"
    echo "  disable-green  Disable Green container routing (Blue only)"
    echo "  disable-blue   Disable Blue container routing (Green only)"
    echo "  status         Show current routing status"
    echo "  help           Show this help"
    echo ""
}

check_nginx() {
    if ! command -v nginx &> /dev/null; then
        echo -e "${RED}Error: nginx is not installed${NC}"
        exit 1
    fi
}

reload_nginx() {
    echo -e "${YELLOW}Testing nginx configuration...${NC}"
    if nginx -t; then
        echo -e "${GREEN}✓ Configuration valid${NC}"
        echo -e "${YELLOW}Reloading nginx...${NC}"
        systemctl reload nginx || service nginx reload
        echo -e "${GREEN}✓ Nginx reloaded${NC}"
    else
        echo -e "${RED}✗ Configuration invalid, not reloading${NC}"
        exit 1
    fi
}

enable_green() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Enabling Green Container Routing${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Check if Green is running
    if ! podman inspect meaningful-conversations-frontend-green &>/dev/null; then
        echo -e "${YELLOW}Warning: Green container is not running${NC}"
    fi
    
    # Update nginx config to route to Green for new users
    cat > /tmp/nginx-routing-map.conf << 'EOF'
# Route based on deployment cookie
map $cookie_mc_deployment $upstream_frontend {
    "blue"  frontend_blue;
    default frontend_green;  # New users go to Green
}
EOF
    
    # Copy to nginx config directory
    cp /tmp/nginx-routing-map.conf /etc/nginx/conf.d/deployment-routing.conf
    
    reload_nginx
    
    echo ""
    echo -e "${GREEN}✓ Green routing enabled${NC}"
    echo -e "${YELLOW}New users will be routed to Green (port 8083)${NC}"
    echo -e "${YELLOW}Existing users stay on Blue (port 80)${NC}"
}

disable_green() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Disabling Green Container Routing${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Update nginx config to route all traffic to Blue
    cat > /tmp/nginx-routing-map.conf << 'EOF'
# Route all traffic to Blue
map $cookie_mc_deployment $upstream_frontend {
    default frontend_blue;  # All users go to Blue
}
EOF
    
    cp /tmp/nginx-routing-map.conf /etc/nginx/conf.d/deployment-routing.conf
    
    reload_nginx
    
    echo ""
    echo -e "${GREEN}✓ Green routing disabled${NC}"
    echo -e "${YELLOW}All users will be routed to Blue (port 80)${NC}"
}

disable_blue() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Disabling Blue Container Routing${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Check if Blue is running
    if podman inspect meaningful-conversations-frontend-blue &>/dev/null; then
        echo -e "${YELLOW}Warning: Blue container is still running${NC}"
        echo -e "${YELLOW}Consider stopping it first: podman stop meaningful-conversations-frontend-blue${NC}"
    fi
    
    # Update nginx config to route all traffic to Green
    cat > /tmp/nginx-routing-map.conf << 'EOF'
# Route all traffic to Green (Blue is offline)
map $cookie_mc_deployment $upstream_frontend {
    default frontend_green;  # All users go to Green
}
EOF
    
    cp /tmp/nginx-routing-map.conf /etc/nginx/conf.d/deployment-routing.conf
    
    reload_nginx
    
    echo ""
    echo -e "${GREEN}✓ Blue routing disabled${NC}"
    echo -e "${YELLOW}All users will be routed to Green (port 8083)${NC}"
}

show_status() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Nginx Routing Status${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Check container status
    echo "Container Status:"
    if podman inspect meaningful-conversations-frontend-blue &>/dev/null; then
        BLUE_STATUS=$(podman inspect meaningful-conversations-frontend-blue --format '{{.State.Status}}')
        echo -e "  Blue:  ${GREEN}$BLUE_STATUS${NC}"
    else
        echo -e "  Blue:  ${YELLOW}not found${NC}"
    fi
    
    if podman inspect meaningful-conversations-frontend-green &>/dev/null; then
        GREEN_STATUS=$(podman inspect meaningful-conversations-frontend-green --format '{{.State.Status}}')
        echo -e "  Green: ${GREEN}$GREEN_STATUS${NC}"
    else
        echo -e "  Green: ${YELLOW}not found${NC}"
    fi
    
    echo ""
    
    # Check routing config
    if [ -f /etc/nginx/conf.d/deployment-routing.conf ]; then
        echo "Routing Configuration:"
        if grep -q "frontend_green" /etc/nginx/conf.d/deployment-routing.conf; then
            if grep -q "default frontend_green" /etc/nginx/conf.d/deployment-routing.conf; then
                echo -e "  ${GREEN}New users → Green${NC}"
            fi
        fi
        if grep -q "frontend_blue" /etc/nginx/conf.d/deployment-routing.conf; then
            if grep -q "default frontend_blue" /etc/nginx/conf.d/deployment-routing.conf; then
                echo -e "  ${GREEN}New users → Blue${NC}"
            fi
            if grep -q '"blue".*frontend_blue' /etc/nginx/conf.d/deployment-routing.conf; then
                echo -e "  ${YELLOW}Existing users → Blue${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}No deployment routing configuration found${NC}"
    fi
    
    echo ""
    
    # Test connectivity
    echo "Connectivity Test:"
    if curl -f -s -o /dev/null http://localhost:80; then
        echo -e "  Blue (port 80):   ${GREEN}✓ responding${NC}"
    else
        echo -e "  Blue (port 80):   ${RED}✗ not responding${NC}"
    fi
    
    if curl -f -s -o /dev/null http://localhost:8083; then
        echo -e "  Green (port 8083): ${GREEN}✓ responding${NC}"
    else
        echo -e "  Green (port 8083): ${YELLOW}✗ not responding${NC}"
    fi
}

# Main script
check_nginx

case "$ACTION" in
    enable-green)
        enable_green
        ;;
    disable-green)
        disable_green
        ;;
    disable-blue)
        disable_blue
        ;;
    status)
        show_status
        ;;
    help|*)
        show_help
        ;;
esac

