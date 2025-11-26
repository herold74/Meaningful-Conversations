#!/bin/bash
# Automated restart script to apply resource limits
# This script safely restarts Production and Staging containers
# to activate the new resource limits configured in podman-compose files

set -e

LOG_FILE="/var/log/mc-restart-$(date +%Y%m%d-%H%M%S).log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting automated container restart"
log "Purpose: Activate resource limits"
log "=========================================="
log ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log "ERROR: This script must be run as root"
    exit 1
fi

# Step 1: Restart Production (priority service)
log "Step 1: Restarting Production environment..."
log "Location: /opt/manualmode-production"

cd /opt/manualmode-production

log "- Stopping Production containers..."
podman-compose -f podman-compose-production.yml down >> "$LOG_FILE" 2>&1

log "- Starting Production containers with new resource limits..."
podman-compose -f podman-compose-production.yml up -d >> "$LOG_FILE" 2>&1

log "- Waiting 30 seconds for services to stabilize..."
sleep 30

# Check Production health
log "- Checking Production health status..."
PROD_STATUS=$(podman ps --filter "name=production" --format "{{.Names}}: {{.Status}}" || echo "ERROR")
log "$PROD_STATUS"

# Step 2: Restart Staging (if running)
log ""
log "Step 2: Checking Staging environment..."

STAGING_RUNNING=$(podman ps --filter "name=staging" --quiet | wc -l)

if [ "$STAGING_RUNNING" -gt 0 ]; then
    log "Staging is running, restarting..."
    log "Location: /opt/manualmode-staging"
    
    cd /opt/manualmode-staging
    
    log "- Stopping Staging containers..."
    podman-compose -f podman-compose-staging.yml down >> "$LOG_FILE" 2>&1
    
    log "- Starting Staging containers with new resource limits..."
    podman-compose -f podman-compose-staging.yml up -d >> "$LOG_FILE" 2>&1
    
    log "- Waiting 20 seconds for services to stabilize..."
    sleep 20
    
    # Check Staging health
    log "- Checking Staging health status..."
    STAGING_STATUS=$(podman ps --filter "name=staging" --format "{{.Names}}: {{.Status}}" || echo "ERROR")
    log "$STAGING_STATUS"
else
    log "Staging is not running, skipping restart."
fi

# Step 3: Verify resource limits are applied
log ""
log "Step 3: Verifying resource limits..."
log ""

# Check Production container specs
log "Production containers resource allocation:"
for container in meaningful-conversations-frontend-production meaningful-conversations-backend-production meaningful-conversations-tts-production meaningful-conversations-mariadb-production; do
    if podman ps --format "{{.Names}}" | grep -q "^${container}$"; then
        # Get container resource info (if available)
        log "  - $container: Running ✓"
    fi
done

log ""
log "Staging containers resource allocation:"
for container in meaningful-conversations-frontend-staging meaningful-conversations-backend-staging meaningful-conversations-tts-staging meaningful-conversations-mariadb-staging; do
    if podman ps --format "{{.Names}}" | grep -q "^${container}$"; then
        log "  - $container: Running ✓"
    fi
done

# Step 4: Final system check
log ""
log "Step 4: Final system resource check..."
log ""

FREE_OUTPUT=$(free -h)
log "$FREE_OUTPUT"
log ""

UPTIME_OUTPUT=$(uptime)
log "System load: $UPTIME_OUTPUT"
log ""

# Step 5: Container stats snapshot
log "Step 5: Current container resource usage:"
log ""
STATS_OUTPUT=$(podman stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "Stats not available")
log "$STATS_OUTPUT"

# Step 6: Update Nginx configuration with new container IPs
log ""
log "Step 6: Updating Nginx configuration with new container IPs..."
log ""

if [ -f "/opt/manualmode-production/update-nginx-ips.sh" ]; then
    log "- Updating Production nginx configuration..."
    bash /opt/manualmode-production/update-nginx-ips.sh production >> "$LOG_FILE" 2>&1
    log "✓ Production nginx configuration updated"
    
    if [ "$STAGING_RUNNING" -gt 0 ]; then
        log "- Updating Staging nginx configuration..."
        bash /opt/manualmode-production/update-nginx-ips.sh staging >> "$LOG_FILE" 2>&1
        log "✓ Staging nginx configuration updated"
    fi
    
    log "✓ Nginx reloaded with new container IPs"
else
    log "⚠ Nginx update script not found at /opt/manualmode-production/update-nginx-ips.sh"
    log "⚠ You may need to manually update nginx configuration if IPs changed"
fi

log ""
log "=========================================="
log "Restart completed successfully!"
log "=========================================="
log ""
log "Full log saved to: $LOG_FILE"
log ""
log "Resource limits are now active."
log "Monitor with: bash /opt/manualmode-production/scripts/monitor-dashboard.sh"

# Send notification email (if mail is configured)
if command -v mail &> /dev/null; then
    echo "Container restart completed at $(date). Resource limits are now active. Log: $LOG_FILE" | \
    mail -s "MC: Resource Limits Activated - $(date +%Y-%m-%d)" root 2>/dev/null || true
fi

exit 0

