-- ANDI Data Warehouse - Schools Dimension Table
-- Slowly Changing Dimension (SCD Type 2) for school information

USE andi_warehouse;

-- Create schools dimension table
CREATE TABLE IF NOT EXISTS dims_schools
(
    -- Surrogate key
    school_key UInt64 DEFAULT 0,
    
    -- Natural key (from source system)
    school_id UUID,
    
    -- Basic information
    school_name String,
    school_code String DEFAULT '', -- District-specific school code
    school_type String DEFAULT '', -- 'elementary', 'middle', 'high', 'k12', 'charter'
    
    -- Geographic information
    address String,
    city String,
    state String,
    zip_code String,
    county String DEFAULT '',
    region String DEFAULT '', -- Geographic region within state
    
    -- Contact information
    phone String,
    email String,
    website String DEFAULT '',
    
    -- Administrative information
    principal_name String,
    principal_email String DEFAULT '',
    assistant_principals Array(String) DEFAULT [],
    
    -- District relationship
    district_id UUID,
    district_name String, -- Denormalized for performance
    
    -- School characteristics
    grade_levels_served Array(String), -- e.g., ['K', '1', '2', '3', '4', '5']
    student_enrollment UInt32 DEFAULT 0,
    teacher_count UInt32 DEFAULT 0,
    staff_count UInt32 DEFAULT 0,
    
    -- Academic information
    curriculum_type String DEFAULT '', -- 'traditional', 'montessori', 'stem', 'arts'
    special_programs Array(String) DEFAULT [], -- 'gifted', 'special_ed', 'esl', etc.
    accreditation String DEFAULT '',
    
    -- Performance metrics
    state_rating String DEFAULT '', -- State-specific rating system
    test_scores_avg Float32 DEFAULT 0.0,
    graduation_rate Float32 DEFAULT 0.0, -- For high schools
    college_readiness_rate Float32 DEFAULT 0.0,
    
    -- ANDI platform metrics
    andi_adoption_date Date DEFAULT '1900-01-01',
    total_andi_teachers UInt32 DEFAULT 0,
    active_andi_teachers UInt32 DEFAULT 0,
    avg_school_ciq_score Float32 DEFAULT 0.0,
    total_ciq_sessions UInt32 DEFAULT 0,
    
    -- Calculated performance indicators
    performance_tier String MATERIALIZED CASE
        WHEN avg_school_ciq_score >= 85 THEN 'Exemplary'
        WHEN avg_school_ciq_score >= 75 THEN 'Proficient'
        WHEN avg_school_ciq_score >= 65 THEN 'Developing'
        ELSE 'Needs Improvement'
    END,
    
    size_category String MATERIALIZED CASE
        WHEN student_enrollment >= 2000 THEN 'Very Large'
        WHEN student_enrollment >= 1000 THEN 'Large'
        WHEN student_enrollment >= 500 THEN 'Medium'
        WHEN student_enrollment >= 200 THEN 'Small'
        ELSE 'Very Small'
    END,
    
    andi_engagement_level String MATERIALIZED CASE
        WHEN total_andi_teachers = 0 THEN 'Not Adopted'
        WHEN (active_andi_teachers * 100.0 / total_andi_teachers) >= 80 THEN 'High Engagement'
        WHEN (active_andi_teachers * 100.0 / total_andi_teachers) >= 50 THEN 'Moderate Engagement'
        ELSE 'Low Engagement'
    END,
    
    -- Demographics (if available)
    free_lunch_eligible_percent Float32 DEFAULT 0.0,
    english_learners_percent Float32 DEFAULT 0.0,
    special_education_percent Float32 DEFAULT 0.0,
    minority_enrollment_percent Float32 DEFAULT 0.0,
    
    -- Technology and infrastructure
    student_device_ratio Float32 DEFAULT 0.0, -- Devices per student
    internet_bandwidth String DEFAULT '',
    tech_support_level String DEFAULT '',
    
    -- Community factors
    community_type String DEFAULT '', -- 'urban', 'suburban', 'rural'
    socioeconomic_level String DEFAULT '', -- 'high', 'medium', 'low'
    parent_engagement_score Float32 DEFAULT 0.0,
    
    -- Goals and improvement areas
    improvement_goals Array(String) DEFAULT [],
    focus_initiatives Array(String) DEFAULT [],
    strengths Array(String) DEFAULT [],
    challenges Array(String) DEFAULT [],
    
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
ORDER BY (district_id, school_id, effective_date)
PRIMARY KEY (district_id, school_id)
SETTINGS 
    index_granularity = 8192;

-- Create indexes for common lookup patterns
ALTER TABLE dims_schools 
ADD INDEX idx_school_name (school_name) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_schools 
ADD INDEX idx_school_type (school_type, size_category) TYPE set(20) GRANULARITY 1;

ALTER TABLE dims_schools 
ADD INDEX idx_location (state, city) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_schools 
ADD INDEX idx_performance (avg_school_ciq_score, student_enrollment) TYPE minmax GRANULARITY 1;

ALTER TABLE dims_schools 
ADD INDEX idx_grade_levels (grade_levels_served) TYPE bloom_filter(0.01) GRANULARITY 1;

-- Create materialized view for current schools only
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_current_schools
ENGINE = MergeTree()
PARTITION BY toYYYYMM(effective_date)
ORDER BY (district_id, school_id)
AS SELECT 
    school_key,
    school_id,
    school_name,
    school_code,
    school_type,
    address,
    city,
    state,
    zip_code,
    phone,
    email,
    principal_name,
    district_id,
    district_name,
    grade_levels_served,
    student_enrollment,
    teacher_count,
    curriculum_type,
    special_programs,
    state_rating,
    total_andi_teachers,
    active_andi_teachers,
    avg_school_ciq_score,
    total_ciq_sessions,
    performance_tier,
    size_category,
    andi_engagement_level,
    free_lunch_eligible_percent,
    community_type,
    socioeconomic_level,
    improvement_goals,
    focus_initiatives,
    effective_date,
    created_at,
    updated_at
FROM dims_schools
WHERE is_current = 1;

-- Create view for school performance summary
CREATE VIEW IF NOT EXISTS v_school_performance_summary AS
SELECT 
    district_id,
    district_name,
    school_id,
    school_name,
    school_type,
    size_category,
    student_enrollment,
    teacher_count,
    total_andi_teachers,
    active_andi_teachers,
    CASE 
        WHEN total_andi_teachers > 0 
        THEN round((active_andi_teachers * 100.0) / total_andi_teachers, 1) 
        ELSE 0 
    END as andi_adoption_rate,
    avg_school_ciq_score,
    total_ciq_sessions,
    performance_tier,
    andi_engagement_level,
    community_type,
    socioeconomic_level,
    free_lunch_eligible_percent
FROM mv_current_schools
ORDER BY district_name, school_name;

-- Create view for district rollup
CREATE VIEW IF NOT EXISTS v_district_school_summary AS
SELECT 
    district_id,
    district_name,
    count(*) as total_schools,
    sum(student_enrollment) as total_students,
    sum(teacher_count) as total_teachers,
    sum(total_andi_teachers) as total_andi_teachers,
    sum(active_andi_teachers) as total_active_andi_teachers,
    avg(avg_school_ciq_score) as avg_district_ciq_score,
    sum(total_ciq_sessions) as total_district_ciq_sessions,
    countIf(performance_tier = 'Exemplary') as exemplary_schools,
    countIf(performance_tier = 'Proficient') as proficient_schools,
    countIf(performance_tier = 'Developing') as developing_schools,
    countIf(performance_tier = 'Needs Improvement') as needs_improvement_schools,
    countIf(andi_engagement_level = 'High Engagement') as high_engagement_schools,
    countIf(andi_engagement_level = 'Not Adopted') as not_adopted_schools,
    arrayDistinct(arrayFlatten(groupArray(grade_levels_served))) as all_grade_levels_served,
    arrayDistinct(arrayFlatten(groupArray(special_programs))) as all_special_programs
FROM mv_current_schools
GROUP BY district_id, district_name;

-- Optimize table after creation
OPTIMIZE TABLE dims_schools;

-- Show table info
DESCRIBE dims_schools;

-- Validation query
SELECT 
    'dims_schools' as table_name,
    count() as total_records,
    countIf(is_current = 1) as current_schools,
    countDistinct(school_id) as unique_schools,
    countDistinct(district_id) as unique_districts,
    sum(student_enrollment) as total_students,
    sum(teacher_count) as total_teachers,
    avg(avg_school_ciq_score) as avg_ciq_score,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM dims_schools ds
LEFT JOIN system.parts sp ON sp.table = 'dims_schools' AND sp.database = 'andi_warehouse' AND sp.active = 1;