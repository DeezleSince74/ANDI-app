-- ANDI Data Warehouse - Complete Initialization Script
-- Execute all schema creation in proper order

-- Set session parameters for optimal setup
SET allow_experimental_object_type = 1;
SET allow_experimental_variant_type = 1;
SET log_queries = 1;
SET max_memory_usage = 10000000000;
SET max_threads = 8;

-- Start transaction (ClickHouse doesn't have transactions, but we'll do this atomically)
SELECT 'Starting ANDI Data Warehouse initialization...' as status, now() as timestamp;

-- 1. Create databases and basic setup
SOURCE 01-databases.sql;

-- Wait a moment for the database to be fully created
SELECT sleep(2);

-- 2. Create fact tables
SELECT 'Creating fact tables...' as status, now() as timestamp;
SOURCE 02-facts/ciq_sessions.sql;
SOURCE 02-facts/resource_usage.sql;
SOURCE 02-facts/community_activity.sql;

-- 3. Create dimension tables
SELECT 'Creating dimension tables...' as status, now() as timestamp;
SOURCE 03-dims/teachers.sql;
SOURCE 03-dims/schools.sql;
SOURCE 03-dims/districts.sql;
SOURCE 03-dims/resources.sql;

-- 4. Create aggregation tables
SELECT 'Creating aggregation tables...' as status, now() as timestamp;
SOURCE 04-aggregates/daily_teacher_performance.sql;
SOURCE 04-aggregates/weekly_school_metrics.sql;
SOURCE 04-aggregates/monthly_district_trends.sql;

-- 5. Create additional analytical views
SELECT 'Creating analytical views...' as status, now() as timestamp;

-- View for comprehensive teacher analytics
CREATE VIEW IF NOT EXISTS v_teacher_comprehensive_analytics AS
SELECT 
    dt.teacher_id,
    dt.full_name as teacher_name,
    dt.email,
    ds.school_name,
    dd.district_name,
    dt.years_experience,
    dt.grade_levels,
    dt.subjects,
    dt.performance_tier,
    dt.avg_ciq_score,
    
    -- Recent performance (last 30 days)
    adtp.avg_overall_score as recent_avg_score,
    adtp.session_count as recent_sessions,
    adtp.performance_tier as recent_performance_tier,
    
    -- Trends
    CASE 
        WHEN adtp.overall_score_change > 2.0 THEN 'Improving'
        WHEN adtp.overall_score_change < -2.0 THEN 'Declining'
        ELSE 'Stable'
    END as trend_direction,
    
    -- Goals and development
    dt.current_goals,
    dt.focus_areas,
    dt.strengths
FROM mv_current_teachers dt
LEFT JOIN mv_current_schools ds ON dt.school_id = ds.school_id
LEFT JOIN mv_current_districts dd ON dt.district_id = dd.district_id
LEFT JOIN (
    SELECT teacher_id, 
           avg(avg_overall_score) as avg_overall_score,
           sum(session_count) as session_count,
           performance_tier,
           avg(overall_score_change) as overall_score_change
    FROM agg_daily_teacher_performance 
    WHERE performance_date >= today() - INTERVAL 30 DAY
    GROUP BY teacher_id, performance_tier
) adtp ON dt.teacher_id = adtp.teacher_id;

-- View for school leadership dashboard
CREATE VIEW IF NOT EXISTS v_school_leadership_dashboard AS
SELECT 
    ds.school_id,
    ds.school_name,
    ds.district_name,
    ds.principal_name,
    ds.total_andi_teachers,
    ds.avg_school_ciq_score,
    ds.performance_tier,
    
    -- Recent weekly performance
    awsm.avg_school_overall_score as recent_avg_score,
    awsm.active_teachers as recent_active_teachers,
    awsm.engagement_rate as recent_engagement_rate,
    awsm.school_performance_tier as recent_performance_tier,
    awsm.goal_achievement_rate,
    
    -- Teacher distribution
    awsm.teachers_excellent,
    awsm.teachers_good,
    awsm.teachers_fair,
    awsm.teachers_poor,
    awsm.teachers_needing_support,
    
    -- Performance consistency
    awsm.performance_consistency,
    awsm.score_standard_deviation,
    
    -- Improvement areas
    CASE 
        WHEN awsm.avg_school_equity_score < awsm.avg_school_wait_time_score 
         AND awsm.avg_school_equity_score < awsm.avg_school_engagement_score THEN 'Equity'
        WHEN awsm.avg_school_wait_time_score < awsm.avg_school_engagement_score THEN 'Wait Time'
        ELSE 'Student Engagement'
    END as primary_focus_area
