# ANDI Langflow Makefile
.PHONY: help dev prod up down logs status health init flows clean test backup

# Default target
help:
	@echo "ANDI Langflow - Available commands:"
	@echo ""
	@echo "  Development:"
	@echo "    dev              - Start Langflow IDE for development"
	@echo "    up               - Start development environment"
	@echo "    down             - Stop development environment"
	@echo "    logs             - View development logs"
	@echo "    status           - Check development status"
	@echo ""
	@echo "  Production:"
	@echo "    prod             - Start production runtime environment"
	@echo "    prod-down        - Stop production environment"
	@echo "    prod-logs        - View production logs"
	@echo "    prod-status      - Check production status"
	@echo ""
	@echo "  Management:"
	@echo "    health           - Run comprehensive health checks"
	@echo "    init             - Initialize database and setup"
	@echo "    flows            - List and manage flows"
	@echo "    backup           - Create backup of flows and data"
	@echo "    restore          - Restore from backup"
	@echo "    clean            - Clean up containers and volumes"
	@echo "    test             - Run integration tests"
	@echo ""

# Development commands
dev:
	@echo "🚀 Starting Langflow IDE for development..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Langflow IDE started successfully!"
	@echo ""
	@echo "🌐 Access URLs:"
	@echo "  Langflow IDE:      http://localhost:7860"
	@echo "  PostgreSQL:        localhost:5433"
	@echo "  Redis:             localhost:6380"
	@echo ""
	@echo "📖 Login credentials:"
	@echo "  Email:             $$(grep LANGFLOW_SUPERUSER_EMAIL .env 2>/dev/null | cut -d= -f2 || echo 'admin@andi.local')"
	@echo "  Password:          $$(grep LANGFLOW_SUPERUSER_PASSWORD .env 2>/dev/null | cut -d= -f2 || echo 'langflow_admin')"

up: dev

down:
	@echo "🛑 Stopping Langflow development environment..."
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ Development environment stopped."

logs:
	@echo "📋 Viewing Langflow development logs (Ctrl+C to exit)..."
	docker-compose -f docker-compose.dev.yml logs -f langflow

status:
	@echo "📊 Langflow Development Status:"
	@echo ""
	docker-compose -f docker-compose.dev.yml ps
	@echo ""
	@echo "🔍 Health Checks:"
	@curl -s http://localhost:7860/api/v1/auto_login 2>/dev/null >/dev/null && echo "✅ Langflow IDE: Healthy" || echo "❌ Langflow IDE: Unhealthy"
	@docker-compose -f docker-compose.dev.yml exec -T langflow-postgres pg_isready -U langflow_user -d langflow_db 2>/dev/null >/dev/null && echo "✅ PostgreSQL: Healthy" || echo "❌ PostgreSQL: Unhealthy"
	@docker-compose -f docker-compose.dev.yml exec -T langflow-redis redis-cli ping 2>/dev/null | grep -q PONG && echo "✅ Redis: Healthy" || echo "❌ Redis: Unhealthy"

# Production commands
prod:
	@echo "🚀 Starting Langflow production runtime..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Langflow runtime started successfully!"
	@echo ""
	@echo "🌐 Access URLs:"
	@echo "  Langflow API:      http://localhost:7860/api/v1"
	@echo "  Health Check:      http://localhost:7860/api/v1/version"

prod-down:
	@echo "🛑 Stopping Langflow production environment..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✅ Production environment stopped."

prod-logs:
	@echo "📋 Viewing Langflow production logs (Ctrl+C to exit)..."
	docker-compose -f docker-compose.prod.yml logs -f langflow-runtime

prod-status:
	@echo "📊 Langflow Production Status:"
	@echo ""
	docker-compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "🔍 Health Checks:"
	@curl -s http://localhost:7860/api/v1/version 2>/dev/null >/dev/null && echo "✅ Langflow Runtime: Healthy" || echo "❌ Langflow Runtime: Unhealthy"

