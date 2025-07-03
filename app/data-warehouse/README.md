# ANDI Data Warehouse (ClickHouse)

High-performance analytics data warehouse for the ANDI AI Instructional Coach platform using ClickHouse.

## Overview

This data warehouse provides optimized analytics storage and querying capabilities for:
- CIQ (Classroom Impact Quotient) session analytics
- Teacher performance metrics and trends
- School and district-level reporting
- Real-time dashboard data
- Historical trend analysis

## Architecture

```
PostgreSQL (OLTP) → ETL Pipelines → ClickHouse (OLAP)
                                        ↓
                                   Analytics & Reports
```

### Star Schema Design

- **Fact Tables**: High-volume transactional data (CIQ sessions, interactions)
- **Dimension Tables**: Reference data (teachers, schools, districts, resources)
- **Aggregate Tables**: Pre-computed metrics for fast queries
- **Materialized Views**: Real-time aggregations

## Project Structure

```
data-warehouse/
├── clickhouse/
│   ├── schemas/
│   │   ├── 01-databases.sql        # Database and schema creation
│   │   ├── 02-facts/               # Fact table definitions
│   │   │   ├── ciq_sessions.sql
│   │   │   ├── resource_usage.sql
│   │   │   └── community_activity.sql
│   │   ├── 03-dims/               # Dimension table definitions
│   │   │   ├── teachers.sql
│   │   │   ├── schools.sql
│   │   │   ├── districts.sql
│   │   │   └── resources.sql
│   │   ├── 04-aggregates/         # Aggregation table definitions
│   │   │   ├── daily_teacher_performance.sql
│   │   │   ├── weekly_school_metrics.sql
│   │   │   └── monthly_district_trends.sql
│   │   └── 05-views/              # Materialized views
│   │       ├── teacher_analytics.sql
│   │       ├── school_rankings.sql
│   │       └── district_dashboard.sql
│   ├── init/
│   │   ├── 01-setup.sql           # Initial setup script
│   │   └── 02-sample-data.sql     # Sample data for testing
│   ├── queries/
│   │   ├── analytics/             # Pre-built analytics queries
│   │   ├── reports/               # Standard report queries
│   │   └── dashboards/            # Dashboard queries
│   └── migrations/
│       └── versions/              # Schema migration scripts
├── docker-compose.yml             # Local ClickHouse setup
├── Makefile                       # Management commands
└── scripts/
    ├── backup.sh                  # Backup utilities
    ├── restore.sh                 # Restore utilities
    └── health-check.sh            # Health monitoring
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- ClickHouse client (optional, for direct access)

### Local Development

1. **Start ClickHouse**:
   ```bash
   make up
   ```

2. **Initialize schema**:
   ```bash
   make init-schema
   ```

3. **Load sample data**:
   ```bash
   make load-sample-data
   ```

4. **Access ClickHouse**:
   - HTTP Interface: http://localhost:8123
   - Native TCP: localhost:9000
   - Web UI: http://localhost:8123/play

### Key Tables

#### Fact Tables
- `facts.ciq_sessions`: CIQ session metrics and scores
- `facts.resource_usage`: Resource interaction tracking
- `facts.community_activity`: Forum and community engagement

#### Dimension Tables
- `dims.teachers`: Teacher profiles and metadata
- `dims.schools`: School information and hierarchy
- `dims.districts`: District-level information
- `dims.resources`: Educational resource catalog

#### Aggregate Tables
- `agg.daily_teacher_performance`: Daily teacher metrics
- `agg.weekly_school_metrics`: Weekly school summaries
- `agg.monthly_district_trends`: Monthly district trends

## Schema Design Principles

### Partitioning Strategy
- **Time-based partitioning**: By month for fact tables
- **High cardinality optimization**: Proper ORDER BY clauses
- **Compression**: LZ4 compression for optimal storage

### Performance Optimization
- **Materialized Views**: For frequently accessed aggregations
- **Proper indexing**: Skipping indexes for filter columns
- **TTL policies**: Automatic data lifecycle management

### Data Quality
- **Type safety**: Strict data type enforcement
- **Constraints**: Data validation at ingestion
- **Monitoring**: Built-in query performance tracking

## Analytics Capabilities

### CIQ Analytics
- Teacher performance trends over time
- Equity score distributions and benchmarks
- Wait time optimization tracking
- Student engagement correlation analysis

### Operational Analytics
- Resource usage patterns
- Community engagement metrics
- User adoption and retention
- System performance monitoring

### Reporting
- Executive dashboards
- Teacher progress reports
- School performance comparisons
- District-wide trend analysis

## Data Pipeline Integration

### ETL Flow
1. **Extract**: Data pulled from PostgreSQL via data-pipelines
2. **Transform**: Business logic applied in ETL layer
3. **Load**: Optimized batch inserts to ClickHouse
4. **Aggregate**: Real-time materialized view updates

### Incremental Updates
- **Real-time**: Hourly CIQ session updates
- **Batch**: Daily full dimension refreshes
- **Historical**: Monthly aggregation rebuilds

## Monitoring and Maintenance

### Health Checks
```bash
make health-check    # System health validation
make query-test      # Sample query validation
make performance     # Performance metrics
```

### Backup and Recovery
```bash
make backup          # Create full backup
make restore         # Restore from backup
make export-data     # Export specific datasets
```

### Performance Tuning
- Query performance monitoring via system.query_log
- Automatic optimization recommendations
- Resource usage tracking and alerts

## Development

### Adding New Tables
1. Create SQL definition in appropriate schema folder
2. Add to initialization scripts
3. Update ETL pipelines to populate data
4. Add health checks and monitoring

### Testing
```bash
make test-schema     # Validate schema definitions
make test-queries    # Test sample queries
make load-test       # Performance testing
```

## Production Deployment

### Azure ClickHouse
- Managed ClickHouse on Azure
- High availability configuration
- Automated backup and monitoring
- Security and access control

### Scaling Considerations
- Horizontal scaling with ClickHouse clusters
- Read replica configuration
- Query optimization and caching
- Resource allocation planning

## Support and Troubleshooting

### Common Issues
1. **Slow queries**: Check ORDER BY and WHERE clauses
2. **High memory usage**: Review aggregation complexity
3. **Insert failures**: Validate data types and constraints
4. **Connection issues**: Check network and authentication

### Monitoring
- Built-in system tables for query analysis
- Grafana dashboards for real-time monitoring
- Automated alerting for performance issues

## Contributing

1. Follow SQL formatting standards
2. Add proper comments and documentation
3. Test schema changes locally
4. Update migration scripts
5. Monitor performance impact