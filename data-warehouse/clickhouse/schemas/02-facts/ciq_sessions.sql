-- ANDI Data Warehouse - CIQ Sessions Fact Table
-- High-volume fact table for CIQ session analytics

USE andi_warehouse;

-- Drop table if exists (for development)
-- DROP TABLE IF EXISTS facts_ciq_sessions;

-- Create the main CIQ sessions fact table
CREATE TABLE IF NOT EXISTS facts_ciq_sessions
(
    -- Primary identifiers
    session_id UUID,
    teacher_id UUID,
    school_id UUID,
    district_id UUID,
    
    -- Time dimensions (for partitioning and analysis)
    session_date Date,
    session_timestamp DateTime64(3),
    session_year UInt16 MATERIALIZED toYear(session_date),
    session_month UInt8 MATERIALIZED toMonth(session_date),
    session_day_of_week UInt8 MATERIALIZED toDayOfWeek(session_date),
    session_hour UInt8 MATERIALIZED toHour(session_timestamp),
    
    -- Session metrics
    duration_seconds UInt32,
    duration_minutes Float32 MATERIALIZED duration_seconds / 60.0,
    
    -- CIQ Core Metrics (0-100 scale)
    equity_score Float32,
    wait_time_avg Float32,
    student_engagement Float32,
    overall_score Float32,
    
    -- Detailed time analysis (seconds)
    student_talk_time Float32,
    teacher_talk_time Float32,
    silence_time Float32,
    
    -- Interaction counts
    question_count UInt16,
    response_count UInt16,
    
    -- Calculated metrics
    student_talk_percentage Float32 MATERIALIZED CASE 
        WHEN duration_seconds > 0 THEN (student_talk_time / duration_seconds) * 100 
        ELSE 0 
    END,
    teacher_talk_percentage Float32 MATERIALIZED CASE 
        WHEN duration_seconds > 0 THEN (teacher_talk_time / duration_seconds) * 100 
        ELSE 0 
    END,
    silence_percentage Float32 MATERIALIZED CASE 
        WHEN duration_seconds > 0 THEN (silence_time / duration_seconds) * 100 
        ELSE 0 
    END,
    
    -- Quality indicators
    questions_per_minute Float32 MATERIALIZED CASE 
        WHEN duration_minutes > 0 THEN question_count / duration_minutes 
        ELSE 0 
    END,
    responses_per_minute Float32 MATERIALIZED CASE 
        WHEN duration_minutes > 0 THEN response_count / duration_minutes 
        ELSE 0 
    END,
    
    -- Performance categories (for easier reporting)
    equity_category String MATERIALIZED CASE
        WHEN equity_score >= 85 THEN 'Excellent'
        WHEN equity_score >= 75 THEN 'Good'
        WHEN equity_score >= 65 THEN 'Fair'
        ELSE 'Needs Improvement'
    END,
    
    overall_category String MATERIALIZED CASE
        WHEN overall_score >= 85 THEN 'Excellent'
        WHEN overall_score >= 75 THEN 'Good'
        WHEN overall_score >= 65 THEN 'Fair'
        ELSE 'Needs Improvement'
    END,
    
    -- Engagement level
    engagement_level String MATERIALIZED CASE
        WHEN student_engagement >= 80 THEN 'High'
        WHEN student_engagement >= 60 THEN 'Medium'
        ELSE 'Low'
    END,
    
    -- Metadata
    created_at DateTime64(3),
    updated_at DateTime64(3) DEFAULT now(),
    
    -- Data lineage
    etl_batch_id String DEFAULT '',
    data_source String DEFAULT 'postgresql'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(session_date)
ORDER BY (district_id, school_id, teacher_id, session_date, session_timestamp)
PRIMARY KEY (district_id, school_id, teacher_id, session_date)
SETTINGS 
    index_granularity = 8192,
    ttl_only_drop_parts = 1;

-- Add TTL for data retention (keep 3 years of data)
ALTER TABLE facts_ciq_sessions 
MODIFY TTL session_date + INTERVAL 3 YEAR;

-- Create indexes for common query patterns
ALTER TABLE facts_ciq_sessions 
ADD INDEX idx_teacher_score (teacher_id, overall_score) TYPE minmax GRANULARITY 1;

ALTER TABLE facts_ciq_sessions 
ADD INDEX idx_equity_score (equity_score) TYPE minmax GRANULARITY 1;

ALTER TABLE facts_ciq_sessions 
ADD INDEX idx_session_timestamp (session_timestamp) TYPE minmax GRANULARITY 1;

-- Create projection for teacher-centric queries
ALTER TABLE facts_ciq_sessions 
ADD PROJECTION projection_teacher_performance
(
    SELECT 
        teacher_id,
        school_id,
        district_id,
        session_date,
        count() as session_count,
        avg(overall_score) as avg_overall_score,
        avg(equity_score) as avg_equity_score,
        avg(student_engagement) as avg_engagement,
        sum(duration_minutes) as total_duration_minutes
    GROUP BY teacher_id, school_id, district_id, session_date
);

-- Create projection for school-level aggregations
ALTER TABLE facts_ciq_sessions 
ADD PROJECTION projection_school_metrics
(
    SELECT 
        school_id,
        district_id,
        session_date,
        count() as session_count,
        countDistinct(teacher_id) as teacher_count,
        avg(overall_score) as avg_school_score,
        avg(equity_score) as avg_equity_score,
        avg(student_engagement) as avg_engagement
    GROUP BY school_id, district_id, session_date
);

-- Optimize table after creation
OPTIMIZE TABLE facts_ciq_sessions;

-- Show table info
DESCRIBE facts_ciq_sessions;

-- Show table statistics
SELECT 
    'facts_ciq_sessions' as table_name,
    count() as total_rows,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size,
    formatReadableSize(sum(data_uncompressed_bytes)) as uncompressed_size,
    round(sum(data_compressed_bytes) / sum(data_uncompressed_bytes), 3) as compression_ratio,
    min(session_date) as earliest_session,
    max(session_date) as latest_session
FROM system.parts
WHERE database = 'andi_warehouse' AND table = 'facts_ciq_sessions' AND active = 1;