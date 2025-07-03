-- ANDI Data Warehouse - Daily Teacher Performance Aggregation Table
-- Pre-computed daily metrics for fast teacher analytics

USE andi_warehouse;

-- Create daily teacher performance aggregation table
CREATE TABLE IF NOT EXISTS agg_daily_teacher_performance
(
    -- Date and identifiers
    performance_date Date,
    teacher_id UUID,
    school_id UUID,
    district_id UUID,
    
    -- Session counts and duration
    session_count UInt16,
    total_duration_minutes Float32,
    avg_session_duration_minutes Float32,
    
    -- CIQ Score Metrics
    avg_overall_score Float32,
    avg_equity_score Float32,
    avg_wait_time_score Float32,
    avg_student_engagement Float32,
    
    -- CIQ Score Ranges (for distribution analysis)
    min_overall_score Float32,
    max_overall_score Float32,
    overall_score_std_dev Float32,
    
    -- Performance counts by category
    excellent_sessions UInt16, -- overall_score >= 85
    good_sessions UInt16,      -- 75 <= overall_score < 85
    fair_sessions UInt16,      -- 65 <= overall_score < 75
    poor_sessions UInt16,      -- overall_score < 65
    
    -- Detailed interaction metrics
    total_questions UInt32,
    total_responses UInt32,
    avg_questions_per_session Float32,
    avg_responses_per_session Float32,
    
    -- Time distribution metrics
    avg_student_talk_percentage Float32,
    avg_teacher_talk_percentage Float32,
    avg_silence_percentage Float32,
    
    -- Performance trends (compared to previous day)
    overall_score_change Float32 DEFAULT 0.0,
    equity_score_change Float32 DEFAULT 0.0,
    engagement_change Float32 DEFAULT 0.0,
    
    -- Weekly context (rolling 7-day averages)
    rolling_7day_avg_score Float32 DEFAULT 0.0,
    rolling_7day_session_count UInt16 DEFAULT 0,
    
    -- Performance indicators
    is_improving UInt8 MATERIALIZED CASE 
        WHEN overall_score_change > 2.0 THEN 1 
        ELSE 0 
    END,
    
    is_declining UInt8 MATERIALIZED CASE 
        WHEN overall_score_change < -2.0 THEN 1 
        ELSE 0 
    END,
    
    consistency_score Float32 MATERIALIZED CASE
        WHEN overall_score_std_dev <= 5.0 THEN 100.0
        WHEN overall_score_std_dev <= 10.0 THEN 80.0
        WHEN overall_score_std_dev <= 15.0 THEN 60.0
        WHEN overall_score_std_dev <= 20.0 THEN 40.0
        ELSE 20.0
    END,
    
    performance_tier String MATERIALIZED CASE
        WHEN avg_overall_score >= 85 THEN 'Excellent'
        WHEN avg_overall_score >= 75 THEN 'Good'
        WHEN avg_overall_score >= 65 THEN 'Fair'
        ELSE 'Needs Improvement'
    END,
    
    -- Goal achievement tracking
    daily_goal_met UInt8 DEFAULT 0, -- Did teacher meet their daily goal?
    streak_days UInt16 DEFAULT 0,   -- Consecutive days meeting goals
    
    -- Calculated session quality score
    session_quality_score Float32 MATERIALIZED (
        (avg_overall_score * 0.4) + 
        (consistency_score * 0.3) + 
        (session_count * 2.0) + 
        (CASE WHEN total_duration_minutes >= 30 THEN 10.0 ELSE 0.0 END)
    ),
    
    -- Metadata
    created_at DateTime64(3) DEFAULT now(),
    updated_at DateTime64(3) DEFAULT now(),
    
    -- Data lineage
    etl_batch_id String DEFAULT '',
    calculation_timestamp DateTime64(3) DEFAULT now()
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(performance_date)
ORDER BY (district_id, school_id, teacher_id, performance_date)
PRIMARY KEY (district_id, school_id, teacher_id, performance_date)
SETTINGS 
    index_granularity = 8192;

-- Create indexes for common query patterns
ALTER TABLE agg_daily_teacher_performance 
ADD INDEX idx_performance_date (performance_date) TYPE minmax GRANULARITY 1;

ALTER TABLE agg_daily_teacher_performance 
ADD INDEX idx_performance_tier (performance_tier, avg_overall_score) TYPE set(10) GRANULARITY 1;

ALTER TABLE agg_daily_teacher_performance 
ADD INDEX idx_session_count (session_count, total_duration_minutes) TYPE minmax GRANULARITY 1;

-- Create materialized view to automatically populate from facts table
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_teacher_performance_populate
TO agg_daily_teacher_performance
AS SELECT 
    session_date as performance_date,
    teacher_id,
    school_id,
    district_id,
    
    -- Session metrics
    count() as session_count,
    sum(duration_minutes) as total_duration_minutes,
    avg(duration_minutes) as avg_session_duration_minutes,
    
    -- CIQ score metrics
    avg(overall_score) as avg_overall_score,
    avg(equity_score) as avg_equity_score,
    avg(wait_time_avg) as avg_wait_time_score,
    avg(student_engagement) as avg_student_engagement,
    
    -- Score ranges
    min(overall_score) as min_overall_score,
    max(overall_score) as max_overall_score,
    stddevPop(overall_score) as overall_score_std_dev,
    
    -- Performance categories
    countIf(overall_score >= 85) as excellent_sessions,
    countIf(overall_score >= 75 AND overall_score < 85) as good_sessions,
    countIf(overall_score >= 65 AND overall_score < 75) as fair_sessions,
    countIf(overall_score < 65) as poor_sessions,
    
    -- Interaction metrics
    sum(question_count) as total_questions,
    sum(response_count) as total_responses,
    avg(question_count) as avg_questions_per_session,
    avg(response_count) as avg_responses_per_session,
    
    -- Time distribution
    avg(student_talk_percentage) as avg_student_talk_percentage,
    avg(teacher_talk_percentage) as avg_teacher_talk_percentage,
    avg(silence_percentage) as avg_silence_percentage,
    
    -- Defaults for calculated fields (will be updated by ETL process)
    0.0 as overall_score_change,
    0.0 as equity_score_change,
    0.0 as engagement_change,
    0.0 as rolling_7day_avg_score,
    0 as rolling_7day_session_count,
    0 as daily_goal_met,
    0 as streak_days,
    
    now() as created_at,
    now() as updated_at,
    '' as etl_batch_id,
    now() as calculation_timestamp
FROM facts_ciq_sessions
GROUP BY session_date, teacher_id, school_id, district_id;

-- Create view for teacher performance trends
CREATE VIEW IF NOT EXISTS v_teacher_performance_trends AS
SELECT 
    teacher_id,
    school_id,
    district_id,
    performance_date,
    avg_overall_score,
    avg_equity_score,
    avg_student_engagement,
    session_count,
    performance_tier,
    
    -- Calculate 7-day moving averages
    avg(avg_overall_score) OVER (
        PARTITION BY teacher_id 
        ORDER BY performance_date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7day_score,
    
    -- Calculate 30-day moving averages
    avg(avg_overall_score) OVER (
        PARTITION BY teacher_id 
        ORDER BY performance_date 
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) as moving_avg_30day_score,
    
    -- Calculate week-over-week change
    avg_overall_score - lag(avg_overall_score, 7) OVER (
        PARTITION BY teacher_id 
        ORDER BY performance_date
    ) as week_over_week_change,
    
    -- Rank teachers within their school
    rank() OVER (
        PARTITION BY school_id, performance_date 
        ORDER BY avg_overall_score DESC
    ) as school_rank,
    
    -- Calculate percentile within district
    percent_rank() OVER (
        PARTITION BY district_id, performance_date 
        ORDER BY avg_overall_score
    ) as district_percentile
FROM agg_daily_teacher_performance
WHERE performance_date >= today() - INTERVAL 90 DAY;

-- Create view for teacher goal tracking
CREATE VIEW IF NOT EXISTS v_teacher_goal_progress AS
SELECT 
    teacher_id,
    school_id,
    district_id,
    count(*) as total_days,
    sum(daily_goal_met) as days_goal_met,
    (sum(daily_goal_met) * 100.0) / count(*) as goal_achievement_rate,
    max(streak_days) as longest_streak,
    avg(avg_overall_score) as period_avg_score,
    min(performance_date) as period_start,
    max(performance_date) as period_end,
    
    -- Performance consistency
    stddevPop(avg_overall_score) as score_consistency,
    
    -- Improvement calculation
    CASE 
        WHEN count(*) >= 14 THEN
            (avg(CASE WHEN performance_date >= max(performance_date) - INTERVAL 7 DAY THEN avg_overall_score END) -
             avg(CASE WHEN performance_date <= min(performance_date) + INTERVAL 7 DAY THEN avg_overall_score END))
        ELSE 0.0
    END as improvement_score
FROM agg_daily_teacher_performance
WHERE performance_date >= today() - INTERVAL 30 DAY
GROUP BY teacher_id, school_id, district_id;

-- Optimize table after creation
OPTIMIZE TABLE agg_daily_teacher_performance;

-- Show table info
DESCRIBE agg_daily_teacher_performance;

-- Validation query
SELECT 
    'agg_daily_teacher_performance' as table_name,
    count() as total_records,
    countDistinct(teacher_id) as unique_teachers,
    countDistinct(performance_date) as unique_dates,
    sum(session_count) as total_sessions_aggregated,
    avg(avg_overall_score) as overall_avg_score,
    min(performance_date) as earliest_date,
    max(performance_date) as latest_date,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM agg_daily_teacher_performance adtp
LEFT JOIN system.parts sp ON sp.table = 'agg_daily_teacher_performance' AND sp.database = 'andi_warehouse' AND sp.active = 1;