# Health and management commands
health:
	@echo "🏥 Running comprehensive Langflow health checks..."
	@echo ""
	
	# Check if containers are running
	@echo "📦 Container Status:"
	@docker-compose -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Development environment not running"
	@echo ""
	
	# Test Langflow API
	@echo "🔍 API Health Checks:"
	@if curl -s http://localhost:7860/api/v1/version >/dev/null 2>&1; then \
		echo "✅ Langflow API: Responding"; \
		echo "   Version: $$(curl -s http://localhost:7860/api/v1/version 2>/dev/null | jq -r '.version // "unknown"' 2>/dev/null || echo 'unknown')"; \
	else \
		echo "❌ Langflow API: Not responding"; \
	fi
	
	# Test database connectivity
	@echo "🗄️ Database Health:"
	@if docker-compose -f docker-compose.dev.yml exec -T langflow-postgres pg_isready -U langflow_user -d langflow_db >/dev/null 2>&1; then \
		echo "✅ PostgreSQL: Connected"; \
		echo "   Database: $$(docker-compose -f docker-compose.dev.yml exec -T langflow-postgres psql -U langflow_user -d langflow_db -t -c "SELECT current_database();" 2>/dev/null | xargs || echo 'unknown')"; \
	else \
		echo "❌ PostgreSQL: Connection failed"; \
	fi
	
	# Test ANDI database connectivity (for connectors)
	@echo "🔗 ANDI Integration Health:"
	@if nc -z localhost 5432 2>/dev/null; then \
		echo "✅ ANDI Database: Accessible"; \
	else \
		echo "⚠️  ANDI Database: Not accessible (expected if not running)"; \
	fi

init:
	@echo "🔧 Initializing Langflow environment..."
	@echo ""
	
	# Check if .env exists
	@if [ ! -f ".env" ]; then \
		echo "📝 Creating .env file from template..."; \
		cp .env.example .env; \
		echo "⚠️  Please review and update .env with your configuration"; \
	else \
		echo "✅ .env file exists"; \
	fi
	
	# Create necessary directories
	@echo "📁 Creating directories..."
	@mkdir -p flows custom_components init nginx postgres redis
	@echo "✅ Directories created"
	
	# Start services and wait for health
	@echo "🚀 Starting services..."
	@make dev
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	
	# Initialize Sentry monitoring
	@echo "🔍 Initializing Sentry monitoring..."
	@python init_sentry.py 2>/dev/null || echo "⚠️  Sentry initialization failed (may not be configured)"
	
	# Run health check
	@make health

flows:
	@echo "📊 Langflow Flows Management:"
	@echo ""
	
	# List flows if API is available
	@if curl -s http://localhost:7860/api/v1/flows >/dev/null 2>&1; then \
		echo "📋 Available Flows:"; \
		curl -s http://localhost:7860/api/v1/flows 2>/dev/null | jq -r '.flows[]? | "  - \(.name) (\(.id))"' 2>/dev/null || echo "  No flows found or unable to parse response"; \
	else \
		echo "❌ Langflow API not available. Start development environment first:"; \
		echo "   make dev"; \
	fi
	
	@echo ""
	@echo "📁 Flow Files:"
	@ls -la flows/ 2>/dev/null || echo "  No flow files found in ./flows/"

backup:
	@echo "💾 Creating Langflow backup..."
	@mkdir -p backups
	@timestamp=$$(date +%Y%m%d_%H%M%S); \
	echo "📦 Backing up flows and configuration..."; \
	tar -czf "backups/langflow_backup_$$timestamp.tar.gz" flows/ custom_components/ .env 2>/dev/null || true; \
	if [ -f "backups/langflow_backup_$$timestamp.tar.gz" ]; then \
		echo "✅ Backup created: backups/langflow_backup_$$timestamp.tar.gz"; \
	else \
		echo "⚠️  Backup created but may be incomplete"; \
	fi
	
	# Database backup
	@if docker-compose -f docker-compose.dev.yml ps langflow-postgres | grep -q "Up"; then \
		echo "🗄️ Backing up database..."; \
		docker-compose -f docker-compose.dev.yml exec -T langflow-postgres pg_dump -U langflow_user -d langflow_db > "backups/langflow_db_backup_$$timestamp.sql" 2>/dev/null || echo "❌ Database backup failed"; \
		if [ -f "backups/langflow_db_backup_$$timestamp.sql" ]; then \
			echo "✅ Database backup created: backups/langflow_db_backup_$$timestamp.sql"; \
		fi \
	else \
		echo "⚠️  Database not running, skipping database backup"; \
	fi

