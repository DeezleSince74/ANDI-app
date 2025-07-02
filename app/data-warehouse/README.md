# Data Warehouse - ClickHouse Analytics

This directory contains ClickHouse configurations and schemas for ANDI's analytics data warehouse.

## Overview

ClickHouse powers the analytics layer for:
- Historical teaching pattern analysis
- Performance metrics aggregation
- Trend identification
- Large-scale data analytics

## Structure

```
data-warehouse/
├── schemas/           # Table definitions
├── migrations/        # Schema migrations
├── etl/              # ETL pipeline scripts
├── queries/          # Analytical queries
└── dashboards/       # Dashboard configs
```

## Key Tables

### Fact Tables
- `teaching_sessions` - Recording session facts
- `audio_metrics` - Audio analysis results
- `engagement_scores` - Calculated engagement metrics

### Dimension Tables
- `dim_teachers` - Teacher attributes
- `dim_schools` - School information
- `dim_time` - Time dimensions
- `dim_subjects` - Subject taxonomy

### Aggregation Tables
- `daily_teacher_stats` - Daily summaries
- `weekly_trends` - Weekly patterns
- `monthly_insights` - Monthly aggregations

## ETL Pipeline

1. **Extract**: From PostgreSQL/Supabase via scheduled jobs
2. **Transform**: Normalize and enrich data
3. **Load**: Batch insert to ClickHouse

## Performance

- Columnar storage for fast aggregations
- Partitioning by date
- Materialized views for common queries
- Distributed processing for scale