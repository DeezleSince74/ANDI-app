-- ANDI Data Warehouse - Enhanced CIQ Analytics Support
-- Description: Adds ClickHouse tables for high-performance CIQ analytics with detailed ECI tracking

USE andi_warehouse;

SELECT 'Starting CIQ Enhanced Analytics migration...' as status, now() as timestamp;

-- Create enhanced student dimension table
CREATE TABLE IF NOT EXISTS dims_students
(
    student_sk UInt64,
    student_id String,
    student_identifier String,
    district_id String,
    school_id String,
    first_name String,
    last_name String,
    grade_level String,
    demographic_data String,
    special_needs String,
    enrollment_date Date,
    is_active UInt8,
    
    -- SCD Type 2 fields
    effective_date Date,
    expiry_date Date,
    is_current UInt8 DEFAULT 1,
    
    -- Metadata
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (student_sk, effective_date)
PARTITION BY toYYYYMM(effective_date);

-- Create enhanced classroom dimension table
CREATE TABLE IF NOT EXISTS dims_classrooms
(
    classroom_sk UInt64,
    classroom_id String,
    teacher_id String,
    school_id String,
    classroom_name String,
    subject String,
    grade_level String,
    academic_year String,
    semester String,
    class_period String,
    max_capacity UInt16,
    class_schedule String,
    curriculum_standards String,
    
    -- SCD Type 2 fields
    effective_date Date,
    expiry_date Date,
    is_current UInt8 DEFAULT 1,
    
    -- Metadata
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (classroom_sk, effective_date)
PARTITION BY toYYYYMM(effective_date);

-- Create comprehensive CIQ facts table with detailed ECI tracking
CREATE TABLE IF NOT EXISTS facts_ciq_comprehensive
(
    -- Primary Keys
    session_date Date,
    session_sk UInt64,
    classroom_sk UInt64,
    teacher_sk UInt64,
    
    -- Session Identifiers
    session_id String,
    classroom_id String,
    teacher_id String,
    
    -- Time Dimensions
    academic_year String,
    semester String,
    month UInt8,
    week UInt8,
    day_of_week UInt8,
    
    -- Original CIQ Scores (0-100 scale)
    overall_ciq_score Float32,
    equity_score Float32,
    creativity_score Float32,
    innovation_score Float32,
    
    -- Detailed ECI Component Scores (0-10 scale)
    -- Equity Components (E1-E5)
    e1_identity_recognition Float32,
    e2_psychological_safety Float32,
    e3_access_equity Float32,
    e4_voice_elevation Float32,
    e5_collaboration Float32,
    equity_avg Float32,
    
    -- Creativity Components (C6-C10)
    c6_self_expression Float32,
    c7_experimentation Float32,
    c8_active_learning Float32,
    c9_skill_development Float32,
    c10_imagination Float32,
    creativity_avg Float32,
    
    -- Innovation Components (I11-I15)
    i11_possibility_mindset Float32,
    i12_real_world_connections Float32,
    i13_change_making Float32,
    i14_impact_assessment Float32,
    i15_continuous_improvement Float32,
    innovation_avg Float32,
    
    -- Participation Metrics (from audio analysis)
    teacher_talk_percentage Float32,
    student_talk_percentage Float32,
    total_questions UInt32,
    student_questions UInt32,
    teacher_questions UInt32,
    wait_time_avg Float32,
    interaction_count UInt32,
    
    -- Engagement and Sentiment
    overall_sentiment Float32,
    positive_sentiment_ratio Float32,
    engagement_level Float32,
    energy_level Float32,
    
    -- Academic Performance Metrics (SIS/LMS - 50% weight)
    class_average_grade Float32,
    attendance_rate Float32,
    positive_behavior_ratio Float32,
    assignment_completion_rate Float32,
    
    -- Survey Metrics (20% weight)
    teacher_confidence Float32,
    teacher_satisfaction Float32,
    perceived_student_engagement Float32,
    student_wellbeing Float32,
    student_belonging Float32,
    learning_effectiveness Float32,
    
    -- Adaptive Weighting Applied
    sis_lms_weight Float32,
    survey_weight Float32,
    eci_blueprint_weight Float32,
    equity_component_weight Float32,
    creativity_component_weight Float32,
    innovation_component_weight Float32,
    
    -- Calculated Weighted Scores
    weighted_ciq_score Float32,
    weighted_equity_score Float32,
    weighted_creativity_score Float32,
    weighted_innovation_score Float32,
    
    -- Quality and Confidence Indicators
    transcript_quality_score Float32,
    analyzer_confidence Float32,
    data_completeness_score Float32,
    analysis_duration_ms UInt32,
    
    -- Session Context
    session_duration_minutes UInt32,
    student_count UInt16,
    lesson_type String,
    subject_area String,
    
    -- Performance Categories
    performance_tier String, -- excellent, good, developing, needs_support
    trend_direction String,  -- improving, stable, declining
    
    -- Metadata
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (session_date, classroom_sk, session_sk)
PARTITION BY toYYYYMM(session_date)
SETTINGS index_granularity = 8192;

-- Create student academic performance facts table
CREATE TABLE IF NOT EXISTS facts_student_academic_performance
(
    -- Date and Keys
    record_date Date,
    student_sk UInt64,
    classroom_sk UInt64,
    teacher_sk UInt64,
    
    -- Identifiers
    student_id String,
    classroom_id String,
    academic_year String,
    semester String,
    
    -- Academic Metrics
    current_grade_percentage Float32,
    assignment_count UInt32,
    assignments_completed UInt32,
    assignments_on_time UInt32,
    test_average Float32,
    project_average Float32,
    participation_grade Float32,
    
    -- Learning Progress
    learning_objectives_met UInt16,
    total_learning_objectives UInt16,
    mastery_percentage Float32,
    
    -- Behavioral Metrics
    positive_behaviors UInt16,
    negative_behaviors UInt16,
    behavior_score Float32,
    
    -- Attendance
    days_present UInt16,
    days_absent UInt16,
    days_tardy UInt16,
    attendance_percentage Float32,
    
    -- Metadata
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (record_date, student_sk, classroom_sk)
PARTITION BY toYYYYMM(record_date);

-- Create survey response facts table
CREATE TABLE IF NOT EXISTS facts_survey_responses
(
    -- Date and Keys
    response_date Date,
    survey_sk UInt64,
    respondent_sk UInt64,
    classroom_sk UInt64,
    
    -- Identifiers
    survey_id String,
    respondent_id String,
    respondent_role String,
    survey_type String,
    
    -- Response Metrics
    completion_percentage Float32,
    time_spent_minutes UInt32,
    question_count UInt16,
    questions_answered UInt16,
    
    -- Aggregated Scores (normalized to 0-100)
    overall_satisfaction_score Float32,
    confidence_score Float32,
    engagement_score Float32,
    wellbeing_score Float32,
    belonging_score Float32,
    effectiveness_score Float32,
    
    -- Response Quality
    response_consistency_score Float32,
    response_depth_score Float32,
    
    -- Context
    academic_year String,
    semester String,
    
    -- Metadata
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (response_date, survey_sk, respondent_sk)
PARTITION BY toYYYYMM(response_date);

-- Create aggregated daily CIQ metrics table for faster reporting
CREATE TABLE IF NOT EXISTS aggregates_daily_ciq_metrics
(
    -- Date and Dimensions
    metric_date Date,
    classroom_sk UInt64,
    teacher_sk UInt64,
    school_sk UInt64,
    district_sk UInt64,
    
    -- Identifiers
    classroom_id String,
    teacher_id String,
    academic_year String,
    subject String,
    grade_level String,
    
    -- Session Count
    total_sessions UInt16,
    analyzed_sessions UInt16,
    
    -- Average CIQ Scores
    avg_overall_ciq Float32,
    avg_equity_score Float32,
    avg_creativity_score Float32,
    avg_innovation_score Float32,
    avg_weighted_ciq Float32,
    
    -- Average ECI Component Scores
    avg_e1_identity Float32,
    avg_e2_safety Float32,
    avg_e3_access Float32,
    avg_e4_voice Float32,
    avg_e5_collaboration Float32,
    
    avg_c6_expression Float32,
    avg_c7_experimentation Float32,
    avg_c8_active_learning Float32,
    avg_c9_skill_development Float32,
    avg_c10_imagination Float32,
    
    avg_i11_possibility Float32,
    avg_i12_connections Float32,
    avg_i13_change_making Float32,
    avg_i14_impact Float32,
    avg_i15_improvement Float32,
    
    -- Participation Averages
    avg_teacher_talk_pct Float32,
    avg_student_talk_pct Float32,
    avg_questions_per_session Float32,
    avg_wait_time Float32,
    
    -- Quality Indicators
    avg_transcript_quality Float32,
    avg_analyzer_confidence Float32,
    avg_data_completeness Float32,
    
    -- Performance Indicators
    sessions_excellent UInt16,
    sessions_good UInt16,
    sessions_developing UInt16,
    sessions_needs_support UInt16,
    
    -- Trend Analysis
    trend_direction String,
    improvement_rate Float32,
    consistency_score Float32,
    
    -- Student Context
    total_students UInt16,
    avg_attendance_rate Float32,
    avg_academic_performance Float32,
    
    -- Metadata
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
)
ENGINE = SummingMergeTree()
ORDER BY (metric_date, classroom_sk, teacher_sk)
PARTITION BY toYYYYMM(metric_date);

-- Create weekly CIQ trends table for performance analysis
CREATE TABLE IF NOT EXISTS aggregates_weekly_ciq_trends
(
    -- Week and Dimensions
    week_start Date,
    week_number UInt8,
    academic_year String,
    classroom_sk UInt64,
    teacher_sk UInt64,
    
    -- Identifiers
    classroom_id String,
    teacher_id String,
    subject String,
    grade_level String,
    
    -- Weekly Metrics
    sessions_count UInt16,
    avg_weekly_ciq Float32,
    avg_weekly_equity Float32,
    avg_weekly_creativity Float32,
    avg_weekly_innovation Float32,
    
    -- Trend Calculations
    prev_week_ciq Float32,
    ciq_change Float32,
    ciq_change_percentage Float32,
    trend_direction String,
    
    -- Quality Metrics
    avg_quality_score Float32,
    consistency_score Float32,
    reliability_score Float32,
    
    -- Student Performance Correlation
    avg_student_performance Float32,
    attendance_correlation Float32,
    engagement_correlation Float32,
    
    -- Teacher Development Indicators
    goal_alignment_score Float32,
    improvement_velocity Float32,
    
    -- Metadata
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (week_start, classroom_sk, teacher_sk)
PARTITION BY toYYYYMM(week_start);

-- Create materialized view for real-time CIQ dashboard metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_realtime_ciq_dashboard
TO aggregates_daily_ciq_metrics
AS SELECT
    toDate(session_date) as metric_date,
    classroom_sk,
    teacher_sk,
    0 as school_sk,
    0 as district_sk,
    classroom_id,
    teacher_id,
    academic_year,
    subject_area as subject,
    '' as grade_level,
    
    count() as total_sessions,
    countIf(overall_ciq_score > 0) as analyzed_sessions,
    
    avg(overall_ciq_score) as avg_overall_ciq,
    avg(equity_score) as avg_equity_score,
    avg(creativity_score) as avg_creativity_score,
    avg(innovation_score) as avg_innovation_score,
    avg(weighted_ciq_score) as avg_weighted_ciq,
    
    avg(e1_identity_recognition) as avg_e1_identity,
    avg(e2_psychological_safety) as avg_e2_safety,
    avg(e3_access_equity) as avg_e3_access,
    avg(e4_voice_elevation) as avg_e4_voice,
    avg(e5_collaboration) as avg_e5_collaboration,
    
    avg(c6_self_expression) as avg_c6_expression,
    avg(c7_experimentation) as avg_c7_experimentation,
    avg(c8_active_learning) as avg_c8_active_learning,
    avg(c9_skill_development) as avg_c9_skill_development,
    avg(c10_imagination) as avg_c10_imagination,
    
    avg(i11_possibility_mindset) as avg_i11_possibility,
    avg(i12_real_world_connections) as avg_i12_connections,
    avg(i13_change_making) as avg_i13_change_making,
    avg(i14_impact_assessment) as avg_i14_impact,
    avg(i15_continuous_improvement) as avg_i15_improvement,
    
    avg(teacher_talk_percentage) as avg_teacher_talk_pct,
    avg(student_talk_percentage) as avg_student_talk_pct,
    avg(total_questions) as avg_questions_per_session,
    avg(wait_time_avg) as avg_wait_time,
    
    avg(transcript_quality_score) as avg_transcript_quality,
    avg(analyzer_confidence) as avg_analyzer_confidence,
    avg(data_completeness_score) as avg_data_completeness,
    
    countIf(performance_tier = 'excellent') as sessions_excellent,
    countIf(performance_tier = 'good') as sessions_good,
    countIf(performance_tier = 'developing') as sessions_developing,
    countIf(performance_tier = 'needs_support') as sessions_needs_support,
    
    any(trend_direction) as trend_direction,
    0 as improvement_rate,
    stddevPop(overall_ciq_score) as consistency_score,
    
    avg(student_count) as total_students,
    avg(attendance_rate) as avg_attendance_rate,
    avg(class_average_grade) as avg_academic_performance,
    
    now() as created_at,
    now() as updated_at
    
FROM facts_ciq_comprehensive
WHERE session_date >= today() - 7
GROUP BY 
    toDate(session_date),
    classroom_sk,
    teacher_sk,
    classroom_id,
    teacher_id,
    academic_year,
    subject_area;

SELECT 'Creating indexes for enhanced CIQ analytics...' as status, now() as timestamp;

-- Create additional indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ciq_comprehensive_classroom_date ON facts_ciq_comprehensive (classroom_sk, session_date);
CREATE INDEX IF NOT EXISTS idx_ciq_comprehensive_teacher_date ON facts_ciq_comprehensive (teacher_sk, session_date);
CREATE INDEX IF NOT EXISTS idx_ciq_comprehensive_performance ON facts_ciq_comprehensive (performance_tier, session_date);
CREATE INDEX IF NOT EXISTS idx_ciq_comprehensive_scores ON facts_ciq_comprehensive (overall_ciq_score, session_date);

CREATE INDEX IF NOT EXISTS idx_student_performance_date ON facts_student_academic_performance (record_date, student_sk);
CREATE INDEX IF NOT EXISTS idx_survey_responses_date ON facts_survey_responses (response_date, survey_type);

-- Optimize tables for better performance
SELECT 'Optimizing tables...' as status, now() as timestamp;

OPTIMIZE TABLE dims_students FINAL;
OPTIMIZE TABLE dims_classrooms FINAL;
OPTIMIZE TABLE facts_ciq_comprehensive FINAL;
OPTIMIZE TABLE facts_student_academic_performance FINAL;
OPTIMIZE TABLE facts_survey_responses FINAL;
OPTIMIZE TABLE aggregates_daily_ciq_metrics FINAL;

SELECT 'CIQ Enhanced Analytics migration completed successfully!' as status, now() as timestamp;