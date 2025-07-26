# ANDI Database Makefile
# Provides convenient commands for database management

.PHONY: help up down start stop restart logs shell psql backup restore health-check clean reset migrate seed sync-web-app check-drift generate-types schema-status

# Default environment file
ENV_FILE ?= .env

# Load environment variables
ifneq (,$(wildcard $(ENV_FILE)))
    include $(ENV_FILE)
    export
endif

help: ## Show this help message
	@echo "ANDI Database Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Usage: make [command]"
	@echo "Example: make up"

up: ## Start database containers
	docker-compose up -d
	@echo "Waiting for database to be ready..."
	@sleep 5
	@make health-check

down: ## Stop and remove database containers
	docker-compose down

start: ## Start existing database containers
	docker-compose start

stop: ## Stop database containers without removing
	docker-compose stop

restart: ## Restart database containers
	docker-compose restart
	@echo "Waiting for database to be ready..."
	@sleep 5
	@make health-check

logs: ## View database container logs
	docker-compose logs -f postgres

shell: ## Open bash shell in postgres container
	docker exec -it andi-postgres bash

psql: ## Open PostgreSQL CLI
	docker exec -it -e PGPASSWORD=$${POSTGRES_PASSWORD:-andi_dev_password} andi-postgres psql -U $${POSTGRES_USER:-andi_user} -d $${POSTGRES_DB:-andi_db}

backup: ## Create database backup
	@./scripts/backup.sh

restore: ## Restore database from backup (usage: make restore BACKUP=./backups/andi_backup_20240101_120000.sql.gz)
	@if [ -z "$(BACKUP)" ]; then \
		echo "Error: Please specify backup file with BACKUP=<file>"; \
		echo "Example: make restore BACKUP=./backups/andi_backup_20240101_120000.sql.gz"; \
		exit 1; \
	fi
	@./scripts/restore.sh $(BACKUP)

health-check: ## Run database health check
	@./scripts/health-check.sh

clean: ## Remove all volumes and containers (WARNING: Destroys all data)
	@echo "WARNING: This will remove all database data!"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	docker-compose down -v

reset: clean up ## Reset database to fresh state (WARNING: Destroys all data)
	@echo "Database has been reset to fresh state"

migrate: ## Run database migrations
	@echo "Running database migrations..."
	@if [ -d "./migrations" ] && [ "$$(ls -A ./migrations/versions 2>/dev/null)" ]; then \
		echo "Applying migrations..."; \
		docker exec -i -e PGPASSWORD=$${POSTGRES_PASSWORD:-andi_dev_password} andi-postgres psql -U $${POSTGRES_USER:-andi_user} -d $${POSTGRES_DB:-andi_db} < ./migrations/run-migrations.sql; \
	else \
		echo "No migrations found to run"; \
	fi

seed: ## Seed database with test data
	@echo "Seeding database with test data..."
	@if [ -f "./seeds/seed-data.sql" ]; then \
		docker exec -i -e PGPASSWORD=$${POSTGRES_PASSWORD:-andi_dev_password} andi-postgres psql -U $${POSTGRES_USER:-andi_user} -d $${POSTGRES_DB:-andi_db} < ./seeds/seed-data.sql; \
		echo "Database seeded successfully"; \
	else \
		echo "No seed file found at ./seeds/seed-data.sql"; \
	fi

env-setup: ## Copy .env.example to .env if it doesn't exist
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from .env.example"; \
		echo "Please update the values in .env as needed"; \
	else \
		echo ".env file already exists"; \
	fi

test-connection: ## Test database connection
	@echo "Testing database connection..."
	@docker exec -e PGPASSWORD=$${POSTGRES_PASSWORD:-andi_dev_password} andi-postgres pg_isready -U $${POSTGRES_USER:-andi_user} -d $${POSTGRES_DB:-andi_db} && \
		echo "✓ Database connection successful" || \
		echo "✗ Database connection failed"

