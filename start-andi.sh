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
    database                PostgreSQL database
    data-warehouse          ClickHouse data warehouse with Grafana & Prometheus
    data-pipelines          Airflow ETL orchestration with monitoring
    web-app                 Next.js web application with Auth.js
    api                     API services (placeholder)
    ollama                  Local LLM server with Meta Llama models
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
    SERVICES="database data-warehouse data-pipelines web-app api ollama"
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
    docker-compose -f app/data-warehouse/docker-compose.yml down -v 2>/dev/null || true
    docker-compose -f app/data-pipelines/docker-compose.yml down -v 2>/dev/null || true
    docker-compose -f app/open-llm-app/docker-compose.yml down -v 2>/dev/null || true
    docker-compose -f app/web-app/docker-compose.yml down -v 2>/dev/null || true
    
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
    
    cd "$SCRIPT_DIR"
}

# Function to start web application
start_web_app() {
    log "🌐 Starting Next.js web application (containerized)..."
    
    cd "$SCRIPT_DIR/app/web-app"
    
    # Check if .env.local exists
    if [[ ! -f ".env.local" ]]; then
        warning "Web app .env.local file not found, copying from .env.example"
        if [[ -f ".env.example" ]]; then
            cp .env.example .env.local
        fi
        warning "Please review and update app/web-app/.env.local with your configuration"
    fi
    
    # Start web application using docker-compose
    if [[ "$DETACHED" == "true" ]]; then
        docker-compose up -d > "$LOG_DIR/web-app.log" 2>&1
    else
        docker-compose up
    fi
    
    # Health check
    if [[ "$SKIP_HEALTH_CHECK" != "true" ]]; then
        log "⏳ Waiting for containerized web app to be ready..."
        sleep 15
        
        local retries=45
        while ! curl -s http://localhost:${ANDI_PORT:-3000} > /dev/null 2>&1 && [[ $retries -gt 0 ]]; do
            sleep 2
            ((retries--))
        done
        
        if [[ $retries -eq 0 ]]; then
            error "Web application failed to start within timeout"
            return 1
        fi
    fi
    
    success "Web application started successfully"
    info "Web App: http://localhost:${ANDI_PORT:-3000}"
    info "Built with Next.js 15 + Auth.js + TypeScript (Containerized)"
    
    cd "$SCRIPT_DIR"
}

# Function to start API services (placeholder)
start_api() {
    log "🔌 Starting API services..."
    
    warning "API services not yet implemented"
    info "Placeholder: Will start Express.js API services"
    
    # TODO: Implement when API services are created
    success "API services placeholder completed"
}


# Function to start Ollama local LLM server
start_ollama() {
    log "🤖 Starting Ollama local LLM server..."
    
    cd "$SCRIPT_DIR/app/open-llm-app"
    
    # Check if .env exists
    if [[ ! -f ".env" ]]; then
        warning "Ollama .env file not found, copying from .env.example"
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
        fi
        warning "Please review and update app/open-llm-app/.env with your configuration"
    fi
    
    # Check for GPU support
    if command -v nvidia-smi > /dev/null 2>&1; then
        log "🎮 NVIDIA GPU detected, starting with GPU support..."
        OLLAMA_MODE="gpu"
    else
        log "💻 No GPU detected, starting in CPU mode..."
        OLLAMA_MODE="cpu"
    fi
    
    # Start Ollama services
    if [[ "$DETACHED" == "true" ]]; then
        make $OLLAMA_MODE > "$LOG_DIR/ollama.log" 2>&1 &
        echo $! > "$PID_DIR/ollama.pid"
    else
        make $OLLAMA_MODE
    fi
    
    # Health check
    if [[ "$SKIP_HEALTH_CHECK" != "true" ]]; then
        log "⏳ Waiting for Ollama to be ready..."
        sleep 10
        
        local retries=30
        while ! curl -s http://localhost:11434/api/version > /dev/null 2>&1 && [[ $retries -gt 0 ]]; do
            sleep 3
            ((retries--))
        done
        
        if [[ $retries -eq 0 ]]; then
            error "Ollama failed to start within timeout"
            return 1
        fi
        
        # Check health via make command
        cd "$SCRIPT_DIR/app/open-llm-app" && make health > /dev/null 2>&1
    fi
    
    success "Ollama started successfully"
    info "Ollama API: http://localhost:11434"
    info "Available models: llama3.1:8b, llama3.1:7b-instruct, llama3.2:3b"
    info "Setup ANDI models: cd app/open-llm-app && make setup-models"
    
    cd "$SCRIPT_DIR"
}

# Function to start data warehouse
start_data_warehouse() {
    log "📊 Starting ClickHouse data warehouse..."
    
    cd "$SCRIPT_DIR/app/data-warehouse"
    
    # Check if .env exists
    if [[ ! -f ".env" ]]; then
        warning "Data warehouse .env file not found, copying from .env.example"
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
        fi
        warning "Please review and update data-warehouse/.env with your configuration"
    fi
    
    # Start data warehouse services
    if [[ "$DETACHED" == "true" ]]; then
        make up > "$LOG_DIR/data-warehouse.log" 2>&1 &
        echo $! > "$PID_DIR/data-warehouse.pid"
    else
        make up
    fi
    
    # Health check
    if [[ "$SKIP_HEALTH_CHECK" != "true" ]]; then
        log "⏳ Waiting for data warehouse to be ready..."
        sleep 10
        
        local retries=30
        while ! curl -s http://localhost:8123/ping > /dev/null 2>&1 && [[ $retries -gt 0 ]]; do
            sleep 3
            ((retries--))
        done
        
        if [[ $retries -eq 0 ]]; then
            error "Data warehouse failed to start within timeout"
            return 1
        fi
        
        make health
    fi
    
    success "Data warehouse started successfully"
    info "ClickHouse Play UI: http://localhost:8123/play"
    info "Grafana Dashboards: http://localhost:3000 (admin/admin)"
    info "Prometheus: http://localhost:9090"
    
    cd "$SCRIPT_DIR"
}

