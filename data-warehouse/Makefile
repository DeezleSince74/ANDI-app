# ANDI Data Warehouse Makefile
.PHONY: help up down logs status health init-schema load-sample-data clean test backup

# Default target
help:
	@echo "ANDI Data Warehouse (ClickHouse) - Available commands:"
	@echo ""
	@echo "  up              - Start ClickHouse and monitoring services"
	@echo "  down            - Stop all services"
	@echo "  logs            - View service logs"
	@echo "  status          - Check service status"
	@echo "  health          - Run comprehensive health checks"
	@echo "  init-schema     - Initialize database schema and tables"
	@echo "  load-sample     - Load sample data for testing"
	@echo "  test-queries    - Run test queries to validate setup"
	@echo "  optimize        - Optimize all tables"
	@echo "  backup          - Create database backup"
	@echo "  restore         - Restore from backup"
	@echo "  clean           - Clean up data and volumes"
	@echo "  reset           - Reset entire warehouse (DESTRUCTIVE)"
	@echo ""

# Start services
up:
	@echo "🚀 Starting ANDI Data Warehouse..."
	docker-compose up -d
	@echo "✅ Services starting. Use 'make status' to check progress."
	@echo ""
	@echo "🌐 Access URLs:"
	@echo "  ClickHouse HTTP:  http://localhost:8123"
	@echo "  ClickHouse Play:  http://localhost:8123/play"
	@echo "  Grafana:          http://localhost:3000 (admin/admin)"
	@echo "  Prometheus:       http://localhost:9090"

# Stop services
down:
	@echo "🛑 Stopping ANDI Data Warehouse..."
	docker-compose down
	@echo "✅ Services stopped."

# View logs
logs:
	docker-compose logs -f clickhouse

# Check service status
status:
	@echo "📊 Service Status:"
	@echo ""
	docker-compose ps
	@echo ""
	@echo "🔍 Health Checks:"
	@curl -s http://localhost:8123/ping 2>/dev/null && echo "✅ ClickHouse: Healthy" || echo "❌ ClickHouse: Unhealthy"
	@curl -s http://localhost:3000/api/health 2>/dev/null >/dev/null && echo "✅ Grafana: Healthy" || echo "❌ Grafana: Unhealthy"
	@curl -s http://localhost:9090/-/healthy 2>/dev/null >/dev/null && echo "✅ Prometheus: Healthy" || echo "❌ Prometheus: Unhealthy"

# Comprehensive health check
health:
	@echo "🏥 Running comprehensive health checks..."
	@echo ""
	
	# Test ClickHouse connectivity
	@echo "Testing ClickHouse connectivity..."
	@docker-compose exec -T clickhouse clickhouse-client --query "SELECT 'ClickHouse is responding' as status, now() as timestamp" || echo "❌ ClickHouse connection failed"
	
	# Test database existence
	@echo "Checking ANDI warehouse database..."
	@docker-compose exec -T clickhouse clickhouse-client --query "SHOW DATABASES" | grep -q "andi_warehouse" && echo "✅ andi_warehouse database exists" || echo "❌ andi_warehouse database not found"
	
	# Test table counts
	@echo "Checking table counts..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT 'Tables created: ' || toString(count()) FROM system.tables WHERE database = 'andi_warehouse' AND engine LIKE '%MergeTree%'"

# Initialize database schema
init-schema:
	@echo "🗄️ Initializing ANDI Data Warehouse schema..."
	@echo "This will create all tables, views, and indexes..."
	@echo ""
	
	# Wait for ClickHouse to be ready
	@echo "Waiting for ClickHouse to be ready..."
	@timeout 60 bash -c 'until docker-compose exec -T clickhouse clickhouse-client --query "SELECT 1" >/dev/null 2>&1; do sleep 2; done'
	
	# Create database and basic setup
	@echo "Creating database and basic setup..."
	@docker-compose exec -T clickhouse clickhouse-client --multiquery < clickhouse/schemas/01-databases.sql
	
	# Create fact tables
	@echo "Creating fact tables..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/02-facts/ciq_sessions.sql
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/02-facts/resource_usage.sql
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/02-facts/community_activity.sql
	
	# Create dimension tables
	@echo "Creating dimension tables..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/03-dims/teachers.sql
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/03-dims/schools.sql
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/03-dims/districts.sql
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/03-dims/resources.sql
	
	# Create aggregation tables
	@echo "Creating aggregation tables..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/04-aggregates/daily_teacher_performance.sql
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/04-aggregates/weekly_school_metrics.sql
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/schemas/04-aggregates/monthly_district_trends.sql
	
	@echo "✅ Schema initialization completed!"
	@echo ""
	@echo "📊 Summary:"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT 'Total tables created: ' || toString(count()) FROM system.tables WHERE database = 'andi_warehouse'"

