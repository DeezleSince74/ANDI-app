-- ANDI Data Warehouse - Resources Dimension Table
-- Slowly Changing Dimension (SCD Type 2) for educational resources

USE andi_warehouse;

-- Create resources dimension table
CREATE TABLE IF NOT EXISTS dims_resources
(
    -- Surrogate key
    resource_key UInt64 DEFAULT 0,
    
    -- Natural key (from source system)
    resource_id UUID,
    
    -- Basic resource information
    resource_title String,
    resource_description String,
    resource_url String,
    image_url String DEFAULT '',
    
    -- Content classification
    resource_type String, -- 'article', 'video', 'tool', 'template', 'guide', 'webinar', 'podcast'
    resource_category String, -- 'classroom_management', 'student_engagement', 'wait_time', 'equity', etc.
    content_format String DEFAULT '', -- 'pdf', 'html', 'video/mp4', 'interactive', etc.
    
    -- Educational metadata
    grade_levels Array(String), -- ['K', '1', '2'] or ['9', '10', '11', '12']
    subjects Array(String), -- ['Mathematics', 'Science', 'English Language Arts']
    tags Array(String), -- Flexible tagging system
    difficulty_level String DEFAULT '', -- 'beginner', 'intermediate', 'advanced'
    
    -- Content attributes
    estimated_duration_minutes UInt16 DEFAULT 0, -- Time to consume content
    content_length_words UInt32 DEFAULT 0, -- For text content
    language String DEFAULT 'English',
    accessibility_features Array(String) DEFAULT [], -- 'closed_captions', 'audio_description', etc.
    
    -- Source and authorship
    content_source String DEFAULT '', -- 'internal', 'external', 'user_generated'
    author_name String DEFAULT '',
    author_organization String DEFAULT '',
    publication_date Date DEFAULT '1900-01-01',
    last_updated Date DEFAULT '1900-01-01',
    
    -- Quality and curation
    is_featured UInt8 DEFAULT 0,
    is_premium UInt8 DEFAULT 0,
    curation_status String DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_review'
    quality_score Float32 DEFAULT 0.0, -- 0-10 internal quality rating
    
    -- Usage and engagement metrics
    total_views UInt32 DEFAULT 0,
    total_likes UInt32 DEFAULT 0,
    total_bookmarks UInt32 DEFAULT 0,
    total_downloads UInt32 DEFAULT 0,
    total_shares UInt32 DEFAULT 0,
    
    -- User feedback
    average_rating Float32 DEFAULT 0.0, -- 1-5 star average
    total_ratings UInt32 DEFAULT 0,
    helpful_votes UInt32 DEFAULT 0,
    unhelpful_votes UInt32 DEFAULT 0,
    
    -- Calculated engagement metrics
    engagement_score Float32 MATERIALIZED (
        (total_views * 1.0) + 
        (total_likes * 2.0) + 
        (total_bookmarks * 3.0) + 
        (total_downloads * 4.0) + 
        (total_shares * 5.0)
    ) / GREATEST(total_views, 1),
    
    popularity_tier String MATERIALIZED CASE
        WHEN total_views >= 1000 THEN 'Highly Popular'
        WHEN total_views >= 500 THEN 'Popular'
        WHEN total_views >= 100 THEN 'Moderately Popular'
        WHEN total_views >= 10 THEN 'Emerging'
        ELSE 'New'
    END,
    
    user_satisfaction String MATERIALIZED CASE
        WHEN average_rating >= 4.5 THEN 'Excellent'
        WHEN average_rating >= 4.0 THEN 'Very Good'
        WHEN average_rating >= 3.5 THEN 'Good'
        WHEN average_rating >= 3.0 THEN 'Fair'
        ELSE 'Poor'
    END,
    
    content_freshness String MATERIALIZED CASE
        WHEN last_updated >= today() - INTERVAL 30 DAY THEN 'Very Fresh'
        WHEN last_updated >= today() - INTERVAL 90 DAY THEN 'Fresh'
        WHEN last_updated >= today() - INTERVAL 180 DAY THEN 'Recent'
        WHEN last_updated >= today() - INTERVAL 365 DAY THEN 'Aging'
        ELSE 'Outdated'
    END,
    
    -- CIQ Framework alignment
    ciq_alignment Array(String) DEFAULT [], -- 'equity', 'wait_time', 'engagement', 'classroom_management'
    research_based UInt8 DEFAULT 0, -- Is this resource based on research?
    evidence_level String DEFAULT '', -- 'high', 'moderate', 'emerging', 'opinion'
    
    -- Implementation guidance
    implementation_difficulty String DEFAULT '', -- 'easy', 'moderate', 'challenging'
    preparation_time_minutes UInt16 DEFAULT 0,
    materials_needed Array(String) DEFAULT [],
    prerequisites Array(String) DEFAULT [],
    
    -- Related content
    related_resources Array(UUID) DEFAULT [],
    part_of_series UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    series_order UInt8 DEFAULT 0,
    
    -- Licensing and permissions
    license_type String DEFAULT '', -- 'public_domain', 'creative_commons', 'proprietary', 'fair_use'
    usage_rights String DEFAULT '', -- 'unrestricted', 'educational_only', 'attribution_required'
    copyright_notice String DEFAULT '',
    
    -- Technical metadata
    file_size_bytes UInt64 DEFAULT 0,
    mime_type String DEFAULT '',
    download_url String DEFAULT '',
    streaming_url String DEFAULT '',
    
    -- SCD Type 2 fields
    effective_date Date,
    expiration_date Date DEFAULT '2099-12-31',
    is_current UInt8 DEFAULT 1,
    
    -- Metadata
    created_at DateTime64(3),
    updated_at DateTime64(3),
    
    -- Data lineage
    etl_batch_id String DEFAULT '',
    data_source String DEFAULT 'postgresql',
    last_sync_timestamp DateTime64(3) DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYYYYMM(effective_date)
ORDER BY (resource_category, resource_type, resource_id, effective_date)
PRIMARY KEY (resource_category, resource_type, resource_id)
SETTINGS 
    index_granularity = 8192;

-- Create indexes for common search patterns
ALTER TABLE dims_resources 
ADD INDEX idx_title_description (resource_title, resource_description) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_resources 
ADD INDEX idx_tags (tags) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_resources 
ADD INDEX idx_grade_subjects (grade_levels, subjects) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_resources 
ADD INDEX idx_engagement (engagement_score, average_rating) TYPE minmax GRANULARITY 1;

ALTER TABLE dims_resources 
ADD INDEX idx_ciq_alignment (ciq_alignment) TYPE bloom_filter(0.01) GRANULARITY 1;

-- Create materialized view for current resources only
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_current_resources
ENGINE = MergeTree()
PARTITION BY toYYYYMM(effective_date)
ORDER BY (resource_category, resource_type, resource_id)
AS SELECT 
    resource_key,
    resource_id,
    resource_title,
    resource_description,
    resource_url,
    image_url,
    resource_type,
    resource_category,
    grade_levels,
    subjects,
    tags,
    difficulty_level,
    estimated_duration_minutes,
    language,
    author_name,
    publication_date,
    last_updated,
    is_featured,
    is_premium,
    curation_status,
    quality_score,
    total_views,
    total_likes,
    total_bookmarks,
    average_rating,
    total_ratings,
    engagement_score,
    popularity_tier,
    user_satisfaction,
    content_freshness,
    ciq_alignment,
    research_based,
    evidence_level,
    implementation_difficulty,
    license_type,
    effective_date,
    created_at,
    updated_at
FROM dims_resources
WHERE is_current = 1 AND curation_status = 'approved';

-- Create view for resource analytics
CREATE VIEW IF NOT EXISTS v_resource_analytics AS
SELECT 
    resource_category,
    resource_type,
    count(*) as total_resources,
    countIf(is_featured = 1) as featured_resources,
    countIf(is_premium = 1) as premium_resources,
    avg(quality_score) as avg_quality_score,
    avg(average_rating) as avg_user_rating,
    sum(total_views) as total_category_views,
    sum(total_likes) as total_category_likes,
    sum(total_bookmarks) as total_category_bookmarks,
    avg(engagement_score) as avg_engagement_score,
    countIf(popularity_tier = 'Highly Popular') as highly_popular_count,
    countIf(content_freshness IN ('Very Fresh', 'Fresh')) as fresh_content_count,
    countIf(research_based = 1) as research_based_count,
    arrayDistinct(arrayFlatten(groupArray(grade_levels))) as all_grade_levels,
    arrayDistinct(arrayFlatten(groupArray(subjects))) as all_subjects,
    arrayDistinct(arrayFlatten(groupArray(tags))) as popular_tags
FROM mv_current_resources
GROUP BY resource_category, resource_type;

-- Create view for trending resources
CREATE VIEW IF NOT EXISTS v_trending_resources AS
SELECT 
    resource_id,
    resource_title,
    resource_category,
    resource_type,
    total_views,
    total_likes,
    total_bookmarks,
    average_rating,
    engagement_score,
    popularity_tier,
    content_freshness,
    last_updated,
    -- Calculate trend score (recent engagement weighted more heavily)
    CASE 
        WHEN last_updated >= today() - INTERVAL 7 DAY THEN engagement_score * 3.0
        WHEN last_updated >= today() - INTERVAL 30 DAY THEN engagement_score * 2.0
        WHEN last_updated >= today() - INTERVAL 90 DAY THEN engagement_score * 1.5
        ELSE engagement_score
    END as trend_score
FROM mv_current_resources
WHERE total_views > 0
ORDER BY trend_score DESC
LIMIT 100;

-- Create view for content gaps analysis
CREATE VIEW IF NOT EXISTS v_content_gaps_analysis AS
SELECT 
    grade_level,
    subject,
    resource_category,
    count(*) as available_resources,
    avg(quality_score) as avg_quality,
    sum(total_views) as total_usage,
    CASE 
        WHEN count(*) < 5 THEN 'Critical Gap'
        WHEN count(*) < 10 THEN 'Moderate Gap'
        WHEN count(*) < 20 THEN 'Minor Gap'
        ELSE 'Well Covered'
    END as coverage_status
FROM mv_current_resources
CROSS JOIN UNNEST(grade_levels) AS t1(grade_level)
CROSS JOIN UNNEST(subjects) AS t2(subject)
GROUP BY grade_level, subject, resource_category
ORDER BY count(*) ASC, total_usage DESC;

-- Optimize table after creation
OPTIMIZE TABLE dims_resources;

-- Show table info
DESCRIBE dims_resources;

-- Validation query
SELECT 
    'dims_resources' as table_name,
    count() as total_records,
    countIf(is_current = 1) as current_resources,
    countDistinct(resource_id) as unique_resources,
    countDistinct(resource_category) as unique_categories,
    countDistinct(resource_type) as unique_types,
    sum(total_views) as total_all_views,
    avg(average_rating) as avg_user_rating,
    countIf(is_featured = 1) as featured_count,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM dims_resources dr
LEFT JOIN system.parts sp ON sp.table = 'dims_resources' AND sp.database = 'andi_warehouse' AND sp.active = 1;