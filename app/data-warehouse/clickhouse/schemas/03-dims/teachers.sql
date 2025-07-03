-- ANDI Data Warehouse - Teachers Dimension Table
-- Slowly Changing Dimension (SCD Type 2) for teacher information

USE andi_warehouse;

-- Create teachers dimension table
CREATE TABLE IF NOT EXISTS dims_teachers
(
    -- Surrogate key (ClickHouse specific)
    teacher_key UInt64 DEFAULT 0,
    
    -- Natural key (from source system)
    teacher_id UUID,
    
    -- Basic information
    full_name String,
    email String,
    
    -- Organization hierarchy
    school_id UUID,
    school_name String, -- Denormalized for performance
    district_id UUID,
    district_name String, -- Denormalized for performance
    
    -- Professional information
    grade_levels Array(String), -- e.g., ['K', '1', '2'] or ['9', '10', '11', '12']
    subjects Array(String), -- e.g., ['Mathematics', 'Science']
    years_experience UInt8,
    
    -- Teaching profile
    teaching_style String DEFAULT '', -- 'collaborative', 'direct_instruction', 'inquiry_based', etc.
    certifications Array(String) DEFAULT [],
    specializations Array(String) DEFAULT [],
    
    -- ANDI platform usage
    platform_role String DEFAULT 'teacher', -- 'teacher', 'mentor_teacher', 'department_head'
    onboarding_completed UInt8 DEFAULT 0,
    onboarding_date Date DEFAULT '1900-01-01',
    last_login_date Date DEFAULT '1900-01-01',
    total_sessions UInt32 DEFAULT 0,
    avg_ciq_score Float32 DEFAULT 0.0,
    
    -- Performance categories (for quick filtering)
    performance_tier String MATERIALIZED CASE
        WHEN avg_ciq_score >= 85 THEN 'High Performer'
        WHEN avg_ciq_score >= 75 THEN 'Proficient'
        WHEN avg_ciq_score >= 65 THEN 'Developing'
        ELSE 'Needs Support'
    END,
    
    experience_level String MATERIALIZED CASE
        WHEN years_experience >= 15 THEN 'Veteran'
        WHEN years_experience >= 5 THEN 'Experienced'
        WHEN years_experience >= 2 THEN 'Developing'
        ELSE 'Novice'
    END,
    
    -- Engagement metrics
    community_engagement_score Float32 DEFAULT 0.0,
    resource_usage_score Float32 DEFAULT 0.0,
    mentoring_activity_score Float32 DEFAULT 0.0,
    
    -- Goals and development
    current_goals Array(String) DEFAULT [],
    focus_areas Array(String) DEFAULT [], -- Areas needing improvement
    strengths Array(String) DEFAULT [], -- Identified strengths
    
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
ORDER BY (district_id, school_id, teacher_id, effective_date)
PRIMARY KEY (district_id, school_id, teacher_id)
SETTINGS 
    index_granularity = 8192;

-- Create indexes for common lookup patterns
ALTER TABLE dims_teachers 
ADD INDEX idx_teacher_name (full_name) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_teachers 
ADD INDEX idx_email (email) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_teachers 
ADD INDEX idx_subjects (subjects) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_teachers 
ADD INDEX idx_grade_levels (grade_levels) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_teachers 
ADD INDEX idx_performance (avg_ciq_score, years_experience) TYPE minmax GRANULARITY 1;

-- Create materialized view for current teachers only (most common query pattern)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_current_teachers
ENGINE = MergeTree()
PARTITION BY toYYYYMM(effective_date)
ORDER BY (district_id, school_id, teacher_id)
AS SELECT 
    teacher_key,
    teacher_id,
    full_name,
    email,
    school_id,
    school_name,
    district_id,
    district_name,
    grade_levels,
    subjects,
    years_experience,
    teaching_style,
    platform_role,
    onboarding_completed,
    total_sessions,
    avg_ciq_score,
    performance_tier,
    experience_level,
    community_engagement_score,
    resource_usage_score,
    current_goals,
    focus_areas,
    strengths,
    effective_date,
    created_at,
    updated_at
FROM dims_teachers
WHERE is_current = 1;

-- Create a view for teacher summary statistics
CREATE VIEW IF NOT EXISTS v_teacher_summary AS
SELECT 
    district_id,
    district_name,
    school_id,
    school_name,
    count(*) as total_teachers,
    countIf(onboarding_completed = 1) as onboarded_teachers,
    countIf(total_sessions > 0) as active_teachers,
    avg(years_experience) as avg_years_experience,
    avg(avg_ciq_score) as avg_district_ciq_score,
    countIf(performance_tier = 'High Performer') as high_performers,
    countIf(performance_tier = 'Needs Support') as needs_support,
    arrayDistinct(arrayFlatten(groupArray(subjects))) as all_subjects_taught,
    arrayDistinct(arrayFlatten(groupArray(grade_levels))) as all_grade_levels
FROM mv_current_teachers
GROUP BY district_id, district_name, school_id, school_name;

-- Function to get teacher performance trend (would be called from application)
-- Note: ClickHouse doesn't have stored procedures, so this would be a parameterized query

-- Optimize table after creation
OPTIMIZE TABLE dims_teachers;

-- Show table info
DESCRIBE dims_teachers;

-- Create sample validation query
SELECT 
    'dims_teachers' as table_name,
    count() as total_records,
    countIf(is_current = 1) as current_teachers,
    countDistinct(teacher_id) as unique_teachers,
    countDistinct(school_id) as unique_schools,
    countDistinct(district_id) as unique_districts,
    avg(years_experience) as avg_years_experience,
    avg(avg_ciq_score) as avg_ciq_score,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM dims_teachers dt
LEFT JOIN system.parts sp ON sp.table = 'dims_teachers' AND sp.database = 'andi_warehouse' AND sp.active = 1;