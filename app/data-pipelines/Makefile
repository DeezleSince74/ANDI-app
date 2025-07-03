# ANDI Data Pipelines Makefile
.PHONY: help up down logs status clean test install health

# Default target
help:
	@echo "ANDI Data Pipelines - Available commands:"
	@echo ""
	@echo "  up          - Start all services (Airflow, ClickHouse, monitoring)"
	@echo "  down        - Stop all services"
	@echo "  logs        - View service logs"
	@echo "  status      - Check service status"
	@echo "  health      - Run health checks"
	@echo "  install     - Install ETL dependencies"
	@echo "  test        - Run tests"
	@echo "  clean       - Clean up volumes and images"
	@echo "  reset       - Reset Airflow database"
	@echo ""

# Start all services
up:
	@echo "🚀 Starting ANDI Data Pipelines..."
	docker-compose up -d
	@echo "✅ Services starting. Use 'make status' to check progress."
	@echo ""
	@echo "🌐 Access URLs:"
	@echo "  Airflow UI:    http://localhost:8080 (admin/admin)"
	@echo "  ClickHouse:    http://localhost:8123"
	@echo "  Grafana:       http://localhost:3000 (admin/admin)"
	@echo "  Prometheus:    http://localhost:9090"

# Stop all services
down:
	@echo "🛑 Stopping ANDI Data Pipelines..."
	docker-compose down
	@echo "✅ Services stopped."

# View logs
logs:
	docker-compose logs -f

# Check service status
status:
	@echo "📊 Service Status:"
	@echo ""
	docker-compose ps
	@echo ""
	@echo "🔍 Health Checks:"
	@docker-compose exec -T airflow-webserver curl -f http://localhost:8080/health 2>/dev/null && echo "✅ Airflow: Healthy" || echo "❌ Airflow: Unhealthy"
	@docker-compose exec -T clickhouse wget --spider -q http://localhost:8123/ping 2>/dev/null && echo "✅ ClickHouse: Healthy" || echo "❌ ClickHouse: Unhealthy"
	@curl -f http://localhost:3000/api/health 2>/dev/null >/dev/null && echo "✅ Grafana: Healthy" || echo "❌ Grafana: Unhealthy"
	@curl -f http://localhost:9090/-/healthy 2>/dev/null >/dev/null && echo "✅ Prometheus: Healthy" || echo "❌ Prometheus: Unhealthy"

# Run comprehensive health checks
health:
	@echo "🏥 Running comprehensive health checks..."
	@echo ""
	
	# Test database connections
	cd etl && npm run test-connections || echo "❌ Database connection test failed"
	
	# Test Airflow DAGs
	@docker-compose exec -T airflow-scheduler airflow dags list | grep -q "andi_daily_etl" && echo "✅ Daily ETL DAG loaded" || echo "❌ Daily ETL DAG not found"
	@docker-compose exec -T airflow-scheduler airflow dags list | grep -q "andi_ciq_sync" && echo "✅ CIQ Sync DAG loaded" || echo "❌ CIQ Sync DAG not found"
	
	# Test ClickHouse
	@docker-compose exec -T clickhouse clickhouse-client --query "SELECT 1" 2>/dev/null && echo "✅ ClickHouse query test passed" || echo "❌ ClickHouse query test failed"

# Install ETL dependencies
install:
	@echo "📦 Installing ETL dependencies..."
	cd etl && npm install
	@echo "✅ Dependencies installed."

# Run tests
test:
	@echo "🧪 Running tests..."
	cd etl && npm test
	@echo "✅ Tests completed."

# Clean up volumes and images
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup completed."

# Reset Airflow database
reset:
	@echo "🔄 Resetting Airflow database..."
	docker-compose down
	docker volume rm data-pipelines_postgres-db-volume 2>/dev/null || true
	docker-compose up airflow-init
	docker-compose up -d
	@echo "✅ Airflow database reset completed."

# Development shortcuts
dev-up:
	@echo "🔧 Starting development environment..."
	docker-compose up -d postgres redis clickhouse
	@echo "✅ Core services started for development."

dev-down:
	docker-compose down

# Backup ClickHouse data
backup:
	@echo "💾 Creating ClickHouse backup..."
	mkdir -p backups
	docker-compose exec -T clickhouse clickhouse-client --query "BACKUP DATABASE andi_warehouse TO Disk('default', 'backup_$(shell date +%Y%m%d_%H%M%S).tar')"
	@echo "✅ Backup completed."

# View specific service logs
logs-airflow:
	docker-compose logs -f airflow-webserver airflow-scheduler airflow-worker

logs-clickhouse:
	docker-compose logs -f clickhouse

logs-etl:
	docker-compose logs -f airflow-worker

# Quick DAG testing
test-daily-dag:
	docker-compose exec airflow-scheduler airflow dags test andi_daily_etl $(shell date +%Y-%m-%d)

test-ciq-dag:
	docker-compose exec airflow-scheduler airflow dags test andi_ciq_sync $(shell date +%Y-%m-%d)