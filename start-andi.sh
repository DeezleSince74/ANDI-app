#!/bin/bash

# ANDI Application Startup Script
# Orchestrates all components of the ANDI application for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/.pids"

# Default services to start
DEFAULT_SERVICES="database web-app"
SERVICES="${SERVICES:-$DEFAULT_SERVICES}"

# Environment
NODE_ENV="${NODE_ENV:-development}"
LOG_LEVEL="${LOG_LEVEL:-info}"

# Create necessary directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Utility functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Help function
show_help() {
    cat << EOF
ANDI Application Startup Script

Usage: $0 [OPTIONS] [SERVICES...]

Options:
    -h, --help              Show this help message
    -e, --env ENV           Set environment (development|staging|production)
    -s, --services LIST     Comma-separated list of services to start
    -d, --detached          Run services in detached mode
    -l, --logs              Show logs after startup
    -c, --clean             Clean start (remove existing containers/processes)
    --skip-health-check     Skip health checks
    --debug                 Enable debug logging

Services:
    database                PostgreSQL database and PgAdmin
    web-app                 Next.js web application (placeholder)
    api                     API services (placeholder)
    langflow                Langflow AI workflow engine (placeholder)
    data-warehouse          ClickHouse data warehouse (placeholder)
    monitoring              Monitoring and logging stack (placeholder)
    all                     Start all services

Examples:
    $0                      Start default services (database, web-app)
    $0 database             Start only the database
    $0 --services database,web-app --detached
    $0 --clean --env development all

Environment Variables:
    NODE_ENV                Environment (development|staging|production)
    SERVICES                Default services to start
    LOG_LEVEL               Logging level (debug|info|warn|error)
    ANDI_PORT               Web app port (default: 3000)
    POSTGRES_PORT           Database port (default: 5432)
    PGADMIN_PORT            PgAdmin port (default: 5050)

EOF
}

# Parse command line arguments
DETACHED=false
SHOW_LOGS=false
CLEAN_START=false
SKIP_HEALTH_CHECK=false
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -e|--env)
            NODE_ENV="$2"
            shift 2
            ;;
        -s|--services)
            SERVICES="$2"
            shift 2
            ;;
        -d|--detached)
            DETACHED=true
            shift
            ;;
        -l|--logs)
            SHOW_LOGS=true
            shift
            ;;
        -c|--clean)
            CLEAN_START=true
            shift
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        --debug)
            DEBUG=true
            LOG_LEVEL="debug"
            shift
            ;;
        *)
            # Treat as service names
            SERVICES="$SERVICES $1"
            shift
            ;;
    esac
done

# Set debug mode
if [[ "$DEBUG" == "true" ]]; then
    set -x
fi

# Convert comma-separated services to space-separated
SERVICES=$(echo "$SERVICES" | tr ',' ' ')

# Handle 'all' service
if [[ "$SERVICES" == *"all"* ]]; then
    SERVICES="database web-app api langflow data-warehouse monitoring"
fi

