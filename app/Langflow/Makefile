.PHONY: help dev prod stop logs status clean init backup restore health

# Default target
help:
	@echo "Langflow Management Commands:"
	@echo "  make init     - Initialize Langflow (create .env, directories)"
	@echo "  make dev      - Start Langflow in development mode"
	@echo "  make prod     - Start Langflow in production mode"
	@echo "  make stop     - Stop all Langflow services"
	@echo "  make logs     - View Langflow logs"
	@echo "  make status   - Check service status"
	@echo "  make clean    - Remove all containers and volumes"
	@echo "  make health   - Check health of all services"
	@echo "  make backup   - Backup Langflow data"
	@echo "  make restore  - Restore Langflow data"

# Initialize environment
init:
	@echo "Initializing Langflow environment..."
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env file - please update with your API keys"; fi
	@mkdir -p flows custom_components utils init nginx postgres redis
	@echo "Langflow initialized! Edit .env file with your API keys before starting."

# Development commands
dev:
	@echo "Starting Langflow in development mode..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Langflow is starting... Access at http://localhost:7860"
	@echo "Default login: admin@andi.local / langflow_admin"

# Production commands
prod:
	@echo "Starting Langflow in production mode..."
	@if [ ! -f docker-compose.prod.yml ]; then echo "Production config not found. Creating..."; cp docker-compose.dev.yml docker-compose.prod.yml; fi
	docker-compose -f docker-compose.prod.yml up -d

# Stop services
stop:
	@echo "Stopping Langflow services..."
	@if [ -f docker-compose.dev.yml ]; then docker-compose -f docker-compose.dev.yml down; fi
	@if [ -f docker-compose.prod.yml ]; then docker-compose -f docker-compose.prod.yml down; fi

# View logs
logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Check status
status:
	@echo "Langflow Service Status:"
	@docker ps --filter "name=andi_langflow" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Clean everything
clean:
	@echo "WARNING: This will remove all Langflow data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$${confirm}" = "y" ] || exit 1
	@if [ -f docker-compose.dev.yml ]; then docker-compose -f docker-compose.dev.yml down -v; fi
	@if [ -f docker-compose.prod.yml ]; then docker-compose -f docker-compose.prod.yml down -v; fi
	@echo "Cleaned all Langflow containers and volumes"

# Health check
health:
	@echo "Checking Langflow services health..."
	@curl -s http://localhost:7860/health || echo "Langflow API is not responding"
	@docker exec andi_langflow_postgres pg_isready || echo "PostgreSQL is not ready"
	@docker exec andi_langflow_redis redis-cli ping || echo "Redis is not responding"

# Backup
backup:
	@echo "Backing up Langflow data..."
	@mkdir -p backups
	@docker exec andi_langflow_postgres pg_dump -U langflow langflow > backups/langflow_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backups/"

# Restore
restore:
	@echo "Available backups:"
	@ls -la backups/*.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename to restore: " backup && \
		docker exec -i andi_langflow_postgres psql -U langflow langflow < backups/$$backup