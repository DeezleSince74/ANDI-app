#!/bin/bash

# Global Schema Sync Checker
# Runs from project root to check schema synchronization
# Usage: ./scripts/check-schema-sync.sh [--fix]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 ANDI Global Schema Sync Check${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Check if we're in the project root
if [[ ! -d "app/app-database" || ! -d "app/web-app" ]]; then
    echo -e "${RED}❌ Error: Run this script from the ANDI project root${NC}"
    echo -e "${YELLOW}Current directory: $(pwd)${NC}"
    exit 1
fi

# Check if app-database drift checker exists
DRIFT_CHECKER="app/app-database/scripts/check-schema-drift.sh"
if [[ ! -x "$DRIFT_CHECKER" ]]; then
    echo -e "${RED}❌ Error: Schema drift checker not found or not executable${NC}"
    echo -e "${YELLOW}Expected: $DRIFT_CHECKER${NC}"
    exit 1
fi

echo -e "${BLUE}📍 Project root: $(pwd)${NC}"
echo -e "${BLUE}🔍 Running schema drift detection...${NC}"
echo ""

# Run the drift checker from app-database
cd app/app-database
./scripts/check-schema-drift.sh "$@"

# Return to project root
cd ../..

echo ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo -e "  Check drift:     ${GREEN}./scripts/check-schema-sync.sh${NC}"
echo -e "  Auto-fix drift:  ${GREEN}./scripts/check-schema-sync.sh --fix${NC}"
echo -e "  Manual sync:     ${GREEN}cd app/app-database && ./scripts/sync-to-web-app.sh${NC}"
echo -e "  Run migration:   ${GREEN}cd app/web-app && npm run db:migrate${NC}"