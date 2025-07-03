# ANDI Data Pipelines

Data orchestration and ETL pipelines for the ANDI AI Instructional Coach platform using Apache Airflow.

## Overview

This project manages all data movement and transformation workflows for ANDI, including:
- PostgreSQL to ClickHouse ETL pipelines
- CIQ analytics data processing
- Data quality monitoring
- Scheduled data synchronization

## Architecture

```
PostgreSQL (Operational) → Airflow ETL → ClickHouse (Analytics)
```

## Project Structure

```
data-pipelines/
├── airflow/                    # Airflow configuration and DAGs
│   ├── dags/                   # Pipeline definitions
│   ├── config/                 # Airflow configuration
│   └── plugins/                # Custom Airflow plugins
├── etl/                        # ETL utilities and transformers
│   ├── src/                    # TypeScript ETL code
│   │   ├── extractors/         # Data extraction logic
│   │   ├── transformers/       # Data transformation logic
│   │   └── loaders/           # Data loading logic
│   └── package.json
├── monitoring/                 # Monitoring and alerting
│   ├── grafana/               # Grafana dashboards
│   └── prometheus/            # Prometheus configuration
├── shared/                     # Shared utilities
│   ├── connections.py         # Database connections
│   └── utils.py              # Common utilities
└── docker-compose.yml         # Local development environment
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for ETL utilities)
- Access to ANDI PostgreSQL database
- Access to ClickHouse instance

### Local Development

1. **Start Airflow services**:
   ```bash
   docker-compose up -d
   ```

2. **Access Airflow UI**:
   - URL: http://localhost:8080
   - Username: admin
   - Password: admin

3. **Install ETL dependencies**:
   ```bash
   cd etl && npm install
   ```

### Key DAGs

- **`andi_daily_etl`**: Full daily synchronization of all data
- **`andi_ciq_sync`**: Hourly CIQ metrics synchronization
- **`andi_data_quality`**: Data quality monitoring and validation

## Configuration

### Environment Variables

```bash
# PostgreSQL (Source)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=andi_db
POSTGRES_USER=andi_user
POSTGRES_PASSWORD=your_password

# ClickHouse (Destination)
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=andi_warehouse
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your_password

# Airflow
AIRFLOW_UID=1000
AIRFLOW_GID=0
```

### Database Connections

Airflow connections are configured in `shared/connections.py`:
- `postgres_andi`: Source PostgreSQL database
- `clickhouse_andi`: Destination ClickHouse database

## Data Flow

1. **Extract**: Pull data from PostgreSQL using Drizzle ORM
2. **Transform**: Apply business logic and data cleaning
3. **Load**: Insert transformed data into ClickHouse
4. **Validate**: Run data quality checks
5. **Alert**: Notify on failures or issues

## Monitoring

- **Airflow UI**: Pipeline monitoring and debugging
- **Grafana**: Data pipeline metrics and dashboards
- **Prometheus**: System metrics collection
- **Slack/Email**: Failure notifications

## Development

### Adding New Pipelines

1. Create DAG in `airflow/dags/`
2. Add ETL logic in `etl/src/`
3. Configure connections in `shared/connections.py`
4. Add monitoring in `monitoring/`

### Testing

```bash
# Test ETL utilities
cd etl && npm test

# Test Airflow DAGs
docker-compose exec airflow-webserver airflow dags test andi_daily_etl 2024-01-01
```

## Deployment

### Local Development
```bash
docker-compose up -d
```

### Production (Azure)
- Azure Container Instances for Airflow
- Managed PostgreSQL as source
- Managed ClickHouse as destination

## Troubleshooting

### Common Issues

1. **DAG not appearing**: Check Python syntax and imports
2. **Connection errors**: Verify database credentials
3. **Task failures**: Check Airflow logs in UI
4. **Memory issues**: Adjust Docker resource limits

### Support

- Check Airflow UI logs
- Review ETL utility logs
- Monitor system resources
- Verify database connectivity

## Contributing

1. Follow existing code patterns
2. Add tests for new ETL logic
3. Update documentation
4. Test locally before deployment