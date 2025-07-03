-- ANDI Data Warehouse - Resource Usage Fact Table
-- Track resource interactions and usage patterns

USE andi_warehouse;

-- Create resource usage fact table
CREATE TABLE IF NOT EXISTS facts_resource_usage
(
    -- Primary identifiers
    interaction_id UUID,
    user_id UUID,
    resource_id UUID,
    
    -- Time dimensions
    interaction_date Date,
    interaction_timestamp DateTime64(3),
    interaction_year UInt16 MATERIALIZED toYear(interaction_date),
    interaction_month UInt8 MATERIALIZED toMonth(interaction_date),
    interaction_day_of_week UInt8 MATERIALIZED toDayOfWeek(interaction_date),
    interaction_hour UInt8 MATERIALIZED toHour(interaction_timestamp),
    
    -- Interaction details
    interaction_type String, -- 'view', 'like', 'bookmark', 'download', 'share'
    
    -- Resource metadata (denormalized for performance)
    resource_title String,
    resource_type String, -- 'article', 'video', 'tool', 'template', 'guide'
    resource_category String, -- 'classroom_management', 'student_engagement', 'wait_time', etc.
    resource_grade_levels Array(String),
    resource_subjects Array(String),
    resource_tags Array(String),
    
    -- User context (denormalized)
    user_type String, -- 'teacher', 'coach', 'admin'
    user_school_id UUID,
    user_district_id UUID,
    
    -- Engagement metrics
    session_duration_seconds UInt32 DEFAULT 0, -- How long they engaged with resource
    bounce_rate Float32 DEFAULT 0, -- Did they immediately leave?
    
    -- Content scoring (if available)
    user_rating UInt8 DEFAULT 0, -- 1-5 star rating
    helpful_votes UInt16 DEFAULT 0,
    
    -- Calculated fields
    is_weekend UInt8 MATERIALIZED CASE 
        WHEN toDayOfWeek(interaction_date) IN (6, 7) THEN 1 
        ELSE 0 
    END,
    
    is_after_hours UInt8 MATERIALIZED CASE 
        WHEN toHour(interaction_timestamp) NOT BETWEEN 7 AND 18 THEN 1 
        ELSE 0 
    END,
    
    engagement_score Float32 MATERIALIZED CASE
        WHEN interaction_type = 'view' THEN 1.0
        WHEN interaction_type = 'like' THEN 2.0
        WHEN interaction_type = 'bookmark' THEN 3.0
        WHEN interaction_type = 'download' THEN 4.0
        WHEN interaction_type = 'share' THEN 5.0
        ELSE 0.0
    END,
    
    -- Metadata
    created_at DateTime64(3),
    
    -- Data lineage
    etl_batch_id String DEFAULT '',
    data_source String DEFAULT 'postgresql'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(interaction_date)
ORDER BY (user_district_id, user_school_id, user_id, interaction_date, interaction_timestamp)
PRIMARY KEY (user_district_id, user_school_id, user_id, interaction_date)
SETTINGS 
    index_granularity = 8192,
    ttl_only_drop_parts = 1;

-- Add TTL for data retention (keep 2 years of detailed data)
ALTER TABLE facts_resource_usage 
MODIFY TTL interaction_date + INTERVAL 2 YEAR;

-- Create indexes for common query patterns
ALTER TABLE facts_resource_usage 
ADD INDEX idx_resource_type (resource_type, resource_category) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE facts_resource_usage 
ADD INDEX idx_interaction_type (interaction_type) TYPE set(10) GRANULARITY 1;

ALTER TABLE facts_resource_usage 
ADD INDEX idx_user_engagement (user_id, engagement_score) TYPE minmax GRANULARITY 1;

-- Create projection for resource popularity analysis
ALTER TABLE facts_resource_usage 
ADD PROJECTION projection_resource_popularity
(
    SELECT 
        resource_id,
        resource_type,
        resource_category,
        interaction_date,
        count() as total_interactions,
        countDistinct(user_id) as unique_users,
        sum(engagement_score) as total_engagement_score,
        avg(engagement_score) as avg_engagement_score,
        countIf(interaction_type = 'view') as views,
        countIf(interaction_type = 'like') as likes,
        countIf(interaction_type = 'bookmark') as bookmarks,
        countIf(interaction_type = 'download') as downloads,
        countIf(interaction_type = 'share') as shares
    GROUP BY resource_id, resource_type, resource_category, interaction_date
);

-- Create projection for user engagement patterns
ALTER TABLE facts_resource_usage 
ADD PROJECTION projection_user_engagement
(
    SELECT 
        user_id,
        user_type,
        user_school_id,
        user_district_id,
        interaction_date,
        count() as total_interactions,
        countDistinct(resource_id) as unique_resources,
        sum(engagement_score) as total_engagement_score,
        avg(session_duration_seconds) as avg_session_duration,
        countDistinct(resource_category) as categories_explored
    GROUP BY user_id, user_type, user_school_id, user_district_id, interaction_date
);

-- Optimize table after creation
OPTIMIZE TABLE facts_resource_usage;

-- Show table info
DESCRIBE facts_resource_usage;

-- Create a sample query to validate the structure
SELECT 
    'facts_resource_usage' as table_name,
    count() as total_rows,
    countDistinct(user_id) as unique_users,
    countDistinct(resource_id) as unique_resources,
    countDistinct(interaction_type) as interaction_types,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM system.parts
WHERE database = 'andi_warehouse' AND table = 'facts_resource_usage' AND active = 1;