#!/bin/bash

# Database health check script for ANDI PostgreSQL

set -e

# Load environment variables
source .env

echo "Running database health check at $(date)"

# Function to run query
run_query() {
    local query="$1"
    if [ "${NODE_ENV}" = "production" ] && [ -n "${AZURE_POSTGRES_HOST}" ]; then
        PGPASSWORD="${AZURE_POSTGRES_PASSWORD}" psql \
            -h "${AZURE_POSTGRES_HOST}" \
            -U "${AZURE_POSTGRES_USER}" \
            -d "${AZURE_POSTGRES_DB}" \
            -p 5432 \
            -t -c "$query"
    else
        docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" andi-postgres psql \
            -U "${POSTGRES_USER}" \
            -d "${POSTGRES_DB}" \
            -t -c "$query"
    fi
}

# Check database connectivity
echo "1. Checking database connectivity..."
if run_query "SELECT 1" > /dev/null 2>&1; then
    echo "   ✓ Database is accessible"
else
    echo "   ✗ Database is not accessible"
    exit 1
fi

# Check schema existence
echo "2. Checking schemas..."
for schema in auth core analytics community gamification; do
    if run_query "SELECT 1 FROM information_schema.schemata WHERE schema_name = '$schema'" | grep -q 1; then
        echo "   ✓ Schema '$schema' exists"
    else
        echo "   ✗ Schema '$schema' is missing"
    fi
done

# Check table counts
echo "3. Checking table counts..."
TABLE_COUNT=$(run_query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('auth', 'core', 'analytics', 'community', 'gamification')")
echo "   Total tables: $TABLE_COUNT"

# Check critical tables
echo "4. Checking critical tables..."
CRITICAL_TABLES=(
    "auth.users"
    "core.schools"
    "core.teacher_profiles"
    "core.audio_sessions"
    "analytics.ciq_metrics"
)

for table in "${CRITICAL_TABLES[@]}"; do
    if run_query "SELECT 1 FROM information_schema.tables WHERE table_schema || '.' || table_name = '$table'" | grep -q 1; then
        ROW_COUNT=$(run_query "SELECT COUNT(*) FROM $table" | tr -d ' ')
        echo "   ✓ Table '$table' exists (rows: $ROW_COUNT)"
    else
        echo "   ✗ Table '$table' is missing"
    fi
done

# Check database size
echo "5. Checking database size..."
DB_SIZE=$(run_query "SELECT pg_size_pretty(pg_database_size('${POSTGRES_DB:-andi_db}'))")
echo "   Database size: $DB_SIZE"

# Check active connections
echo "6. Checking active connections..."
ACTIVE_CONN=$(run_query "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB:-andi_db}' AND state = 'active'")
echo "   Active connections: $ACTIVE_CONN"

# Check for blocking queries
echo "7. Checking for blocking queries..."
BLOCKING=$(run_query "SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event_type IS NOT NULL")
if [ "$BLOCKING" -eq 0 ]; then
    echo "   ✓ No blocking queries found"
else
    echo "   ⚠ Found $BLOCKING blocking queries"
fi

# Check replication status (if applicable)
echo "8. Checking replication status..."
REPLICATION=$(run_query "SELECT COUNT(*) FROM pg_stat_replication" 2>/dev/null || echo "0")
if [ "$REPLICATION" -gt 0 ]; then
    echo "   ✓ Replication is active ($REPLICATION replicas)"
else
    echo "   - No replication configured"
fi

echo ""
echo "Health check completed at $(date)"