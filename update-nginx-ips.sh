#!/bin/bash

################################################################################
# update-nginx-ips.sh
# Automatically updates nginx configuration files with current container IPs
# from Podman pods. This ensures nginx reverse proxy always points to the
# correct backend and frontend containers.
#
# Usage:
#   ./update-nginx-ips.sh staging
#   ./update-nginx-ips.sh production
#   ./update-nginx-ips.sh all
#
# This script should be run:
# - After deploying/restarting pods
# - When container IPs change
# - As part of the deployment automation
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to get container IP address
get_container_ip() {
    local container_name=$1
    local ip=$(podman inspect "$container_name" 2>/dev/null | \
        grep -A 10 '"Networks"' | \
        grep '"IPAddress"' | \
        grep -v '""' | \
        head -1 | \
        awk -F'"' '{print $4}')
    
    if [ -z "$ip" ]; then
        # Use stderr for error messages to avoid polluting stdout
        echo "Could not find IP for container: $container_name" >&2
        return 1
    fi
    
    echo "$ip"
}

# Function to update nginx config file
update_nginx_config() {
    local config_file=$1
    local search_pattern=$2
    local new_ip=$3
    
    if [ ! -f "$config_file" ]; then
        print_warning "Config file not found: $config_file"
        return 1
    fi
    
    # Create backup
    cp "$config_file" "${config_file}.bak"
    
    # Update the IP address
    sed -i "s|${search_pattern}|${new_ip}|g" "$config_file"
    
    print_success "Updated $config_file"
}

# Function to update staging nginx configs
update_staging_configs() {
    print_info "Updating staging nginx configurations..." >&2
    
    # Get container IPs
    local backend_ip=$(get_container_ip "meaningful-conversations-backend-staging")
    local frontend_ip=$(get_container_ip "meaningful-conversations-frontend-staging")
    
    if [ -z "$backend_ip" ] || [ -z "$frontend_ip" ]; then
        print_error "Failed to get staging container IPs" >&2
        return 1
    fi
    
    echo "Staging Backend IP: $backend_ip" >&2
    echo "Staging Frontend IP: $frontend_ip" >&2
    
    # Update staging-meaningful-conversations.conf
    if [ -f "/etc/nginx/conf.d/staging-meaningful-conversations.conf" ]; then
        # Update backend proxy_pass (handles both /api/ and plain :8080)
        sed -i "s|proxy_pass http://[0-9.]*:8080|proxy_pass http://${backend_ip}:8080|g" \
            /etc/nginx/conf.d/staging-meaningful-conversations.conf
        # Update frontend proxy_pass
        sed -i "s|proxy_pass http://[0-9.]*:3000|proxy_pass http://${frontend_ip}:3000|g" \
            /etc/nginx/conf.d/staging-meaningful-conversations.conf
        print_success "Updated staging-meaningful-conversations.conf" >&2
    fi
    
    # Update staging-frontend-8080.conf
    if [ -f "/etc/nginx/conf.d/staging-frontend-8080.conf" ]; then
        sed -i "s|proxy_pass http://[0-9.]*:8080;|proxy_pass http://${backend_ip}:8080;|g" \
            /etc/nginx/conf.d/staging-frontend-8080.conf
        sed -i "s|proxy_pass http://[0-9.]*:3000;|proxy_pass http://${frontend_ip}:3000;|g" \
            /etc/nginx/conf.d/staging-frontend-8080.conf
        print_success "Updated staging-frontend-8080.conf" >&2
    fi
    
    # Update staging-backend-8081.conf
    if [ -f "/etc/nginx/conf.d/staging-backend-8081.conf" ]; then
        sed -i "s|proxy_pass http://[0-9.]*:8080;|proxy_pass http://${backend_ip}:8080;|g" \
            /etc/nginx/conf.d/staging-backend-8081.conf
        print_success "Updated staging-backend-8081.conf" >&2
    fi
}

# Function to update production nginx configs
update_production_configs() {
    print_info "Updating production nginx configurations..." >&2
    
    # Get container IPs
    local backend_ip=$(get_container_ip "meaningful-conversations-backend-production")
    
    # Try blue-green container names first (frontend-blue, frontend-green), then fallback to -production
    local frontend_ip=$(get_container_ip "meaningful-conversations-frontend-blue" 2>/dev/null)
    if [ -z "$frontend_ip" ]; then
        frontend_ip=$(get_container_ip "meaningful-conversations-frontend-green" 2>/dev/null)
    fi
    if [ -z "$frontend_ip" ]; then
        frontend_ip=$(get_container_ip "meaningful-conversations-frontend-production" 2>/dev/null)
    fi
    
    if [ -z "$backend_ip" ] || [ -z "$frontend_ip" ]; then
        print_error "Failed to get production container IPs" >&2
        return 1
    fi
    
    echo "Production Backend IP: $backend_ip" >&2
    echo "Production Frontend IP: $frontend_ip" >&2
    
    # Update production-meaningful-conversations.conf
    if [ -f "/etc/nginx/conf.d/production-meaningful-conversations.conf" ]; then
        # Update backend proxy_pass (handles both /api/ and plain :8080)
        sed -i "s|proxy_pass http://[0-9.]*:8080|proxy_pass http://${backend_ip}:8080|g" \
            /etc/nginx/conf.d/production-meaningful-conversations.conf
        # Update frontend proxy_pass
        sed -i "s|proxy_pass http://[0-9.]*:3000|proxy_pass http://${frontend_ip}:3000|g" \
            /etc/nginx/conf.d/production-meaningful-conversations.conf
        print_success "Updated production-meaningful-conversations.conf" >&2
    else
        print_warning "Production nginx config not found. It will be created on first production deployment." >&2
    fi
}

# Function to test nginx configuration
test_nginx_config() {
    print_info "Testing nginx configuration..." >&2
    
    if nginx -t 2>&1 | grep -q "successful"; then
        print_success "Nginx configuration is valid" >&2
        return 0
    else
        print_error "Nginx configuration test failed!" >&2
        nginx -t >&2
        return 1
    fi
}

# Function to reload nginx
reload_nginx() {
    print_info "Reloading nginx..." >&2
    
    if systemctl reload nginx; then
        print_success "Nginx reloaded successfully" >&2
        return 0
    else
        print_error "Failed to reload nginx" >&2
        return 1
    fi
}

# Main script logic
main() {
    local environment=$1
    
    if [ -z "$environment" ]; then
        print_error "Usage: $0 {staging|production|all}" >&2
        exit 1
    fi
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (it modifies /etc/nginx/)" >&2
        exit 1
    fi
    
    print_info "Starting nginx IP update for: $environment" >&2
    echo "" >&2
    
    case "$environment" in
        staging)
            update_staging_configs
            ;;
        production)
            update_production_configs
            ;;
        all)
            update_staging_configs
            echo "" >&2
            update_production_configs
            ;;
        *)
            print_error "Invalid environment: $environment" >&2
            print_error "Usage: $0 {staging|production|all}" >&2
            exit 1
            ;;
    esac
    
    echo "" >&2
    
    # Test nginx configuration
    if test_nginx_config; then
        echo "" >&2
        reload_nginx
        echo "" >&2
        print_success "Nginx IP update completed successfully!" >&2
    else
        print_error "Nginx configuration has errors. Not reloading." >&2
        print_warning "Backup files are available: /etc/nginx/conf.d/*.bak" >&2
        exit 1
    fi
}

# Run main function
main "$@"