restore:
	@echo "🔄 Restoring Langflow from backup..."
	@echo "Usage: make restore BACKUP_FILE=backup_20241201_120000.tar.gz"
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ Please specify BACKUP_FILE"; \
		echo "Available backups:"; \
		ls -la backups/ 2>/dev/null || echo "No backups found"; \
		exit 1; \
	fi
	@if [ -f "backups/$(BACKUP_FILE)" ]; then \
		echo "📦 Restoring from backups/$(BACKUP_FILE)..."; \
		tar -xzf "backups/$(BACKUP_FILE)" 2>/dev/null && echo "✅ Files restored successfully" || echo "❌ File restore failed"; \
	else \
		echo "❌ Backup file not found: backups/$(BACKUP_FILE)"; \
	fi

clean:
	@echo "🧹 Cleaning up Langflow environment..."
	@echo "⚠️  This will remove all containers and volumes!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	
	@echo "🛑 Stopping services..."
	@docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
	@docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
	
	@echo "🗑️ Removing volumes..."
	@docker volume rm andi-langflow-data-dev andi-langflow-postgres-dev andi-langflow-redis-dev 2>/dev/null || true
	@docker volume rm andi-langflow-data-prod andi-langflow-postgres-prod andi-langflow-redis-prod 2>/dev/null || true
	
	@echo "✅ Cleanup completed."

test:
	@echo "🧪 Running Langflow integration tests..."
	@echo ""
	
	# Test development environment
	@echo "Testing development environment..."
	@make dev
	@sleep 15
	
	# Test API endpoints
	@echo "🔍 Testing API endpoints..."
	@if curl -s http://localhost:7860/api/v1/version >/dev/null; then \
		echo "✅ Version endpoint: OK"; \
	else \
		echo "❌ Version endpoint: Failed"; \
	fi
	
	@if curl -s http://localhost:7860/api/v1/flows >/dev/null; then \
		echo "✅ Flows endpoint: OK"; \
	else \
		echo "❌ Flows endpoint: Failed"; \
	fi
	
	# Test database connectivity
	@echo "🗄️ Testing database connectivity..."
	@if docker-compose -f docker-compose.dev.yml exec -T langflow-postgres psql -U langflow_user -d langflow_db -c "SELECT 1;" >/dev/null 2>&1; then \
		echo "✅ Database connection: OK"; \
	else \
		echo "❌ Database connection: Failed"; \
	fi
	
	@echo ""
	@echo "🎉 Integration tests completed!"

# Development shortcuts
reset: clean init
	@echo "🔄 Langflow environment reset completed!"

restart:
	@make down
	@sleep 2
	@make dev

# Production shortcuts
prod-restart:
	@make prod-down
	@sleep 2
	@make prod

# Monitoring and observability
sentry:
	@echo "🔍 Initializing and testing Sentry monitoring for Langflow..."
	@echo ""
	
	# Check Sentry configuration
	@echo "📋 Sentry Configuration:"
	@if [ -n "$${SENTRY_DSN}" ]; then \
		echo "✅ SENTRY_DSN: Configured"; \
	else \
		echo "❌ SENTRY_DSN: Not configured"; \
		echo "   Set SENTRY_DSN environment variable"; \
	fi
	@echo "   Environment: $${SENTRY_ENVIRONMENT:-development}"
	@echo "   Sample Rate: $${SENTRY_TRACES_SAMPLE_RATE:-1.0}"
	@echo ""
	
	# Initialize Sentry
	@echo "🚀 Initializing Sentry..."
	@python init_sentry.py
	@echo ""
	
	# Test Sentry integration
	@echo "🧪 Testing Sentry integration..."
	@python -c "
import sys
sys.path.append('./utils')
from sentry import sentry_monitor, track_flow
import time

if sentry_monitor.initialized:
    print('✅ Sentry initialization: Success')
    
    # Test flow tracking
    @track_flow('test_flow', 'Test Flow')
    def test_function():
        time.sleep(0.1)
        return {'status': 'success', 'metrics': {'duration': 0.1}}
    
    try:
        result = test_function()
        print('✅ Flow tracking: Success')
    except Exception as e:
        print(f'❌ Flow tracking: Failed - {e}')
    
    # Test error capture
    try:
        sentry_monitor.log_flow_error('test_flow', 'Test Flow', Exception('Test error'), {'test': True})
        print('✅ Error capture: Success')
    except Exception as e:
        print(f'❌ Error capture: Failed - {e}')
        
    print('✅ Sentry testing completed successfully!')
else:
    print('❌ Sentry not initialized - check configuration')
    sys.exit(1)
" 2>/dev/null || echo "❌ Sentry testing failed"