stats: ## Show database statistics
	@echo "Database Statistics:"
	@docker exec -e PGPASSWORD=$${POSTGRES_PASSWORD:-andi_dev_password} andi-postgres psql -U $${POSTGRES_USER:-andi_user} -d $${POSTGRES_DB:-andi_db} -c "\
		SELECT \
			schemaname as schema, \
			COUNT(*) as tables, \
			pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))::bigint) as size \
		FROM pg_tables \
		WHERE schemaname IN ('auth', 'core', 'analytics', 'community', 'gamification') \
		GROUP BY schemaname \
		ORDER BY schemaname;"

sync-web-app: ## Sync schema changes to web-app
	@echo "🔄 Syncing schema to web-app..."
	@./scripts/sync-to-web-app.sh

sync-web-app-dry-run: ## Preview schema sync changes (dry run)
	@echo "🔍 Preview schema changes..."
	@./scripts/sync-to-web-app.sh --dry-run

check-drift: ## Check for schema drift between app-database and web-app
	@echo "🔍 Checking schema drift..."
	@./scripts/check-schema-drift.sh

check-drift-fix: ## Check and automatically fix schema drift
	@echo "🔧 Checking and fixing schema drift..."
	@./scripts/check-schema-drift.sh --fix

generate-types: ## Generate TypeScript types from schema
	@echo "🔧 Generating TypeScript types..."
	@node ./scripts/generate-types.js

generate-types-dry-run: ## Preview TypeScript type generation
	@echo "🔍 Preview TypeScript type generation..."
	@node ./scripts/generate-types.js --dry-run

schema-status: ## Show comprehensive schema synchronization status
	@echo "📊 Schema Synchronization Status"
	@echo "================================="
	@echo ""
	@echo "🏗️  App-Database Schema:"
	@find ./init -name "*.sql" | wc -l | awk '{print "   📄 Schema files: " $$1}'
	@if [ -d "./migrations/versions" ]; then \
		find ./migrations/versions -name "*.sql" | wc -l | awk '{print "   🔄 Migrations: " $$1}'; \
	else \
		echo "   🔄 Migrations: 0"; \
	fi
	@echo ""
	@echo "🌐 Web-App Schema:"
	@if [ -d "../web-app/src/db/schema/app-database-schemas" ]; then \
		find ../web-app/src/db/schema/app-database-schemas -name "*.sql" | wc -l | awk '{print "   📄 Synced files: " $$1}'; \
	else \
		echo "   📄 Synced files: 0 (never synced)"; \
	fi
	@if [ -f "../web-app/src/db/schema/.schema-checksum" ]; then \
		echo "   🔒 Last sync: $$(cat ../web-app/src/db/schema/.schema-checksum)"; \
	else \
		echo "   🔒 Last sync: Never"; \
	fi
	@echo ""
	@echo "💡 Quick Actions:"
	@echo "   Sync schema:     make sync-web-app"
	@echo "   Check drift:     make check-drift"
	@echo "   Generate types:  make generate-types"
	@echo "   Full workflow:   make sync-and-generate"

sync-and-generate: ## Complete workflow: sync schema and generate types
	@echo "🚀 Running complete schema sync workflow..."
	@make sync-web-app
	@make generate-types
	@echo ""
	@echo "✅ Schema sync and type generation completed!"
	@echo "Next steps:"
	@echo "  1. cd ../web-app && npm run db:migrate"
	@echo "  2. npm run dev"

azure-deploy: ## Deploy database schema to Azure PostgreSQL
	@echo "Deploying to Azure PostgreSQL..."
	@if [ -z "$${AZURE_POSTGRES_HOST}" ]; then \
		echo "Error: Azure PostgreSQL configuration not found in .env"; \
		exit 1; \
	fi
	@echo "This will deploy the schema to Azure. Continue? (yes/no)"
	@read confirm && [ "$$confirm" = "yes" ] || exit 1
	@for file in ./init/*.sql; do \
		echo "Applying $$file..."; \
		PGPASSWORD=$${AZURE_POSTGRES_PASSWORD} psql \
			-h $${AZURE_POSTGRES_HOST} \
			-U $${AZURE_POSTGRES_USER} \
			-d $${AZURE_POSTGRES_DB} \
			-p 5432 \
			--set ON_ERROR_STOP=1 \
			-f $$file; \
	done
	@echo "Azure deployment completed"