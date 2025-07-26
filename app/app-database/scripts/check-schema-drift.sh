#!/bin/bash

# ANDI Schema Drift Detection Script
# Checks for differences between app-database and web-app schemas
# Usage: ./scripts/check-schema-drift.sh [--fix]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DB_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$APP_DB_DIR")"
WEB_APP_SCHEMA_DIR="$PROJECT_ROOT/web-app/src/db/schema"
CHECKSUM_FILE="$WEB_APP_SCHEMA_DIR/.schema-checksum"

# Check if auto-fix is requested
AUTO_FIX=false
if [[ "$1" == "--fix" ]]; then
    AUTO_FIX=true
fi

echo -e "${BLUE}🔍 ANDI Schema Drift Detection${NC}"
echo -e "${BLUE}===============================${NC}"
echo ""

# Function to calculate schema checksum
calculate_app_db_checksum() {
    if [[ -d "$APP_DB_DIR/init" ]]; then
        find "$APP_DB_DIR/init" -name "*.sql" -exec cat {} \; | sha256sum | cut -d' ' -f1
    else
        echo "ERROR: app-database init directory not found"
        exit 1
    fi
}

calculate_web_app_checksum() {
    if [[ -d "$WEB_APP_SCHEMA_DIR/app-database-schemas" ]]; then
        find "$WEB_APP_SCHEMA_DIR/app-database-schemas" -name "*.sql" -exec cat {} \; | sha256sum | cut -d' ' -f1
    else
        echo "00000000000000000000000000000000" # Empty checksum if no synced schemas
    fi
}

# Calculate current checksums
echo -e "${BLUE}📊 Calculating schema checksums...${NC}"

APP_DB_CHECKSUM=$(calculate_app_db_checksum)
WEB_APP_CHECKSUM=$(calculate_web_app_checksum)

echo -e "🏗️  App-Database checksum: ${GREEN}$APP_DB_CHECKSUM${NC}"
echo -e "🌐 Web-App checksum:      ${GREEN}$WEB_APP_CHECKSUM${NC}"

# Read stored checksum if available
STORED_CHECKSUM=""
if [[ -f "$CHECKSUM_FILE" ]]; then
    STORED_CHECKSUM=$(cat "$CHECKSUM_FILE")
    echo -e "💾 Stored checksum:       ${GREEN}$STORED_CHECKSUM${NC}"
fi

echo ""

# Check for drift
DRIFT_DETECTED=false
NEVER_SYNCED=false

if [[ "$APP_DB_CHECKSUM" != "$WEB_APP_CHECKSUM" ]]; then
    DRIFT_DETECTED=true
    
    if [[ "$WEB_APP_CHECKSUM" == "00000000000000000000000000000000" ]]; then
        NEVER_SYNCED=true
        echo -e "${YELLOW}⚠️  Schema has never been synced from app-database${NC}"
    else
        echo -e "${RED}🚨 Schema drift detected!${NC}"
    fi
else
    echo -e "${GREEN}✅ Schemas are in sync${NC}"
fi

# Additional drift checks
echo -e "\n${BLUE}🔬 Detailed drift analysis...${NC}"

# Check if app-database has newer migrations
if [[ -d "$APP_DB_DIR/migrations/versions" ]]; then
    MIGRATION_COUNT=$(find "$APP_DB_DIR/migrations/versions" -name "*.sql" | wc -l)
    
    if [[ $MIGRATION_COUNT -gt 0 ]]; then
        echo -e "${YELLOW}📋 Found $MIGRATION_COUNT pending migration(s) in app-database${NC}"
        
        # List recent migrations
        echo -e "${BLUE}Recent migrations:${NC}"
        find "$APP_DB_DIR/migrations/versions" -name "*.sql" -printf "%T@ %f\n" | sort -n | tail -5 | while read timestamp filename; do
            date_str=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M")
            echo -e "  📄 $filename (${date_str})"
        done
    fi
fi

# Check for differences in specific files
if [[ -d "$WEB_APP_SCHEMA_DIR/app-database-schemas" && -d "$APP_DB_DIR/init" ]]; then
    echo -e "\n${BLUE}📁 File comparison:${NC}"
    
    # Compare individual files
    for app_db_file in "$APP_DB_DIR/init"/*.sql; do
        if [[ -f "$app_db_file" ]]; then
            filename=$(basename "$app_db_file")
            web_app_file="$WEB_APP_SCHEMA_DIR/app-database-schemas/$filename"
            
            if [[ -f "$web_app_file" ]]; then
                if ! diff -q "$app_db_file" "$web_app_file" > /dev/null 2>&1; then
                    echo -e "  📄 ${RED}$filename${NC} - ${RED}Different${NC}"
                else
                    echo -e "  📄 ${GREEN}$filename${NC} - ${GREEN}Identical${NC}"
                fi
            else
                echo -e "  📄 ${YELLOW}$filename${NC} - ${YELLOW}Missing in web-app${NC}"
            fi
        fi
    done
    
    # Check for files only in web-app
    for web_app_file in "$WEB_APP_SCHEMA_DIR/app-database-schemas"/*.sql; do
        if [[ -f "$web_app_file" ]]; then
            filename=$(basename "$web_app_file")
            app_db_file="$APP_DB_DIR/init/$filename"
            
            if [[ ! -f "$app_db_file" ]]; then
                echo -e "  📄 ${YELLOW}$filename${NC} - ${YELLOW}Only in web-app${NC}"
            fi
        fi
    done
fi

# Summary and recommendations
echo -e "\n${BLUE}📋 Summary${NC}"
echo -e "${BLUE}==========${NC}"

if [[ "$DRIFT_DETECTED" == "true" ]]; then
    if [[ "$NEVER_SYNCED" == "true" ]]; then
        echo -e "${YELLOW}🎯 Status: Initial sync required${NC}"
        echo -e "${BLUE}📋 Recommendation: Run sync to establish baseline${NC}"
    else
        echo -e "${RED}🎯 Status: Schema drift detected${NC}"
        echo -e "${BLUE}📋 Recommendation: Sync schemas to resolve drift${NC}"
    fi
    
    echo -e "\n${BLUE}🔧 To fix schema drift:${NC}"
    echo -e "1. Review changes: ${GREEN}./scripts/sync-to-web-app.sh --dry-run${NC}"
    echo -e "2. Apply sync: ${GREEN}./scripts/sync-to-web-app.sh${NC}"
    echo -e "3. Test changes: ${GREEN}cd ../web-app && npm run db:migrate${NC}"
    
    if [[ "$AUTO_FIX" == "true" ]]; then
        echo -e "\n${YELLOW}🔧 Auto-fixing schema drift...${NC}"
        "$SCRIPT_DIR/sync-to-web-app.sh"
        
        # Recalculate checksums
        NEW_WEB_APP_CHECKSUM=$(calculate_web_app_checksum)
        if [[ "$APP_DB_CHECKSUM" == "$NEW_WEB_APP_CHECKSUM" ]]; then
            echo -e "${GREEN}✅ Schema drift automatically resolved!${NC}"
        else
            echo -e "${RED}❌ Auto-fix failed - manual intervention required${NC}"
            exit 1
        fi
    fi
    
    exit 1
else
    echo -e "${GREEN}🎯 Status: Schemas are synchronized${NC}"
    echo -e "${GREEN}📋 Recommendation: No action needed${NC}"
    
    # Update stored checksum
    echo "$APP_DB_CHECKSUM" > "$CHECKSUM_FILE"
    exit 0
fi