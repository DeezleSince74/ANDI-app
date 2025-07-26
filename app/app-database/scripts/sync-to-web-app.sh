#!/bin/bash

# ANDI Schema Sync Script
# Synchronizes database schema from app-database to web-app
# Usage: ./scripts/sync-to-web-app.sh [--dry-run]

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
WEB_APP_DB_DIR="$PROJECT_ROOT/web-app/src/db"
WEB_APP_SCHEMA_DIR="$WEB_APP_DB_DIR/schema"

# Check if this is a dry run
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}🔍 DRY RUN MODE - No files will be modified${NC}"
fi

echo -e "${BLUE}🔄 ANDI Schema Sync${NC}"
echo -e "${BLUE}===================${NC}"
echo ""

# Function to log actions
log_action() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} $1"
    else
        echo -e "${GREEN}[SYNC]${NC} $1"
    fi
}

# Function to execute commands conditionally
execute_if_not_dry_run() {
    if [[ "$DRY_RUN" == "false" ]]; then
        eval "$1"
    fi
}

# Validation checks
echo -e "${BLUE}📋 Pre-sync validation...${NC}"

if [[ ! -d "$APP_DB_DIR/init" ]]; then
    echo -e "${RED}❌ Error: app-database/init directory not found${NC}"
    exit 1
fi

if [[ ! -d "$WEB_APP_DB_DIR" ]]; then
    echo -e "${RED}❌ Error: web-app/src/db directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Directory structure validated${NC}"

# Create backup of current web-app schema
BACKUP_DIR="$WEB_APP_SCHEMA_DIR/backups/$(date +%Y%m%d_%H%M%S)"
log_action "Creating backup at: $BACKUP_DIR"
execute_if_not_dry_run "mkdir -p '$BACKUP_DIR'"
execute_if_not_dry_run "cp -r '$WEB_APP_SCHEMA_DIR'/*.sql '$BACKUP_DIR'/ 2>/dev/null || true"

# Sync schema files from app-database
echo -e "\n${BLUE}📁 Syncing schema files...${NC}"

# Create or update comprehensive schema directory
APP_DB_SCHEMAS_DIR="$WEB_APP_SCHEMA_DIR/app-database-schemas"
log_action "Syncing app-database schemas to: $APP_DB_SCHEMAS_DIR"
execute_if_not_dry_run "mkdir -p '$APP_DB_SCHEMAS_DIR'"
execute_if_not_dry_run "cp -r '$APP_DB_DIR/init/'* '$APP_DB_SCHEMAS_DIR'/"

# Generate comprehensive schema file from app-database
COMPREHENSIVE_SCHEMA="$WEB_APP_SCHEMA_DIR/200_app_database_comprehensive.sql"
log_action "Generating comprehensive schema: $COMPREHENSIVE_SCHEMA"

if [[ "$DRY_RUN" == "false" ]]; then
    cat > "$COMPREHENSIVE_SCHEMA" << 'EOF'
-- ANDI Comprehensive Database Schema
-- Auto-generated from app-database
-- DO NOT EDIT MANUALLY - Use app-database as source of truth