FROM mv_current_schools ds
LEFT JOIN (
    SELECT school_id,
           avg_school_overall_score,
           active_teachers,
           engagement_rate,
           school_performance_tier,
           goal_achievement_rate,
           teachers_excellent,
           teachers_good,
           teachers_fair,
           teachers_poor,
           teachers_needing_support,
           performance_consistency,
           score_standard_deviation,
           avg_school_equity_score,
           avg_school_wait_time_score,
           avg_school_engagement_score
    FROM agg_weekly_school_metrics 
    WHERE week_start_date = (
        SELECT max(week_start_date) 
        FROM agg_weekly_school_metrics
    )
) awsm ON ds.school_id = awsm.school_id;

-- View for district executive dashboard
CREATE VIEW IF NOT EXISTS v_district_executive_dashboard AS
SELECT 
    dd.district_id,
    dd.district_name,
    dd.state,
    dd.superintendent_name,
    dd.total_schools,
    dd.total_teachers,
    dd.avg_district_ciq_score,
    dd.performance_tier,
    
    -- Recent monthly performance
    amdt.avg_district_overall_score as recent_avg_score,
    amdt.participating_schools,
    amdt.active_teachers as recent_active_teachers,
    amdt.district_performance_tier as recent_performance_tier,
    amdt.trend_direction,
    amdt.district_goal_achievement_rate,
    
    -- Distribution metrics
    amdt.schools_exemplary,
    amdt.schools_high_performing,
    amdt.schools_proficient,
    amdt.schools_developing,
    amdt.schools_needs_support,
    
    -- Adoption metrics
    amdt.school_participation_rate,
    amdt.teacher_adoption_rate,
    amdt.teacher_engagement_rate,
    
    -- Strategic indicators
    amdt.performance_consistency,
    amdt.schools_improving,
    amdt.schools_declining,
    amdt.teachers_needing_support
FROM mv_current_districts dd
LEFT JOIN (
    SELECT district_id,
           avg_district_overall_score,
           participating_schools,
           active_teachers,
           district_performance_tier,
           trend_direction,
           district_goal_achievement_rate,
           schools_exemplary,
           schools_high_performing,
           schools_proficient,
           schools_developing,
           schools_needs_support,
           school_participation_rate,
           teacher_adoption_rate,
           teacher_engagement_rate,
           performance_consistency,
           schools_improving,
           schools_declining,
           teachers_needing_support
    FROM agg_monthly_district_trends 
    WHERE month_start_date = (
        SELECT max(month_start_date) 
        FROM agg_monthly_district_trends
    )
) amdt ON dd.district_id = amdt.district_id;

-- 6. Create system monitoring and health check views
SELECT 'Creating monitoring views...' as status, now() as timestamp;

-- Table sizes and row counts
CREATE VIEW IF NOT EXISTS v_warehouse_table_stats AS
SELECT 
    database,
    table,
    sum(rows) as total_rows,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size,
    formatReadableSize(sum(data_uncompressed_bytes)) as uncompressed_size,
    round(sum(data_compressed_bytes) / sum(data_uncompressed_bytes), 3) as compression_ratio,
    count() as part_count,
    min(min_date) as earliest_data,
    max(max_date) as latest_data
FROM system.parts
WHERE database = 'andi_warehouse' AND active = 1
GROUP BY database, table
ORDER BY sum(rows) DESC;

-- Data freshness monitoring
CREATE VIEW IF NOT EXISTS v_data_freshness_monitor AS
SELECT 
    'CIQ Sessions' as data_type,
    count(*) as total_records,
    max(created_at) as latest_record,
    date_diff('hour', max(created_at), now()) as hours_since_latest,
    CASE 
        WHEN date_diff('hour', max(created_at), now()) <= 2 THEN 'Fresh'
        WHEN date_diff('hour', max(created_at), now()) <= 24 THEN 'Acceptable'
        WHEN date_diff('hour', max(created_at), now()) <= 72 THEN 'Stale'
        ELSE 'Critical'
    END as freshness_status
FROM facts_ciq_sessions
WHERE created_at >= today() - INTERVAL 7 DAY

UNION ALL

SELECT 
    'Teacher Performance' as data_type,
    count(*) as total_records,
    max(created_at) as latest_record,
    date_diff('hour', max(created_at), now()) as hours_since_latest,
    CASE 
        WHEN date_diff('hour', max(created_at), now()) <= 24 THEN 'Fresh'
        WHEN date_diff('hour', max(created_at), now()) <= 48 THEN 'Acceptable'
        WHEN date_diff('hour', max(created_at), now()) <= 96 THEN 'Stale'
        ELSE 'Critical'
    END as freshness_status
