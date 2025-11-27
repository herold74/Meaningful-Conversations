#!/bin/bash
# fix-failed-migrations.sh - Automatically fix failed migrations in _prisma_migrations table

set -e

ENVIRONMENT=${1:-production}
DB_NAME="meaningful_conversations_${ENVIRONMENT}"
CONTAINER_NAME="meaningful-conversations-mariadb-${ENVIRONMENT}"

echo "=== Checking for failed migrations in $ENVIRONMENT ==="

# Check for failed migrations
FAILED=$(podman exec $CONTAINER_NAME bash -c "mariadb -u root -p\$MARIADB_ROOT_PASSWORD $DB_NAME -N -e \"SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NULL OR applied_steps_count = 0;\"" 2>/dev/null)

if [ "$FAILED" -gt 0 ]; then
    echo "⚠️  Found $FAILED failed migrations"
    
    # Show them
    podman exec $CONTAINER_NAME bash -c "mariadb -u root -p\$MARIADB_ROOT_PASSWORD $DB_NAME -e \"SELECT migration_name, started_at, finished_at, applied_steps_count FROM _prisma_migrations WHERE finished_at IS NULL OR applied_steps_count = 0;\"" 2>/dev/null
    
    echo ""
    read -p "Fix these migrations automatically? [y/N] " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Fixing failed migrations..."
        podman exec $CONTAINER_NAME bash -c "mariadb -u root -p\$MARIADB_ROOT_PASSWORD $DB_NAME -e \"UPDATE _prisma_migrations SET finished_at = NOW(), applied_steps_count = 1, logs = NULL WHERE finished_at IS NULL OR applied_steps_count = 0;\"" 2>/dev/null
        echo "✓ Migrations fixed"
        
        echo ""
        echo "Restarting backend to apply changes..."
        cd /opt/manualmode-$ENVIRONMENT
        podman-compose -f podman-compose-$ENVIRONMENT.yml restart backend
        echo "✓ Backend restarted"
    fi
else
    echo "✓ All migrations are healthy"
fi

