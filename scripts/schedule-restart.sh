#!/bin/bash
# Schedule one-time restart for tomorrow at 06:00
# This script sets up the cron job on the manualmode server

SERVER="root@91.99.193.87"
RESTART_TIME="06:00"

echo "==========================================="
echo "Scheduling Container Restart"
echo "==========================================="
echo ""
echo "Server: $SERVER"
echo "Scheduled time: Tomorrow at $RESTART_TIME"
echo ""

# Calculate tomorrow's date
TOMORROW=$(date -v+1d '+%Y-%m-%d' 2>/dev/null || date -d '+1 day' '+%Y-%m-%d')
echo "Date: $TOMORROW"
echo ""

# Copy scripts to server
echo "Step 1: Copying scripts to server..."
scp scripts/restart-with-resource-limits.sh ${SERVER}:/opt/manualmode-production/scripts/
scp scripts/monitor-dashboard.sh ${SERVER}:/opt/manualmode-production/scripts/
scp scripts/setup-swap.sh ${SERVER}:/opt/manualmode-production/scripts/

# Make scripts executable
ssh ${SERVER} 'chmod +x /opt/manualmode-production/scripts/*.sh'
echo "✓ Scripts copied and made executable"
echo ""

# Copy updated compose files
echo "Step 2: Copying updated compose files..."
scp podman-compose-production.yml ${SERVER}:/opt/manualmode-production/
scp podman-compose-staging.yml ${SERVER}:/opt/manualmode-staging/
echo "✓ Compose files updated"
echo ""

# Schedule the restart using at command (preferred) or cron
echo "Step 3: Scheduling restart job..."

# Try using 'at' command first (cleaner for one-time jobs)
if ssh ${SERVER} 'command -v at >/dev/null 2>&1'; then
    echo "Using 'at' command for one-time scheduling..."
    ssh ${SERVER} "echo 'bash /opt/manualmode-production/scripts/restart-with-resource-limits.sh' | at ${RESTART_TIME} tomorrow"
    
    echo ""
    echo "✓ Restart scheduled using 'at' command"
    echo ""
    echo "To view scheduled jobs on server:"
    echo "  ssh ${SERVER} 'atq'"
    echo ""
    echo "To remove the scheduled job:"
    echo "  ssh ${SERVER} 'atrm <job_number>'"
else
    # Fallback to cron if 'at' is not available
    echo "Using cron for scheduling (at command not available)..."
    
    # Create a one-time cron job that removes itself after execution
    CRON_COMMAND="0 6 * * * /bin/bash /opt/manualmode-production/scripts/restart-with-resource-limits.sh && (crontab -l | grep -v 'restart-with-resource-limits.sh' | crontab -)"
    
    ssh ${SERVER} "(crontab -l 2>/dev/null | grep -v 'restart-with-resource-limits.sh'; echo '${CRON_COMMAND}') | crontab -"
    
    echo ""
    echo "✓ Restart scheduled using cron (self-removing)"
    echo ""
    echo "To view scheduled cron jobs on server:"
    echo "  ssh ${SERVER} 'crontab -l'"
    echo ""
    echo "To manually remove the scheduled job:"
    echo "  ssh ${SERVER} 'crontab -e'"
fi

echo ""
echo "==========================================="
echo "✓ Scheduling Complete!"
echo "==========================================="
echo ""
echo "Summary:"
echo "  • Restart scheduled for: ${TOMORROW} at ${RESTART_TIME}"
echo "  • Script location: /opt/manualmode-production/scripts/restart-with-resource-limits.sh"
echo "  • Log will be saved to: /var/log/mc-restart-<timestamp>.log"
echo ""
echo "What will happen:"
echo "  1. Production containers restart with new resource limits"
echo "  2. Staging containers restart (if running)"
echo "  3. Health checks performed"
echo "  4. Resource usage logged"
echo ""
echo "To manually trigger restart now (testing):"
echo "  ssh ${SERVER} 'bash /opt/manualmode-production/scripts/restart-with-resource-limits.sh'"
echo ""
echo "To cancel scheduled restart:"
if ssh ${SERVER} 'command -v at >/dev/null 2>&1'; then
    echo "  ssh ${SERVER} 'atq'  # Find job number"
    echo "  ssh ${SERVER} 'atrm <job_number>'"
else
    echo "  ssh ${SERVER} 'crontab -e'  # Remove the line"
fi
echo ""

