#!/bin/bash

# ANDI Database Health Check Script
# Enhanced with app-database operational features

set -e

echo "🏥 ANDI Database Health Check"
echo "=============================="

# Database connection parameters
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-andi_db}
DB_USER=${POSTGRES_USER:-andi_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-andi_dev_password}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run SQL and get result
run_sql() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "$1" 2>/dev/null
}

# Function to check if database is accessible
check_connection() {
    echo -n "📡 Database Connection: "
    if run_sql "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Connected${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Function to check database version
check_version() {
    echo -n "🏷️  PostgreSQL Version: "
    version=$(run_sql "SELECT version();" | head -1 | xargs)
    echo -e "${BLUE}$version${NC}"
}

# Function to check database size
check_database_size() {
    echo -n "💾 Database Size: "
    size=$(run_sql "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
    echo -e "${BLUE}$size${NC}"
}

# Function to check active connections
check_connections() {
    echo -n "🔗 Active Connections: "
    active=$(run_sql "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
    total=$(run_sql "SELECT count(*) FROM pg_stat_activity;" | xargs)
    echo -e "${BLUE}$active active / $total total${NC}"
}

# Function to check schemas
check_schemas() {
    echo "🏗️  Database Schemas:"
    schemas=$(run_sql "SELECT schemaname FROM pg_tables WHERE schemaname IN ('public', 'auth', 'core', 'analytics', 'community', 'gamification') GROUP BY schemaname ORDER BY schemaname;")
    
    for schema in $schemas; do
        table_count=$(run_sql "SELECT count(*) FROM pg_tables WHERE schemaname = '$schema';" | xargs)
        echo -e "   📁 $schema: ${BLUE}$table_count tables${NC}"
    done
}

# Function to check key tables
check_key_tables() {
    echo "📋 Key Tables Status:"
    
    # Check NextAuth tables
    tables=("andi_web_user" "andi_web_account" "andi_web_session" "andi_web_recording_session" "andi_web_ai_job")
    
    for table in "${tables[@]}"; do
        if run_sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" | grep -q 't'; then
            count=$(run_sql "SELECT count(*) FROM $table;" | xargs)
            echo -e "   📄 $table: ${GREEN}✓ exists${NC} (${BLUE}$count rows${NC})"
        else
            echo -e "   📄 $table: ${RED}✗ missing${NC}"
        fi
    done
}

# Function to check recent activity
check_recent_activity() {
    echo "📈 Recent Activity:"
    
    # Check recent recordings
    recent_recordings=$(run_sql "SELECT count(*) FROM andi_web_recording_session WHERE created_at > NOW() - INTERVAL '24 hours';" 2>/dev/null | xargs || echo "0")
    echo -e "   🎙️  Recordings (24h): ${BLUE}$recent_recordings${NC}"
    
    # Check recent AI jobs
    recent_jobs=$(run_sql "SELECT count(*) FROM andi_web_ai_job WHERE created_at > NOW() - INTERVAL '24 hours';" 2>/dev/null | xargs || echo "0")
    echo -e "   🤖 AI Jobs (24h): ${BLUE}$recent_jobs${NC}"
    
    # Check recent users
    recent_users=$(run_sql "SELECT count(*) FROM andi_web_user WHERE created_at > NOW() - INTERVAL '7 days';" 2>/dev/null | xargs || echo "0")
    echo -e "   👥 New Users (7d): ${BLUE}$recent_users${NC}"
}

# Function to check for long-running queries
check_long_queries() {
    echo "⏱️  Long Running Queries:"
    long_queries=$(run_sql "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';" | xargs)
    
    if [ "$long_queries" -gt 0 ]; then
        echo -e "   ${YELLOW}⚠️  $long_queries queries running > 5 minutes${NC}"
    else
        echo -e "   ${GREEN}✓ No long-running queries${NC}"
    fi
}

# Function to check migrations status
check_migrations() {
    echo "🔄 Migrations Status:"
    
    if run_sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schema_migrations');" | grep -q 't'; then
        migration_count=$(run_sql "SELECT count(*) FROM schema_migrations;" | xargs)
        latest_migration=$(run_sql "SELECT filename FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;" | xargs)
        echo -e "   📋 Applied: ${GREEN}$migration_count migrations${NC}"
        echo -e "   📄 Latest: ${BLUE}$latest_migration${NC}"
    else
        echo -e "   ${RED}✗ No migrations table found${NC}"
    fi
}

# Function to check disk space (if running locally)  
check_disk_space() {
    echo "💽 Storage Information:"
    
    # Get database directory (approximate)
    data_location=$(run_sql "SHOW data_directory;" 2>/dev/null | xargs || echo "Unknown")
    echo -e "   📂 Data Directory: ${BLUE}$data_location${NC}"
    
    # Check if we can get disk usage
    if command -v df > /dev/null && [ "$data_location" != "Unknown" ]; then
        disk_usage=$(df -h "$data_location" 2>/dev/null | tail -1 | awk '{print $5}' || echo "N/A")
        echo -e "   📊 Disk Usage: ${BLUE}$disk_usage${NC}"
    fi
}

# Main health check function
main() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting health check..."
    echo ""
    
    # Core checks
    if ! check_connection; then
        echo -e "${RED}❌ Cannot connect to database. Exiting.${NC}"
        exit 1
    fi
    
    check_version
    check_database_size
    check_connections
    echo ""
    
    check_schemas
    echo ""
    
    check_key_tables
    echo ""
    
    check_recent_activity
    echo ""
    
    check_long_queries
    echo ""
    
    check_migrations
    echo ""
    
    check_disk_space
    echo ""
    
    echo -e "${GREEN}✅ Health check complete!${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Health check finished"
}

# Run the health check
main