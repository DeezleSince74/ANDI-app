-- ANDI Data Warehouse - Community Activity Fact Table
-- Track Teacher Lounge forum and community engagement

USE andi_warehouse;

-- Create community activity fact table
CREATE TABLE IF NOT EXISTS facts_community_activity
(
    -- Primary identifiers
    activity_id UUID,
    user_id UUID,
    target_id UUID, -- Question ID, Answer ID, etc.
    
    -- Time dimensions
    activity_date Date,
    activity_timestamp DateTime64(3),
    activity_year UInt16 MATERIALIZED toYear(activity_date),
    activity_month UInt8 MATERIALIZED toMonth(activity_date),
    activity_day_of_week UInt8 MATERIALIZED toDayOfWeek(activity_date),
    activity_hour UInt8 MATERIALIZED toHour(activity_timestamp),
    
    -- Activity classification
    activity_type String, -- 'question_posted', 'answer_posted', 'vote_up', 'vote_down', 'bookmark', 'comment'
    target_type String, -- 'question', 'answer', 'comment'
    
    -- Content metadata
    content_title String DEFAULT '',
    content_tags Array(String) DEFAULT [],
    content_category String DEFAULT '', -- 'classroom_management', 'student_engagement', etc.
    content_grade_levels Array(String) DEFAULT [],
    content_subjects Array(String) DEFAULT [],
    
    -- User context (denormalized for performance)
    user_type String, -- 'teacher', 'coach', 'admin'
    user_school_id UUID,
    user_district_id UUID,
    user_years_experience UInt8 DEFAULT 0,
    
    -- Engagement metrics
    content_length UInt32 DEFAULT 0, -- Character count of posts/answers
    response_time_minutes UInt32 DEFAULT 0, -- Time to respond to questions
    
    -- Quality indicators
    received_votes UInt16 DEFAULT 0, -- Votes received on this content
    is_accepted_answer UInt8 DEFAULT 0, -- Boolean: is this an accepted answer?
    is_featured UInt8 DEFAULT 0, -- Boolean: is this featured content?
    helpful_score Float32 DEFAULT 0, -- Community helpfulness rating
    
    -- Calculated engagement metrics
    is_weekend UInt8 MATERIALIZED CASE 
        WHEN toDayOfWeek(activity_date) IN (6, 7) THEN 1 
        ELSE 0 
    END,
    
    is_after_hours UInt8 MATERIALIZED CASE 
        WHEN toHour(activity_timestamp) NOT BETWEEN 7 AND 18 THEN 1 
        ELSE 0 
    END,
    
    engagement_score Float32 MATERIALIZED CASE
        WHEN activity_type = 'question_posted' THEN 5.0
        WHEN activity_type = 'answer_posted' THEN 8.0
        WHEN activity_type = 'vote_up' THEN 1.0
        WHEN activity_type = 'vote_down' THEN 0.5
        WHEN activity_type = 'bookmark' THEN 2.0
        WHEN activity_type = 'comment' THEN 3.0
        ELSE 0.0
    END,
    
    content_quality_score Float32 MATERIALIZED CASE
        WHEN content_length = 0 THEN 0.0
        WHEN content_length < 50 THEN 1.0
        WHEN content_length < 200 THEN 2.0
        WHEN content_length < 500 THEN 3.0
        WHEN content_length < 1000 THEN 4.0
        ELSE 5.0
    END + CASE 
        WHEN received_votes > 10 THEN 2.0
        WHEN received_votes > 5 THEN 1.0
        ELSE 0.0
    END + CASE
        WHEN is_accepted_answer = 1 THEN 3.0
        ELSE 0.0
    END,
    
    -- Collaboration indicators
    is_cross_school_interaction UInt8 DEFAULT 0, -- Interaction between different schools
    is_cross_district_interaction UInt8 DEFAULT 0, -- Interaction between different districts
    
    -- Metadata
    created_at DateTime64(3),
    
    -- Data lineage
    etl_batch_id String DEFAULT '',
    data_source String DEFAULT 'postgresql'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(activity_date)
ORDER BY (user_district_id, user_school_id, user_id, activity_date, activity_timestamp)
PRIMARY KEY (user_district_id, user_school_id, user_id, activity_date)
SETTINGS 
    index_granularity = 8192,
    ttl_only_drop_parts = 1;

-- Add TTL for data retention (keep 2 years of detailed data)
ALTER TABLE facts_community_activity 
MODIFY TTL activity_date + INTERVAL 2 YEAR;

-- Create indexes for common query patterns
ALTER TABLE facts_community_activity 
ADD INDEX idx_activity_type (activity_type, target_type) TYPE set(20) GRANULARITY 1;

ALTER TABLE facts_community_activity 
ADD INDEX idx_content_category (content_category) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE facts_community_activity 
ADD INDEX idx_engagement_score (engagement_score) TYPE minmax GRANULARITY 1;

ALTER TABLE facts_community_activity 
ADD INDEX idx_content_tags (content_tags) TYPE bloom_filter(0.01) GRANULARITY 1;

-- Create projection for community engagement analysis
ALTER TABLE facts_community_activity 
ADD PROJECTION projection_community_engagement
(
    SELECT 
        user_id,
        user_type,
        user_school_id,
        user_district_id,
        activity_date,
        count() as total_activities,
        sum(engagement_score) as total_engagement_score,
        avg(engagement_score) as avg_engagement_score,
        countIf(activity_type = 'question_posted') as questions_posted,
        countIf(activity_type = 'answer_posted') as answers_posted,
        countIf(activity_type LIKE '%vote%') as votes_cast,
        countIf(is_accepted_answer = 1) as accepted_answers,
        avg(content_quality_score) as avg_content_quality,
        countDistinct(content_category) as categories_engaged
    GROUP BY user_id, user_type, user_school_id, user_district_id, activity_date
);

-- Create projection for content popularity and trends
ALTER TABLE facts_community_activity 
ADD PROJECTION projection_content_trends
(
    SELECT 
        content_category,
        activity_date,
        activity_type,
        count() as activity_count,
        countDistinct(user_id) as unique_participants,
        sum(engagement_score) as total_engagement,
        avg(content_quality_score) as avg_content_quality,
        sum(received_votes) as total_votes,
        countIf(is_featured = 1) as featured_content_count,
        countIf(is_cross_school_interaction = 1) as cross_school_interactions,
        countIf(is_cross_district_interaction = 1) as cross_district_interactions
    GROUP BY content_category, activity_date, activity_type
);

-- Create projection for school/district collaboration analysis
ALTER TABLE facts_community_activity 
ADD PROJECTION projection_collaboration_metrics
(
    SELECT 
        user_school_id,
        user_district_id,
        activity_date,
        count() as total_activities,
        countDistinct(user_id) as active_users,
        sum(is_cross_school_interaction) as cross_school_interactions,
        sum(is_cross_district_interaction) as cross_district_interactions,
        avg(content_quality_score) as avg_content_quality,
        sum(engagement_score) as total_engagement_score
    GROUP BY user_school_id, user_district_id, activity_date
);

-- Optimize table after creation
OPTIMIZE TABLE facts_community_activity;

-- Show table info
DESCRIBE facts_community_activity;

-- Validation query
SELECT 
    'facts_community_activity' as table_name,
    count() as total_rows,
    countDistinct(user_id) as unique_users,
    countDistinct(activity_type) as activity_types,
    countDistinct(content_category) as content_categories,
    sum(engagement_score) as total_engagement_score,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM system.parts
WHERE database = 'andi_warehouse' AND table = 'facts_community_activity' AND active = 1;