# Load sample data
load-sample:
	@echo "📊 Loading sample data..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --multiquery < clickhouse/init/02-sample-data.sql
	@echo "✅ Sample data loaded successfully!"

# Run test queries
test-queries:
	@echo "🧪 Running test queries..."
	@echo ""
	
	@echo "Testing basic table access..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT 'Districts: ' || toString(count()) FROM dims_districts"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT 'Schools: ' || toString(count()) FROM dims_schools"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT 'Teachers: ' || toString(count()) FROM dims_teachers"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT 'CIQ Sessions: ' || toString(count()) FROM facts_ciq_sessions"
	
	@echo ""
	@echo "Testing analytical views..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT * FROM v_teacher_comprehensive_analytics LIMIT 3" --format PrettyCompact
	
	@echo ""
	@echo "Testing data quality checks..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT * FROM v_data_quality_checks" --format PrettyCompact

# Optimize all tables
optimize:
	@echo "⚡ Optimizing all tables..."
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "OPTIMIZE TABLE facts_ciq_sessions"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "OPTIMIZE TABLE facts_resource_usage"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "OPTIMIZE TABLE facts_community_activity"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "OPTIMIZE TABLE dims_teachers"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "OPTIMIZE TABLE dims_schools"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "OPTIMIZE TABLE dims_districts"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "OPTIMIZE TABLE dims_resources"
	@echo "✅ Table optimization completed!"

# Create backup
backup:
	@echo "💾 Creating database backup..."
	mkdir -p backups
	@docker-compose exec -T clickhouse clickhouse-client --query "BACKUP DATABASE andi_warehouse TO Disk('default', 'backup_$(shell date +%Y%m%d_%H%M%S).tar')"
	@echo "✅ Backup created successfully."

# Restore from backup (requires backup file name)
restore:
	@echo "🔄 Restoring from backup..."
	@echo "Usage: make restore BACKUP_FILE=backup_20241201_120000.tar"
	@if [ -z "$(BACKUP_FILE)" ]; then echo "❌ Please specify BACKUP_FILE"; exit 1; fi
	@docker-compose exec -T clickhouse clickhouse-client --query "RESTORE DATABASE andi_warehouse FROM Disk('default', '$(BACKUP_FILE)')"
	@echo "✅ Restore completed."

# Clean up data
clean:
	@echo "🧹 Cleaning up data and volumes..."
	docker-compose down -v
	docker volume prune -f
	@echo "✅ Cleanup completed."

# Complete reset (DESTRUCTIVE)
reset: clean
	@echo "🔄 Resetting ANDI Data Warehouse (DESTRUCTIVE)..."
	@echo "This will delete ALL data and recreate the warehouse."
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	@make up
	@sleep 10
	@make init-schema
	@make load-sample
	@echo "✅ Reset completed with sample data."

# Development shortcuts
dev: up init-schema load-sample
	@echo "🔧 Development environment ready!"
	@make test-queries

# Full setup for new environment
setup: up
	@echo "🚀 Setting up ANDI Data Warehouse for the first time..."
	@sleep 10
	@make init-schema
	@make load-sample
	@make test-queries
	@echo "✅ Setup completed! Data warehouse is ready."

# Performance monitoring
perf-monitor:
	@echo "📊 Performance Monitoring:"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT * FROM v_query_performance_monitor ORDER BY hour DESC LIMIT 10" --format PrettyCompact

# Data freshness check
freshness-check:
	@echo "🕐 Data Freshness Check:"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT * FROM v_data_freshness_monitor" --format PrettyCompact

# Schema validation
validate-schema:
	@echo "✅ Schema Validation:"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT * FROM v_warehouse_table_stats ORDER BY total_rows DESC" --format PrettyCompact

# Quick analytics samples
sample-analytics:
	@echo "📈 Sample Analytics Queries:"
	@echo ""
	@echo "District Performance Summary:"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT * FROM v_district_executive_dashboard" --format PrettyCompact
	@echo ""
	@echo "School Leadership Dashboard:"
	@docker-compose exec -T clickhouse clickhouse-client --database=andi_warehouse --query "SELECT school_name, recent_avg_score, recent_engagement_rate, teachers_excellent, teachers_needing_support FROM v_school_leadership_dashboard LIMIT 5" --format PrettyCompact