-- This file is automatically synchronized from app-database/init/
-- Last sync: $(date)
-- Source: app-database/init/*.sql

EOF

    # Append all init files in order
    for file in "$APP_DB_DIR/init/"*.sql; do
        if [[ -f "$file" ]]; then
            echo "" >> "$COMPREHENSIVE_SCHEMA"
            echo "-- =============================================================================" >> "$COMPREHENSIVE_SCHEMA"
            echo "-- Source: $(basename "$file")" >> "$COMPREHENSIVE_SCHEMA" 
            echo "-- =============================================================================" >> "$COMPREHENSIVE_SCHEMA"
            echo "" >> "$COMPREHENSIVE_SCHEMA"
            cat "$file" >> "$COMPREHENSIVE_SCHEMA"
        fi
    done
fi

# Update migration file list in web-app
MIGRATE_FILE="$WEB_APP_DB_DIR/migrate.ts"
log_action "Updating migration file list in: $MIGRATE_FILE"

if [[ "$DRY_RUN" == "false" && -f "$MIGRATE_FILE" ]]; then
    # Create a backup of the migrate file
    cp "$MIGRATE_FILE" "$MIGRATE_FILE.backup"
    
    # Update the MIGRATION_FILES array to include the new comprehensive schema
    sed -i.bak 's/const MIGRATION_FILES = \[/const MIGRATION_FILES = [/' "$MIGRATE_FILE"
    
    # Check if comprehensive schema is already in the list
    if ! grep -q "200_app_database_comprehensive.sql" "$MIGRATE_FILE"; then
        # Add the comprehensive schema to the migration files list
        sed -i.bak '/100_comprehensive_schema.sql/a\
  '\''200_app_database_comprehensive.sql'\'','  "$MIGRATE_FILE"
    fi
    
    # Clean up backup file
    rm -f "$MIGRATE_FILE.bak"
fi

# Generate updated TypeScript types
echo -e "\n${BLUE}📝 Updating TypeScript types...${NC}"

TYPES_FILE="$WEB_APP_DB_DIR/types.ts"
TEMP_TYPES_FILE="$WEB_APP_DB_DIR/types_new.ts"

log_action "Analyzing schema changes for type generation"

if [[ "$DRY_RUN" == "false" ]]; then
    # Read current types file to preserve custom types
    if [[ -f "$TYPES_FILE" ]]; then
        # Extract the existing types section
        sed -n '1,/^\/\/ =============================================================================$/p' "$TYPES_FILE" > "$TEMP_TYPES_FILE"
        echo "// ENHANCED TYPES FROM APP-DATABASE INTEGRATION" >> "$TEMP_TYPES_FILE"
        echo "// Auto-synced on $(date)" >> "$TEMP_TYPES_FILE"
        echo "// =============================================================================" >> "$TEMP_TYPES_FILE"
        
        # Add basic app-database types (this could be enhanced with a proper parser)
        cat >> "$TEMP_TYPES_FILE" << 'EOF'

// Core app-database schema types
export interface District {
  id: string;
  name: string;
  state: string;
  contact_email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface School {
  id: string;
  name: string;
  district_id?: string;
  school_type: SchoolType;
  address?: string;
  principal_name?: string;
  contact_email?: string;
  created_at: Date;
  updated_at: Date;
}

// Additional types would be generated here by a proper schema parser
// For now, maintaining existing comprehensive types from previous integration

EOF
        
        # Append the rest of the existing types (custom additions)
        sed -n '/^\/\/ ENHANCED TYPES FROM APP-DATABASE INTEGRATION$/,$p' "$TYPES_FILE" >> "$TEMP_TYPES_FILE"
        
        # Replace the original file
        mv "$TEMP_TYPES_FILE" "$TYPES_FILE"
    fi
fi

# Generate sync report
echo -e "\n${BLUE}📊 Sync Report${NC}"
echo -e "${BLUE}===============${NC}"

# Count schema files
SCHEMA_FILE_COUNT=$(find "$APP_DB_DIR/init" -name "*.sql" | wc -l)
echo -e "📄 Schema files synced: ${GREEN}$SCHEMA_FILE_COUNT${NC}"

# Check for app-database migrations
if [[ -d "$APP_DB_DIR/migrations/versions" ]]; then
    MIGRATION_COUNT=$(find "$APP_DB_DIR/migrations/versions" -name "*.sql" | wc -l)
    echo -e "🔄 Available migrations: ${GREEN}$MIGRATION_COUNT${NC}"
    
    if [[ $MIGRATION_COUNT -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Note: ${MIGRATION_COUNT} migration(s) found in app-database/migrations/versions/${NC}"
        echo -e "${YELLOW}   Consider applying these migrations to keep schemas in sync${NC}"
    fi
fi

# Generate checksum for drift detection
SCHEMA_CHECKSUM=$(find "$APP_DB_DIR/init" -name "*.sql" -exec cat {} \; | sha256sum | cut -d' ' -f1)
echo -e "🔒 Schema checksum: ${GREEN}$SCHEMA_CHECKSUM${NC}"

# Save checksum for drift detection
CHECKSUM_FILE="$WEB_APP_SCHEMA_DIR/.schema-checksum"
execute_if_not_dry_run "echo '$SCHEMA_CHECKSUM' > '$CHECKSUM_FILE'"

# Instructions for next steps
echo -e "\n${BLUE}📋 Next Steps${NC}"
echo -e "${BLUE}==============${NC}"
echo -e "1. Review the synced schema changes in web-app"
echo -e "2. Run database migrations: ${GREEN}cd web-app && npm run db:migrate${NC}"
echo -e "3. Test the application: ${GREEN}npm run dev${NC}"
echo -e "4. Commit the synchronized changes to version control"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "\n${YELLOW}This was a dry run. To apply changes, run: ./scripts/sync-to-web-app.sh${NC}"
else
    echo -e "\n${GREEN}✅ Schema sync completed successfully!${NC}"
fi

echo -e "\n${BLUE}📚 Backup Location${NC}: $BACKUP_DIR"
echo -e "${BLUE}🔍 Schema Checksum${NC}: $SCHEMA_CHECKSUM"