# Clean start if requested
if [[ "$CLEAN_START" == "true" ]]; then
    log "🧹 Cleaning existing containers and processes..."
    
    # Stop existing processes
    if [[ -d "$PID_DIR" ]]; then
        for pidfile in "$PID_DIR"/*.pid; do
            if [[ -f "$pidfile" ]]; then
                pid=$(cat "$pidfile")
                if kill -0 "$pid" 2>/dev/null; then
                    kill "$pid" 2>/dev/null || true
                fi
                rm -f "$pidfile"
            fi
        done
    fi
    
    # Clean Docker containers
    docker-compose -f app/app-database/docker-compose.yml down -v 2>/dev/null || true
    # Add other docker-compose cleanups as services are added
    
    success "Cleanup completed"
fi

# Startup banner
cat << 'EOF'
     _    _   _ ____ ___ 
    / \  | \ | |  _ \_ _|
   / _ \ |  \| | | | | | 
  / ___ \| |\  | |_| | | 
 /_/   \_\_| \_|____/___|
                        
 AI Instructional Coach Platform
 
EOF

log "Starting ANDI application..."
info "Environment: $NODE_ENV"
info "Services: $SERVICES"
info "Log Level: $LOG_LEVEL"

# Function to start database
start_database() {
    log "🗄️  Starting PostgreSQL database..."
    
    cd "$SCRIPT_DIR/app/app-database"
    
    # Check if .env exists
    if [[ ! -f ".env" ]]; then
        warning "Database .env file not found, copying from .env.example"
        cp .env.example .env
        warning "Please review and update app/app-database/.env with your configuration"
    fi
    
    # Start database services
    if [[ "$DETACHED" == "true" ]]; then
        make up > "$LOG_DIR/database.log" 2>&1 &
        echo $! > "$PID_DIR/database.pid"
    else
        make up
    fi
    
    # Health check
    if [[ "$SKIP_HEALTH_CHECK" != "true" ]]; then
        log "⏳ Waiting for database to be ready..."
        sleep 5
        
        local retries=30
        while ! make test-connection > /dev/null 2>&1 && [[ $retries -gt 0 ]]; do
            sleep 2
            ((retries--))
        done
        
        if [[ $retries -eq 0 ]]; then
            error "Database failed to start within timeout"
            return 1
        fi
        
        make health-check
    fi
    
    success "Database started successfully"
    info "PgAdmin: http://localhost:${PGADMIN_PORT:-5050}"
    
    cd "$SCRIPT_DIR"
}

# Function to start web application (placeholder)
start_web_app() {
    log "🌐 Starting Next.js web application..."
    
    # TODO: Implement when web-app is created
    warning "Web application not yet implemented"
    info "Placeholder: Will start Next.js app on port ${ANDI_PORT:-3000}"
    
    # Placeholder implementation:
    # cd "$SCRIPT_DIR/app/web-app"
    # if [[ ! -f ".env.local" ]]; then
    #     cp .env.example .env.local
    # fi
    # 
    # if [[ "$DETACHED" == "true" ]]; then
    #     npm run dev > "$LOG_DIR/web-app.log" 2>&1 &
    #     echo $! > "$PID_DIR/web-app.pid"
    # else
    #     npm run dev
    # fi
    
    success "Web application placeholder completed"
}

# Function to start API services (placeholder)
start_api() {
    log "🔌 Starting API services..."
    
    warning "API services not yet implemented"
    info "Placeholder: Will start Express.js API services"
    
    # TODO: Implement when API services are created
    success "API services placeholder completed"
}

# Function to start Langflow (placeholder)
start_langflow() {
    log "🤖 Starting Langflow AI workflow engine..."
    
    warning "Langflow integration not yet implemented"
    info "Placeholder: Will start Langflow for AI workflow management"
    
    # TODO: Implement Langflow integration
    success "Langflow placeholder completed"
}

# Function to start data warehouse (placeholder)
start_data_warehouse() {
    log "📊 Starting ClickHouse data warehouse..."
    
    warning "Data warehouse not yet implemented"
    info "Placeholder: Will start ClickHouse for analytics data"
    
    # TODO: Implement ClickHouse data warehouse
    success "Data warehouse placeholder completed"
}

# Function to start monitoring (placeholder)
start_monitoring() {
    log "📈 Starting monitoring and logging stack..."
    
    warning "Monitoring stack not yet implemented"
    info "Placeholder: Will start Grafana, Prometheus, and log aggregation"
    
    # TODO: Implement monitoring stack
    success "Monitoring placeholder completed"
}

# Start services
for service in $SERVICES; do
    case $service in
        database)
            start_database
            ;;
        web-app)
            start_web_app
            ;;
        api)
            start_api
            ;;
        langflow)
            start_langflow
            ;;
        data-warehouse)
            start_data_warehouse
            ;;
        monitoring)
            start_monitoring
            ;;
        *)
            error "Unknown service: $service"
            warning "Available services: database, web-app, api, langflow, data-warehouse, monitoring, all"
            ;;
    esac
done

# Show status summary
echo
log "📊 ANDI Application Status:"
echo "─────────────────────────────────────"

# Database status
if docker ps --format "table {{.Names}}" | grep -q "andi-postgres"; then
    success "Database: Running (PostgreSQL + PgAdmin)"
else
    warning "Database: Not running"
fi

# TODO: Add status checks for other services as they're implemented

echo "─────────────────────────────────────"

# Show access URLs
echo
info "🔗 Access URLs:"
echo "   Database (PgAdmin): http://localhost:${PGADMIN_PORT:-5050}"
echo "   Web App:           http://localhost:${ANDI_PORT:-3000} (coming soon)"
echo "   API Docs:          http://localhost:${API_PORT:-3001}/docs (coming soon)"

# Show logs if requested
if [[ "$SHOW_LOGS" == "true" && "$DETACHED" == "true" ]]; then
    echo
    log "📋 Following logs (Ctrl+C to stop)..."
    tail -f "$LOG_DIR"/*.log 2>/dev/null || true
fi

# Show useful commands
echo
info "💡 Useful commands:"
echo "   Stop all:          ./stop-andi.sh"
echo "   View logs:         tail -f logs/*.log"
echo "   Database CLI:      cd app/app-database && make psql"
echo "   Health check:      cd app/app-database && make health-check"

echo
success "🚀 ANDI application startup completed!"

# Keep script running if not detached and services were started
if [[ "$DETACHED" != "true" && "$SERVICES" != "" ]]; then
    echo
    log "Press Ctrl+C to stop all services..."
    
    # Set up signal handlers for graceful shutdown
    trap 'echo; log "Shutting down services..."; ./stop-andi.sh; exit 0' SIGINT SIGTERM
    
    # Wait indefinitely
    while true; do
        sleep 1
    done
fi