# Function to start data pipelines
start_data_pipelines() {
    log "🔄 Starting Airflow ETL data pipelines..."
    
    cd "$SCRIPT_DIR/app/data-pipelines"
    
    # Check if .env exists
    if [[ ! -f ".env" ]]; then
        warning "Data pipelines .env file not found, copying from .env.example"
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
        fi
        warning "Please review and update data-pipelines/.env with your configuration"
    fi
    
    # Start data pipeline services
    if [[ "$DETACHED" == "true" ]]; then
        make up > "$LOG_DIR/data-pipelines.log" 2>&1 &
        echo $! > "$PID_DIR/data-pipelines.pid"
    else
        make up
    fi
    
    # Health check
    if [[ "$SKIP_HEALTH_CHECK" != "true" ]]; then
        log "⏳ Waiting for Airflow to be ready..."
        sleep 15
        
        local retries=45
        while ! curl -s http://localhost:8080/health > /dev/null 2>&1 && [[ $retries -gt 0 ]]; do
            sleep 4
            ((retries--))
        done
        
        if [[ $retries -eq 0 ]]; then
            error "Data pipelines failed to start within timeout"
            return 1
        fi
        
        make health
    fi
    
    success "Data pipelines started successfully"
    info "Airflow UI: http://localhost:8080 (admin/admin)"
    info "ClickHouse (pipelines): http://localhost:8123"
    info "Grafana (pipelines): http://localhost:3000"
    
    cd "$SCRIPT_DIR"
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
        ollama)
            start_ollama
            ;;
        data-warehouse)
            start_data_warehouse
            ;;
        data-pipelines)
            start_data_pipelines
            ;;
        *)
            error "Unknown service: $service"
            warning "Available services: database, data-warehouse, data-pipelines, web-app, api, ollama, all"
            ;;
    esac
done

# Show status summary
echo
log "📊 ANDI Application Status:"
echo "─────────────────────────────────────"

# Database status
if docker ps --format "table {{.Names}}" | grep -q "andi-postgres"; then
    success "Database: Running (PostgreSQL)"
else
    warning "Database: Not running"
fi

# Data warehouse status
if docker ps --format "table {{.Names}}" | grep -q "andi-clickhouse-warehouse"; then
    success "Data Warehouse: Running (ClickHouse + Grafana + Prometheus)"
else
    warning "Data Warehouse: Not running"
fi

# Data pipelines status
if docker ps --format "table {{.Names}}" | grep -q "airflow-webserver"; then
    success "Data Pipelines: Running (Airflow + ETL)"
else
    warning "Data Pipelines: Not running"
fi


# Ollama status
if docker ps --format "table {{.Names}}" | grep -q "andi_ollama"; then
    success "Ollama: Running (Local LLM Server)"
else
    warning "Ollama: Not running"
fi

# Web app status
if docker ps --format "table {{.Names}}" | grep -q "andi-web-app"; then
    success "Web App: Running (Next.js 15 + Auth.js - Containerized)"
else
    warning "Web App: Not running"
fi

echo "─────────────────────────────────────"

# Show access URLs
echo
info "🔗 Access URLs:"
echo "   Database:               PostgreSQL on port ${POSTGRES_PORT:-5432}"
echo "   Data Warehouse:"
echo "     - ClickHouse Play:    http://localhost:8123/play"
echo "     - Grafana:            http://localhost:3000 (admin/admin)"
echo "     - Prometheus:         http://localhost:9090"
echo "   Data Pipelines:"
echo "     - Airflow UI:         http://localhost:8080 (admin/admin)"
echo "   Ollama Local LLM:"
echo "     - Ollama API:         http://localhost:11434"
echo "     - Web UI:             http://localhost:8080 (if enabled)"
echo "   Web App:               http://localhost:${ANDI_PORT:-3000} (Next.js 15 + Auth.js)"
echo "   API Docs:              http://localhost:${API_PORT:-3001}/docs (coming soon)"

# Show logs if requested
if [[ "$SHOW_LOGS" == "true" && "$DETACHED" == "true" ]]; then
    echo
    log "📋 Following logs (Ctrl+C to stop)..."
    tail -f "$LOG_DIR"/*.log 2>/dev/null || true
fi

# Show useful commands
echo
info "💡 Useful commands:"
echo "   Stop all:              ./stop-andi.sh"
echo "   View logs:             tail -f logs/*.log"
echo "   Database CLI:          cd app/app-database && make psql"
echo "   Database health:       cd app/app-database && make health-check"
echo "   Warehouse setup:       cd app/data-warehouse && make setup"
echo "   Warehouse queries:     cd app/data-warehouse && make sample-analytics"
echo "   Pipeline health:       cd app/data-pipelines && make health"
echo "   Pipeline logs:         cd app/data-pipelines && make logs"
echo "   Ollama setup:          cd app/open-llm-app && make setup-models"
echo "   Ollama health:         cd app/open-llm-app && make health"
echo "   Web app dev:           cd app/web-app && npm run dev"
echo "   Web app build:         cd app/web-app && npm run build"
echo "   Database studio:       cd app/web-app && npm run db:studio"
echo "   Test Sentry:           node scripts/test-sentry.js"

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