FROM agg_daily_teacher_performance
WHERE performance_date >= today() - INTERVAL 7 DAY;

-- Query performance monitoring
CREATE VIEW IF NOT EXISTS v_query_performance_monitor AS
SELECT 
    toStartOfHour(event_time) as hour,
    count() as query_count,
    avg(query_duration_ms) as avg_duration_ms,
    quantile(0.95)(query_duration_ms) as p95_duration_ms,
    countIf(type = 'QueryFinish' AND exception = '') as successful_queries,
    countIf(type = 'ExceptionBeforeStart' OR exception != '') as failed_queries,
    (countIf(type = 'QueryFinish' AND exception = '') * 100.0) / count() as success_rate
FROM system.query_log
WHERE event_date >= today() - INTERVAL 7 DAY
  AND database = 'andi_warehouse'
  AND query_kind = 'Select'
GROUP BY toStartOfHour(event_time)
ORDER BY hour DESC
LIMIT 168; -- Last 7 days hourly

-- 7. Create data quality validation functions
SELECT 'Creating data quality checks...' as status, now() as timestamp;

-- Basic data quality checks
CREATE VIEW IF NOT EXISTS v_data_quality_checks AS
SELECT 
    'CIQ Sessions - Invalid Scores' as check_name,
    countIf(overall_score < 0 OR overall_score > 100) as violation_count,
    count() as total_records,
    (countIf(overall_score < 0 OR overall_score > 100) * 100.0) / count() as violation_rate
FROM facts_ciq_sessions
WHERE session_date >= today() - INTERVAL 7 DAY

UNION ALL

SELECT 
    'CIQ Sessions - Missing Teacher IDs' as check_name,
    countIf(teacher_id = '00000000-0000-0000-0000-000000000000' OR teacher_id IS NULL) as violation_count,
    count() as total_records,
    (countIf(teacher_id = '00000000-0000-0000-0000-000000000000' OR teacher_id IS NULL) * 100.0) / count() as violation_rate
FROM facts_ciq_sessions
WHERE session_date >= today() - INTERVAL 7 DAY

UNION ALL

SELECT 
    'Teachers - Missing Performance Data' as check_name,
    countIf(avg_ciq_score = 0 OR avg_ciq_score IS NULL) as violation_count,
    count() as total_records,
    (countIf(avg_ciq_score = 0 OR avg_ciq_score IS NULL) * 100.0) / count() as violation_rate
FROM mv_current_teachers;

-- 8. Set up table optimization schedule (manual for now, would be automated in production)
SELECT 'Setting up optimization recommendations...' as status, now() as timestamp;

-- Create a view for optimization recommendations
CREATE VIEW IF NOT EXISTS v_optimization_recommendations AS
SELECT 
    database,
    table,
    sum(rows) as total_rows,
    count() as part_count,
    formatReadableSize(sum(data_compressed_bytes)) as size,
    CASE 
        WHEN count() > 100 THEN 'OPTIMIZE table - too many parts'
        WHEN sum(rows) = 0 THEN 'CHECK table - no data'
        WHEN max(modification_time) < now() - INTERVAL 7 DAY THEN 'REVIEW - no recent updates'
        ELSE 'OK'
    END as recommendation
FROM system.parts
WHERE database = 'andi_warehouse' AND active = 1
GROUP BY database, table
ORDER BY sum(rows) DESC;

-- Final validation and completion
SELECT 'ANDI Data Warehouse initialization completed successfully!' as status, now() as timestamp;

-- Show summary of created objects
SELECT 'Summary of created objects:' as summary;

SELECT 'Tables:' as object_type, count() as count
FROM system.tables 
WHERE database = 'andi_warehouse' AND engine LIKE '%MergeTree%'

UNION ALL

SELECT 'Views:' as object_type, count() as count
FROM system.tables 
WHERE database = 'andi_warehouse' AND engine = 'View'

UNION ALL

SELECT 'Materialized Views:' as object_type, count() as count
FROM system.tables 
WHERE database = 'andi_warehouse' AND engine = 'MaterializedView';

-- Display table sizes
SELECT 'Table sizes:' as info;
SELECT * FROM v_warehouse_table_stats ORDER BY total_rows DESC;

-- Show data quality status
SELECT 'Data quality checks:' as info;
SELECT * FROM v_data_quality_checks;

SELECT 'Initialization complete! Data warehouse is ready for ETL processes.' as final_status, now() as completion_time;