#!/bin/bash

# ANDI Application Stop Script
# Gracefully stops all ANDI application components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Default services to stop
DEFAULT_SERVICES="all"
SERVICES="${1:-$DEFAULT_SERVICES}"

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

# Help function
show_help() {
    cat << EOF
ANDI Application Stop Script

Usage: $0 [SERVICES...]

Options:
    -h, --help              Show this help message
    --force                 Force stop (kill processes)

Services:
    database                Stop PostgreSQL database and PgAdmin
    data-warehouse          Stop ClickHouse data warehouse
    data-pipelines          Stop Airflow ETL data pipelines
    web-app                 Stop Next.js web application
    api                     Stop API services
    langflow                Stop Langflow AI workflow engine
    all                     Stop all services (default)

Examples:
    $0                      Stop all services
    $0 database             Stop only the database
    $0 web-app api          Stop web app and API services
    $0 --force              Force stop all services

EOF
}

# Parse arguments
FORCE_STOP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --force)
            FORCE_STOP=true
            shift
            ;;
        *)
            SERVICES="$SERVICES $1"
            shift
            ;;
    esac
done

# Handle 'all' service
if [[ "$SERVICES" == *"all"* ]]; then
    SERVICES="data-pipelines data-warehouse langflow api web-app database"
fi

log "🛑 Stopping ANDI application services..."

# Function to stop process by PID file
stop_process() {
    local service_name="$1"
    local pid_file="$PID_DIR/$service_name.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        
        if kill -0 "$pid" 2>/dev/null; then
            log "Stopping $service_name (PID: $pid)..."
            
            if [[ "$FORCE_STOP" == "true" ]]; then
                kill -KILL "$pid" 2>/dev/null || true
            else
                kill -TERM "$pid" 2>/dev/null || true
                
                # Wait for graceful shutdown
                local retries=30
                while kill -0 "$pid" 2>/dev/null && [[ $retries -gt 0 ]]; do
                    sleep 1
                    ((retries--))
                done
                
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    warning "Graceful shutdown timeout, force killing $service_name"
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            fi
            
            success "$service_name stopped"
        else
            warning "$service_name PID file exists but process not running"
        fi
        
        rm -f "$pid_file"
    else
        log "$service_name PID file not found, checking for running processes..."
    fi
}

# Function to stop database
stop_database() {
    log "🗄️  Stopping PostgreSQL database..."
    
    stop_process "database"
    
    # Stop Docker containers
    cd "$SCRIPT_DIR/app/app-database"
    
    if docker-compose ps | grep -q "andi-postgres\|andi-pgadmin"; then
        if [[ "$FORCE_STOP" == "true" ]]; then
            docker-compose kill
        else
            docker-compose stop
        fi
        success "Database containers stopped"
    else
        log "Database containers not running"
    fi
    
    cd "$SCRIPT_DIR"
}

# Function to stop web application
stop_web_app() {
    log "🌐 Stopping Next.js web application..."
    
    stop_process "web-app"
    
    # Kill any Node.js processes on the web app port
    local web_port="${ANDI_PORT:-3000}"
    local pid=$(lsof -ti:$web_port 2>/dev/null | head -n1)
    
    if [[ -n "$pid" ]]; then
        log "Found web app process on port $web_port (PID: $pid)"
        if [[ "$FORCE_STOP" == "true" ]]; then
            kill -KILL "$pid" 2>/dev/null || true
        else
            kill -TERM "$pid" 2>/dev/null || true
            
            # Wait for graceful shutdown
            local retries=10
            while kill -0 "$pid" 2>/dev/null && [[ $retries -gt 0 ]]; do
                sleep 1
                ((retries--))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                warning "Graceful shutdown timeout, force killing web app"
                kill -KILL "$pid" 2>/dev/null || true
            fi
        fi
        success "Web application stopped"
    else
        log "No web application process found on port $web_port"
    fi
}

# Function to stop API services (placeholder)
stop_api() {
    log "🔌 Stopping API services..."
    
    stop_process "api"
    
    # TODO: Add API specific cleanup when implemented
    local api_port="${API_PORT:-3001}"
    local pid=$(lsof -ti:$api_port 2>/dev/null | head -n1)
    
    if [[ -n "$pid" ]]; then
        log "Found API process on port $api_port (PID: $pid)"
        if [[ "$FORCE_STOP" == "true" ]]; then
            kill -KILL "$pid" 2>/dev/null || true
        else
            kill -TERM "$pid" 2>/dev/null || true
        fi
        success "API services stopped"
    else
        log "No API process found on port $api_port"
    fi
}

