-- ANDI Data Warehouse - Districts Dimension Table
-- Slowly Changing Dimension (SCD Type 2) for district information

USE andi_warehouse;

-- Create districts dimension table
CREATE TABLE IF NOT EXISTS dims_districts
(
    -- Surrogate key
    district_key UInt64 DEFAULT 0,
    
    -- Natural key (from source system)
    district_id UUID,
    
    -- Basic information
    district_name String,
    district_code String DEFAULT '', -- State-specific district code
    district_type String DEFAULT '', -- 'public', 'charter', 'private', 'cooperative'
    
    -- Geographic information
    state String,
    region String DEFAULT '', -- Geographic region within state
    service_area String DEFAULT '', -- Counties or areas served
    
    -- Contact information
    district_office_address String DEFAULT '',
    district_office_city String DEFAULT '',
    district_office_zip String DEFAULT '',
    phone String DEFAULT '',
    email String DEFAULT '',
    website String DEFAULT '',
    
    -- Leadership information
    superintendent_name String,
    superintendent_email String DEFAULT '',
    assistant_superintendents Array(String) DEFAULT [],
    school_board_members Array(String) DEFAULT [],
    
    -- District characteristics
    total_schools UInt32 DEFAULT 0,
    elementary_schools UInt32 DEFAULT 0,
    middle_schools UInt32 DEFAULT 0,
    high_schools UInt32 DEFAULT 0,
    other_schools UInt32 DEFAULT 0,
    
    -- Enrollment and staffing
    total_students UInt32 DEFAULT 0,
    total_teachers UInt32 DEFAULT 0,
    total_staff UInt32 DEFAULT 0,
    student_teacher_ratio Float32 DEFAULT 0.0,
    
    -- Academic performance
    state_accountability_rating String DEFAULT '',
    overall_test_scores_avg Float32 DEFAULT 0.0,
    graduation_rate Float32 DEFAULT 0.0,
    college_readiness_rate Float32 DEFAULT 0.0,
    chronic_absenteeism_rate Float32 DEFAULT 0.0,
    
    -- Demographics
    free_lunch_eligible_percent Float32 DEFAULT 0.0,
    english_learners_percent Float32 DEFAULT 0.0,
    special_education_percent Float32 DEFAULT 0.0,
    minority_enrollment_percent Float32 DEFAULT 0.0,
    
    -- Financial information
    annual_budget Float64 DEFAULT 0.0,
    per_pupil_spending Float32 DEFAULT 0.0,
    teacher_salary_avg Float32 DEFAULT 0.0,
    administrative_cost_percent Float32 DEFAULT 0.0,
    
    -- Technology and infrastructure
    technology_budget Float64 DEFAULT 0.0,
    devices_per_student Float32 DEFAULT 0.0,
    internet_connectivity_level String DEFAULT '',
    digital_learning_platforms Array(String) DEFAULT [],
    
    -- ANDI platform metrics
    andi_contract_start_date Date DEFAULT '1900-01-01',
    andi_contract_end_date Date DEFAULT '2099-12-31',
    total_andi_schools UInt32 DEFAULT 0,
    total_andi_teachers UInt32 DEFAULT 0,
    active_andi_teachers UInt32 DEFAULT 0,
    avg_district_ciq_score Float32 DEFAULT 0.0,
    total_ciq_sessions UInt32 DEFAULT 0,
    
    -- Calculated performance metrics
    performance_tier String MATERIALIZED CASE
        WHEN avg_district_ciq_score >= 85 THEN 'Exemplary'
        WHEN avg_district_ciq_score >= 75 THEN 'Proficient'
        WHEN avg_district_ciq_score >= 65 THEN 'Developing'
        ELSE 'Needs Improvement'
    END,
    
    size_category String MATERIALIZED CASE
        WHEN total_students >= 50000 THEN 'Very Large'
        WHEN total_students >= 25000 THEN 'Large'
        WHEN total_students >= 10000 THEN 'Medium'
        WHEN total_students >= 2500 THEN 'Small'
        ELSE 'Very Small'
    END,
    
    andi_penetration_rate Float32 MATERIALIZED CASE
        WHEN total_schools > 0 THEN (total_andi_schools * 100.0) / total_schools
        ELSE 0.0
    END,
    
    andi_teacher_adoption_rate Float32 MATERIALIZED CASE
        WHEN total_andi_teachers > 0 THEN (active_andi_teachers * 100.0) / total_andi_teachers
        ELSE 0.0
    END,
    
    socioeconomic_level String MATERIALIZED CASE
        WHEN free_lunch_eligible_percent >= 75 THEN 'High Need'
        WHEN free_lunch_eligible_percent >= 50 THEN 'Moderate Need'
        WHEN free_lunch_eligible_percent >= 25 THEN 'Low Need'
        ELSE 'Affluent'
    END,
    
    -- Strategic information
    district_priorities Array(String) DEFAULT [],
    improvement_initiatives Array(String) DEFAULT [],
    technology_initiatives Array(String) DEFAULT [],
    professional_development_focus Array(String) DEFAULT [],
    
    -- Partnership and collaboration
    university_partnerships Array(String) DEFAULT [],
    community_partnerships Array(String) DEFAULT [],
    other_district_collaborations Array(String) DEFAULT [],
    
    -- Innovation and programs
    innovative_programs Array(String) DEFAULT [],
    magnet_programs Array(String) DEFAULT [],
    dual_language_programs UInt8 DEFAULT 0,
    stem_programs UInt8 DEFAULT 0,
    arts_programs UInt8 DEFAULT 0,
    
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
PARTITION BY toYear(effective_date)
ORDER BY (state, district_id, effective_date)
PRIMARY KEY (state, district_id)
SETTINGS 
    index_granularity = 8192;

-- Create indexes for common lookup patterns
ALTER TABLE dims_districts 
ADD INDEX idx_district_name (district_name) TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE dims_districts 
ADD INDEX idx_state_type (state, district_type) TYPE set(100) GRANULARITY 1;

ALTER TABLE dims_districts 
ADD INDEX idx_size_performance (size_category, performance_tier) TYPE set(50) GRANULARITY 1;

ALTER TABLE dims_districts 
ADD INDEX idx_demographics (socioeconomic_level, free_lunch_eligible_percent) TYPE minmax GRANULARITY 1;

-- Create materialized view for current districts only
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_current_districts
ENGINE = MergeTree()
PARTITION BY toYear(effective_date)
ORDER BY (state, district_id)
AS SELECT 
    district_key,
    district_id,
    district_name,
    district_code,
    district_type,
    state,
    region,
    superintendent_name,
    total_schools,
    elementary_schools,
    middle_schools,
    high_schools,
    total_students,
    total_teachers,
    student_teacher_ratio,
    state_accountability_rating,
    overall_test_scores_avg,
    graduation_rate,
    free_lunch_eligible_percent,
    annual_budget,
    per_pupil_spending,
    teacher_salary_avg,
    andi_contract_start_date,
    total_andi_schools,
    total_andi_teachers,
    active_andi_teachers,
    avg_district_ciq_score,
    total_ciq_sessions,
    performance_tier,
    size_category,
    andi_penetration_rate,
    andi_teacher_adoption_rate,
    socioeconomic_level,
    district_priorities,
    improvement_initiatives,
    effective_date,
    created_at,
    updated_at
FROM dims_districts
WHERE is_current = 1;

-- Create view for state-level summaries
CREATE VIEW IF NOT EXISTS v_state_district_summary AS
SELECT 
    state,
    count(*) as total_districts,
    sum(total_schools) as total_schools,
    sum(total_students) as total_students,
    sum(total_teachers) as total_teachers,
    avg(student_teacher_ratio) as avg_student_teacher_ratio,
    sum(total_andi_schools) as total_andi_schools,
    sum(total_andi_teachers) as total_andi_teachers,
    sum(active_andi_teachers) as total_active_andi_teachers,
    avg(avg_district_ciq_score) as avg_state_ciq_score,
    sum(total_ciq_sessions) as total_state_ciq_sessions,
    countIf(performance_tier = 'Exemplary') as exemplary_districts,
    countIf(performance_tier = 'Proficient') as proficient_districts,
    countIf(performance_tier = 'Developing') as developing_districts,
    countIf(performance_tier = 'Needs Improvement') as needs_improvement_districts,
    avg(free_lunch_eligible_percent) as avg_free_lunch_percent,
    avg(per_pupil_spending) as avg_per_pupil_spending,
    sum(annual_budget) as total_state_budget
FROM mv_current_districts
GROUP BY state;

-- Create view for ANDI adoption analysis
CREATE VIEW IF NOT EXISTS v_andi_adoption_analysis AS
SELECT 
    district_id,
    district_name,
    state,
    size_category,
    socioeconomic_level,
    total_schools,
    total_andi_schools,
    andi_penetration_rate,
    total_teachers,
    total_andi_teachers,
    active_andi_teachers,
    andi_teacher_adoption_rate,
    avg_district_ciq_score,
    total_ciq_sessions,
    performance_tier,
    andi_contract_start_date,
    datediff('day', andi_contract_start_date, today()) as days_since_adoption,
    CASE 
        WHEN total_andi_teachers = 0 THEN 'Not Implemented'
        WHEN andi_teacher_adoption_rate >= 80 THEN 'High Adoption'
        WHEN andi_teacher_adoption_rate >= 50 THEN 'Moderate Adoption'
        WHEN andi_teacher_adoption_rate >= 25 THEN 'Low Adoption'
        ELSE 'Minimal Adoption'
    END as adoption_status
FROM mv_current_districts
WHERE andi_contract_start_date > '1900-01-01'
ORDER BY andi_teacher_adoption_rate DESC;

-- Create performance benchmarking view
CREATE VIEW IF NOT EXISTS v_district_performance_benchmarks AS
SELECT 
    size_category,
    socioeconomic_level,
    state,
    count(*) as district_count,
    avg(avg_district_ciq_score) as benchmark_ciq_score,
    quantile(0.25)(avg_district_ciq_score) as ciq_score_25th_percentile,
    quantile(0.50)(avg_district_ciq_score) as ciq_score_median,
    quantile(0.75)(avg_district_ciq_score) as ciq_score_75th_percentile,
    quantile(0.90)(avg_district_ciq_score) as ciq_score_90th_percentile,
    avg(andi_teacher_adoption_rate) as benchmark_adoption_rate,
    avg(total_ciq_sessions) as avg_sessions_per_district
FROM mv_current_districts
WHERE total_andi_teachers > 0
GROUP BY size_category, socioeconomic_level, state;

-- Optimize table after creation
OPTIMIZE TABLE dims_districts;

-- Show table info
DESCRIBE dims_districts;

-- Validation query
SELECT 
    'dims_districts' as table_name,
    count() as total_records,
    countIf(is_current = 1) as current_districts,
    countDistinct(district_id) as unique_districts,
    countDistinct(state) as unique_states,
    sum(total_schools) as total_schools,
    sum(total_students) as total_students,
    sum(total_teachers) as total_teachers,
    avg(avg_district_ciq_score) as avg_ciq_score,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM dims_districts dd
LEFT JOIN system.parts sp ON sp.table = 'dims_districts' AND sp.database = 'andi_warehouse' AND sp.active = 1;