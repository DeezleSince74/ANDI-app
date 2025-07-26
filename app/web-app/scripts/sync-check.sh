#!/bin/bash

# Web-App Schema Sync Check
# Quick check for schema synchronization from web-app directory
# Usage: ./scripts/sync-check.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Web-App Schema Sync Check${NC}"
echo -e "${BLUE}============================${NC}"
echo ""

# Check if we're in web-app directory
if [[ ! -f "package.json" ]] || [[ ! -d "src/db" ]]; then
    echo -e "${RED}❌ Error: Run this script from the web-app directory${NC}"
    echo -e "${YELLOW}Current directory: $(pwd)${NC}"
    echo -e "${YELLOW}Expected: app/web-app${NC}"
    exit 1
fi

# Check if global sync checker exists
GLOBAL_SYNC_CHECKER="../../scripts/check-schema-sync.sh"
if [[ -x "$GLOBAL_SYNC_CHECKER" ]]; then
    echo -e "${BLUE}🔄 Running global schema sync check...${NC}"
    echo ""
    
    # Run the global sync checker
    cd ../..
    ./scripts/check-schema-sync.sh
    cd app/web-app
else
    echo -e "${YELLOW}⚠️  Global sync checker not found${NC}"
    echo -e "${BLUE}📋 Manual checks:${NC}"
    
    # Check if synced schemas exist
    if [[ -d "src/db/schema/app-database-schemas" ]]; then
        schema_count=$(find src/db/schema/app-database-schemas -name "*.sql" | wc -l)
        echo -e "  📁 Synced schemas: ${GREEN}$schema_count files${NC}"
    else
        echo -e "  📁 Synced schemas: ${RED}Missing${NC}"
        echo -e "  ${YELLOW}Run sync from app-database: ./scripts/sync-to-web-app.sh${NC}"
    fi
    
    # Check if comprehensive schema exists
    if [[ -f "src/db/schema/200_app_database_comprehensive.sql" ]]; then
        echo -e "  📄 Comprehensive schema: ${GREEN}Present${NC}"
    else
        echo -e "  📄 Comprehensive schema: ${RED}Missing${NC}"
    fi
    
    # Check schema checksum
    if [[ -f "src/db/schema/.schema-checksum" ]]; then
        checksum=$(cat src/db/schema/.schema-checksum)
        echo -e "  🔒 Last sync checksum: ${GREEN}$checksum${NC}"
    else
        echo -e "  🔒 Sync checksum: ${RED}Not found${NC}"
    fi
fi

echo ""
echo -e "${BLUE}💡 Useful commands from web-app directory:${NC}"
echo -e "  Check sync status:    ${GREEN}./scripts/sync-check.sh${NC}"
echo -e "  Run migrations:       ${GREEN}npm run db:migrate${NC}"
echo -e "  Migration status:     ${GREEN}npx tsx src/db/migrate.ts status${NC}"
echo -e "  Global sync check:    ${GREEN}cd ../.. && ./scripts/check-schema-sync.sh${NC}"