# Function to stop Langflow AI workflow engine
stop_langflow() {
    log "🤖 Stopping Langflow AI workflow engine..."
    
    stop_process "langflow"
    
    # Stop Docker containers
    cd "$SCRIPT_DIR/app/langflow"
    
    if docker-compose -f docker-compose.dev.yml ps | grep -q "andi-langflow-dev\|andi-langflow-postgres-dev"; then
        if [[ "$FORCE_STOP" == "true" ]]; then
            docker-compose -f docker-compose.dev.yml kill
        else
            docker-compose -f docker-compose.dev.yml down
        fi
        success "Langflow containers stopped"
    else
        log "Langflow containers not running"
    fi
    
    cd "$SCRIPT_DIR"
}

# Function to stop data warehouse
stop_data_warehouse() {
    log "📊 Stopping ClickHouse data warehouse..."
    
    stop_process "data-warehouse"
    
    # Stop Docker containers
    cd "$SCRIPT_DIR/app/data-warehouse"
    
    if docker-compose ps | grep -q "andi-clickhouse-warehouse\|andi-grafana-warehouse"; then
        if [[ "$FORCE_STOP" == "true" ]]; then
            docker-compose kill
        else
            docker-compose stop
        fi
        success "Data warehouse containers stopped"
    else
        log "Data warehouse containers not running"
    fi
    
    cd "$SCRIPT_DIR"
}

# Function to stop data pipelines
stop_data_pipelines() {
    log "🔄 Stopping Airflow ETL data pipelines..."
    
    stop_process "data-pipelines"
    
    # Stop Docker containers
    cd "$SCRIPT_DIR/app/data-pipelines"
    
    if docker-compose ps | grep -q "airflow-"; then
        if [[ "$FORCE_STOP" == "true" ]]; then
            docker-compose kill
        else
            docker-compose stop
        fi
        success "Data pipelines containers stopped"
    else
        log "Data pipelines containers not running"
    fi
    
    cd "$SCRIPT_DIR"
}

# Stop services (in reverse order for dependencies)
for service in $SERVICES; do
    case $service in
        data-pipelines)
            stop_data_pipelines
            ;;
        data-warehouse)
            stop_data_warehouse
            ;;
        langflow)
            stop_langflow
            ;;
        api)
            stop_api
            ;;
        web-app)
            stop_web_app
            ;;
        database)
            stop_database
            ;;
        *)
            error "Unknown service: $service"
            warning "Available services: database, data-warehouse, data-pipelines, web-app, api, langflow, all"
            ;;
    esac
done

# Clean up PID directory if empty
if [[ -d "$PID_DIR" ]] && [[ -z "$(ls -A "$PID_DIR")" ]]; then
    rmdir "$PID_DIR"
fi

# Clean up any orphaned processes
if [[ "$FORCE_STOP" == "true" ]]; then
    log "🧹 Cleaning up orphaned processes..."
    
    # Kill any remaining ANDI-related processes
    pkill -f "andi" 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    pkill -f "node.*andi" 2>/dev/null || true
fi

echo
success "🏁 ANDI application stopped successfully!"

# Show final status
log "📊 Final Status:"
echo "─────────────────────────────────────"

# Check if any containers are still running
if docker ps --format "table {{.Names}}" | grep -q "andi-"; then
    warning "Some ANDI containers are still running:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep "andi-" || true
    echo "   Run: docker-compose down -v (in app/app-database) to force stop"
else
    success "All ANDI containers stopped"
fi

# Check for any remaining processes on known ports
local ports=("${ANDI_PORT:-3000}" "${API_PORT:-3001}" "${POSTGRES_PORT:-5432}" "${PGADMIN_PORT:-5050}" "8123" "8080" "9090")
local running_ports=()

for port in "${ports[@]}"; do
    if lsof -ti:$port >/dev/null 2>&1; then
        running_ports+=("$port")
    fi
done

if [[ ${#running_ports[@]} -gt 0 ]]; then
    warning "Processes still running on ports: ${running_ports[*]}"
    echo "   Run: $0 --force to force stop all processes"
else
    success "All known ports are free"
fi

echo "─────────────────────────────────────"