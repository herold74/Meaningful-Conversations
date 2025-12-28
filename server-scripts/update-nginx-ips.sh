#!/bin/bash
################################################################################
# update-nginx-ips.sh - FIXED VERSION
# Regenerates nginx configuration with current container IPs from Podman.
# 
# IMPORTANT: This completely rewrites the config files to ensure correctness.
# No more sed pattern matching - just regenerate the entire config.
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

get_container_ip() {
    local container_name=$1
    podman inspect "$container_name" --format "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" 2>/dev/null
}

generate_staging_config() {
    local backend_ip=$(get_container_ip "meaningful-conversations-backend-staging")
    local frontend_ip=$(get_container_ip "meaningful-conversations-frontend-staging")
    local tts_ip=$(get_container_ip "meaningful-conversations-tts-staging")
    
    if [ -z "$backend_ip" ] || [ -z "$frontend_ip" ]; then
        print_error "Failed to get staging container IPs"
        return 1
    fi
    
    print_info "Staging Backend IP: $backend_ip (port 8080)"
    print_info "Staging Frontend IP: $frontend_ip (port 3000)"
    [ -n "$tts_ip" ] && print_info "Staging TTS IP: $tts_ip (port 8082)"
    
    cat > /etc/nginx/conf.d/staging-meaningful-conversations.conf << EOF
server {
    listen 443 ssl http2;
    server_name mc-beta.manualmode.at;
    
    ssl_certificate /etc/letsencrypt/live/mc-app.manualmode.at/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mc-app.manualmode.at/privkey.pem;
    
    location /api/ {
        proxy_pass http://${backend_ip}:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /tts/ {
        proxy_pass http://${tts_ip:-$backend_ip}:8082/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location / {
        proxy_pass http://${frontend_ip}:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    print_success "Generated staging-meaningful-conversations.conf"
}

generate_production_config() {
    local backend_ip=$(get_container_ip "meaningful-conversations-backend-production")
    local frontend_ip=$(get_container_ip "meaningful-conversations-frontend-production")
    local tts_ip=$(get_container_ip "meaningful-conversations-tts-production")
    
    if [ -z "$backend_ip" ] || [ -z "$frontend_ip" ]; then
        print_error "Failed to get production container IPs"
        return 1
    fi
    
    print_info "Production Backend IP: $backend_ip (port 8080)"
    print_info "Production Frontend IP: $frontend_ip (port 3000)"
    [ -n "$tts_ip" ] && print_info "Production TTS IP: $tts_ip (port 8082)"
    
    cat > /etc/nginx/conf.d/production-meaningful-conversations.conf << EOF
server {
    listen 443 ssl http2;
    server_name mc-app.manualmode.at;
    
    ssl_certificate /etc/letsencrypt/live/mc-app.manualmode.at/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mc-app.manualmode.at/privkey.pem;
    
    location /api/ {
        proxy_pass http://${backend_ip}:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /tts/ {
        proxy_pass http://${tts_ip:-$backend_ip}:8082/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location / {
        proxy_pass http://${frontend_ip}:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    print_success "Generated production-meaningful-conversations.conf"
}

main() {
    local environment=$1
    
    if [ -z "$environment" ]; then
        print_error "Usage: $0 {staging|production|all}"
        exit 1
    fi
    
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root"
        exit 1
    fi
    
    print_info "Starting nginx IP update for: $environment"
    echo ""
    
    case "$environment" in
        staging) generate_staging_config ;;
        production) generate_production_config ;;
        all) generate_staging_config; echo ""; generate_production_config ;;
        *) print_error "Invalid: $environment"; exit 1 ;;
    esac
    
    echo ""
    print_info "Testing nginx configuration..."
    if nginx -t 2>&1 | grep -q "successful"; then
        print_success "Nginx configuration is valid"
        print_info "Reloading nginx..."
        nginx -s reload
        print_success "Nginx reloaded successfully"
        echo ""
        print_success "Nginx IP update completed successfully!"
    else
        print_error "Nginx config test failed!"
        nginx -t
        exit 1
    fi
}

main "$@"
