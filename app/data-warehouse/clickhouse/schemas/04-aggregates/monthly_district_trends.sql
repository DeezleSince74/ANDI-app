-- ANDI Data Warehouse - Monthly District Trends Aggregation Table
-- Pre-computed monthly district-level performance and trend analysis

USE andi_warehouse;

-- Create monthly district trends aggregation table
CREATE TABLE IF NOT EXISTS agg_monthly_district_trends
(
    -- Time dimension (first day of month)
    month_start_date Date,
    month_end_date Date MATERIALIZED lastDayOfMonth(month_start_date),
    trend_year UInt16 MATERIALIZED toYear(month_start_date),
    trend_month UInt8 MATERIALIZED toMonth(month_start_date),
    quarter UInt8 MATERIALIZED toQuarter(month_start_date),
    
    -- District identifier
    district_id UUID,
    
    -- Infrastructure metrics
    total_schools UInt16,
    participating_schools UInt16, -- Schools with ANDI activity
    total_teachers UInt32,
    andi_teachers UInt32,        -- Teachers using ANDI
    active_teachers UInt32,      -- Teachers with sessions this month
    
    -- Adoption and engagement rates
    school_participation_rate Float32 MATERIALIZED CASE 
        WHEN total_schools > 0 THEN (participating_schools * 100.0) / total_schools 
        ELSE 0.0 
    END,
    teacher_adoption_rate Float32 MATERIALIZED CASE 
        WHEN total_teachers > 0 THEN (andi_teachers * 100.0) / total_teachers 
        ELSE 0.0 
    END,
    teacher_engagement_rate Float32 MATERIALIZED CASE 
        WHEN andi_teachers > 0 THEN (active_teachers * 100.0) / andi_teachers 
        ELSE 0.0 
    END,
    
    -- Session volume metrics
    total_sessions UInt32,
    total_duration_hours Float32,
    avg_sessions_per_teacher Float32,
    avg_sessions_per_school Float32,
    sessions_per_day Float32 MATERIALIZED total_sessions / toDayOfMonth(month_end_date),
    
    -- District CIQ Performance
    avg_district_overall_score Float32,
    avg_district_equity_score Float32,
    avg_district_wait_time_score Float32,
    avg_district_engagement_score Float32,
    
    -- Performance distribution across district
    schools_exemplary UInt16,        -- Schools with avg >= 85
    schools_high_performing UInt16,  -- Schools with avg 80-84
    schools_proficient UInt16,       -- Schools with avg 75-79
    schools_developing UInt16,       -- Schools with avg 70-74
    schools_needs_support UInt16,    -- Schools with avg < 70
    
    teachers_excellent UInt16,       -- Teachers with avg >= 85
    teachers_good UInt16,           -- Teachers with avg 75-84
    teachers_fair UInt16,           -- Teachers with avg 65-74
    teachers_poor UInt16,           -- Teachers with avg < 65
    
    -- Performance variability
    school_score_std_dev Float32,
    teacher_score_std_dev Float32,
    performance_consistency String MATERIALIZED CASE
        WHEN school_score_std_dev <= 3.0 THEN 'Very Consistent'
        WHEN school_score_std_dev <= 6.0 THEN 'Consistent'
        WHEN school_score_std_dev <= 10.0 THEN 'Moderate Variation'
        ELSE 'High Variation'
    END,
    
    -- Trend analysis (compared to previous month)
    month_over_month_score_change Float32 DEFAULT 0.0,
    month_over_month_participation_change Float32 DEFAULT 0.0,
    month_over_month_session_change Float32 DEFAULT 0.0,
    
    -- Performance momentum
    schools_improving UInt16 DEFAULT 0,
    schools_declining UInt16 DEFAULT 0,
    teachers_improving UInt16 DEFAULT 0,
    teachers_declining UInt16 DEFAULT 0,
    
    -- Goal achievement tracking
    district_goal_target Float32 DEFAULT 75.0,
    schools_meeting_goal UInt16 DEFAULT 0,
    teachers_meeting_goal UInt16 DEFAULT 0,
    district_goal_achievement_rate Float32 MATERIALIZED CASE
        WHEN participating_schools > 0 THEN (schools_meeting_goal * 100.0) / participating_schools
        ELSE 0.0
    END,
    
    -- Quality and engagement indicators
    avg_questions_per_session Float32,
    avg_responses_per_session Float32,
    avg_student_talk_percentage Float32,
    avg_session_quality_score Float32,
    
    -- Professional development indicators
    schools_needing_intensive_support UInt16 MATERIALIZED schools_needs_support,
    teachers_needing_support UInt16 MATERIALIZED teachers_poor + teachers_fair,
    pd_priority_areas Array(String) DEFAULT [],
    
    -- Innovation and best practices
    top_performing_schools Array(UUID) DEFAULT [],
    exemplary_teachers_count UInt16 DEFAULT 0,
    best_practice_sharing_score Float32 DEFAULT 0.0,
    
    -- Community and collaboration metrics
    community_engagement_score Float32 DEFAULT 0.0,
    resource_usage_score Float32 DEFAULT 0.0,
    cross_school_collaboration_instances UInt16 DEFAULT 0,
    
    -- District health indicators
    teacher_retention_rate Float32 DEFAULT 0.0,
    new_teacher_onboarding_success_rate Float32 DEFAULT 0.0,
    platform_satisfaction_score Float32 DEFAULT 0.0,
    
    -- Overall district performance tier
    district_performance_tier String MATERIALIZED CASE
        WHEN avg_district_overall_score >= 85 AND school_participation_rate >= 90 THEN 'Exemplary'
        WHEN avg_district_overall_score >= 80 AND school_participation_rate >= 80 THEN 'High Performing'
        WHEN avg_district_overall_score >= 75 AND school_participation_rate >= 70 THEN 'Proficient'
        WHEN avg_district_overall_score >= 70 AND school_participation_rate >= 60 THEN 'Developing'
        ELSE 'Needs Intensive Support'
    END,
    
    -- Trend direction classification
    trend_direction String MATERIALIZED CASE
        WHEN month_over_month_score_change > 2.0 THEN 'Strongly Improving'
        WHEN month_over_month_score_change > 0.5 THEN 'Improving'
        WHEN month_over_month_score_change > -0.5 THEN 'Stable'
        WHEN month_over_month_score_change > -2.0 THEN 'Declining'
        ELSE 'Strongly Declining'
    END,
    
    -- Strategic focus areas (calculated from weakest performance areas)
    strategic_focus_primary String DEFAULT '',
    strategic_focus_secondary String DEFAULT '',
    strategic_focus_tertiary String DEFAULT '',
    
    -- Benchmark comparisons
    national_percentile Float32 DEFAULT 0.0,
    state_percentile Float32 DEFAULT 0.0,
    peer_group_percentile Float32 DEFAULT 0.0,
    
    -- Metadata
    created_at DateTime64(3) DEFAULT now(),
    updated_at DateTime64(3) DEFAULT now(),
    
    -- Data lineage
    etl_batch_id String DEFAULT '',
    calculation_timestamp DateTime64(3) DEFAULT now()
)
ENGINE = SummingMergeTree()
PARTITION BY toYear(month_start_date)
ORDER BY (district_id, month_start_date)
PRIMARY KEY (district_id, month_start_date)
SETTINGS 
    index_granularity = 8192;

-- Create indexes for common query patterns
ALTER TABLE agg_monthly_district_trends 
ADD INDEX idx_trend_date (month_start_date, trend_year, trend_month, quarter) TYPE minmax GRANULARITY 1;

ALTER TABLE agg_monthly_district_trends 
ADD INDEX idx_performance (avg_district_overall_score, district_performance_tier) TYPE minmax GRANULARITY 1;

ALTER TABLE agg_monthly_district_trends 
ADD INDEX idx_trends (trend_direction, month_over_month_score_change) TYPE set(10) GRANULARITY 1;

-- Create materialized view to populate from weekly school metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_district_trends_populate
TO agg_monthly_district_trends
AS SELECT 
    toStartOfMonth(week_start_date) as month_start_date,
    district_id,
    
    -- Infrastructure aggregations
    countDistinct(school_id) as total_schools,
    countDistinct(school_id) as participating_schools,
    sum(total_teachers) as total_teachers,
    sum(andi_teachers) as andi_teachers,
    sum(active_teachers) as active_teachers,
    
    -- Session aggregations
    sum(total_sessions) as total_sessions,
    sum(total_duration_hours) as total_duration_hours,
    avg(avg_sessions_per_teacher) as avg_sessions_per_teacher,
    avg(total_sessions) as avg_sessions_per_school,
    
    -- District performance averages
    avg(avg_school_overall_score) as avg_district_overall_score,
    avg(avg_school_equity_score) as avg_district_equity_score,
    avg(avg_school_wait_time_score) as avg_district_wait_time_score,
    avg(avg_school_engagement_score) as avg_district_engagement_score,
    
    -- Performance distribution
    countIf(school_performance_tier = 'Exemplary') as schools_exemplary,
    countIf(school_performance_tier = 'High Performing') as schools_high_performing,
    countIf(school_performance_tier = 'Proficient') as schools_proficient,
    countIf(school_performance_tier = 'Developing') as schools_developing,
    countIf(school_performance_tier = 'Needs Intensive Support') as schools_needs_support,
    
    sum(teachers_excellent) as teachers_excellent,
    sum(teachers_good) as teachers_good,
    sum(teachers_fair) as teachers_fair,
    sum(teachers_poor) as teachers_poor,
    
    -- Performance variability
    stddevPop(avg_school_overall_score) as school_score_std_dev,
    0.0 as teacher_score_std_dev, -- Will be calculated by ETL process
    
    -- Trend defaults (will be calculated by ETL process)
    0.0 as month_over_month_score_change,
    0.0 as month_over_month_participation_change,
    0.0 as month_over_month_session_change,
    0 as schools_improving,
    0 as schools_declining,
    0 as teachers_improving,
    0 as teachers_declining,
    
    -- Goal achievement
    75.0 as district_goal_target,
    countIf(avg_school_overall_score >= 75) as schools_meeting_goal,
    sum(teachers_meeting_goal) as teachers_meeting_goal,
    
    -- Quality metrics
    avg(avg_questions_per_session) as avg_questions_per_session,
    avg(avg_responses_per_session) as avg_responses_per_session,
    avg(avg_student_talk_percentage) as avg_student_talk_percentage,
    avg(school_engagement_quality) as avg_session_quality_score,
    
    -- Defaults for additional metrics
    [] as pd_priority_areas,
    [] as top_performing_schools,
    sum(teachers_excellent) as exemplary_teachers_count,
    0.0 as best_practice_sharing_score,
    0.0 as community_engagement_score,
    0.0 as resource_usage_score,
    0 as cross_school_collaboration_instances,
    0.0 as teacher_retention_rate,
    0.0 as new_teacher_onboarding_success_rate,
    0.0 as platform_satisfaction_score,
    '' as strategic_focus_primary,
    '' as strategic_focus_secondary,
    '' as strategic_focus_tertiary,
    0.0 as national_percentile,
    0.0 as state_percentile,
    0.0 as peer_group_percentile,
    
    now() as created_at,
    now() as updated_at,
    '' as etl_batch_id,
    now() as calculation_timestamp
FROM agg_weekly_school_metrics
WHERE week_start_date >= toStartOfMonth(today() - INTERVAL 12 MONTH)
GROUP BY toStartOfMonth(week_start_date), district_id;

-- Create view for district performance trends over time
CREATE VIEW IF NOT EXISTS v_district_performance_trends AS
SELECT 
    district_id,
    month_start_date,
    avg_district_overall_score,
    district_performance_tier,
    trend_direction,
    school_participation_rate,
    teacher_adoption_rate,
    teacher_engagement_rate,
    total_sessions,
    
    -- Calculate rolling 6-month averages
    avg(avg_district_overall_score) OVER (
        PARTITION BY district_id 
        ORDER BY month_start_date 
        ROWS BETWEEN 5 PRECEDING AND CURRENT ROW
    ) as rolling_6month_avg_score,
    
    -- Calculate year-over-year change
    avg_district_overall_score - lag(avg_district_overall_score, 12) OVER (
        PARTITION BY district_id 
        ORDER BY month_start_date
    ) as year_over_year_change,
    
    -- Calculate trend acceleration
    month_over_month_score_change - lag(month_over_month_score_change, 1) OVER (
        PARTITION BY district_id 
        ORDER BY month_start_date
    ) as trend_acceleration
FROM agg_monthly_district_trends
WHERE month_start_date >= today() - INTERVAL 24 MONTH
ORDER BY district_id, month_start_date;

-- Create view for district benchmarking
CREATE VIEW IF NOT EXISTS v_district_benchmarking AS
SELECT 
    district_id,
    month_start_date,
    district_performance_tier,
    avg_district_overall_score,
    school_participation_rate,
    teacher_engagement_rate,
    
    -- Compare to all districts in same month
    avg_district_overall_score - avg(avg_district_overall_score) OVER (
        PARTITION BY month_start_date
    ) as score_vs_national_avg,
    
    -- Percentile ranking among all districts
    percent_rank() OVER (
        PARTITION BY month_start_date 
        ORDER BY avg_district_overall_score
    ) * 100 as national_percentile_rank,
    
    -- Rank within performance tier
    rank() OVER (
        PARTITION BY month_start_date, district_performance_tier 
        ORDER BY avg_district_overall_score DESC
    ) as tier_rank,
    
    -- Flag top performers
    CASE 
        WHEN avg_district_overall_score >= quantile(0.90)(avg_district_overall_score) OVER (
            PARTITION BY month_start_date
        ) THEN 'Top 10%'
        WHEN avg_district_overall_score >= quantile(0.75)(avg_district_overall_score) OVER (
            PARTITION BY month_start_date
        ) THEN 'Top 25%'
        WHEN avg_district_overall_score <= quantile(0.10)(avg_district_overall_score) OVER (
            PARTITION BY month_start_date
        ) THEN 'Bottom 10%'
        WHEN avg_district_overall_score <= quantile(0.25)(avg_district_overall_score) OVER (
            PARTITION BY month_start_date
        ) THEN 'Bottom 25%'
        ELSE 'Middle 50%'
    END as performance_quartile
FROM agg_monthly_district_trends
WHERE month_start_date >= today() - INTERVAL 12 MONTH;

-- Create view for strategic planning insights
CREATE VIEW IF NOT EXISTS v_district_strategic_insights AS
SELECT 
    district_id,
    month_start_date,
    district_performance_tier,
    trend_direction,
    
    -- Identify improvement opportunities
    CASE 
        WHEN avg_district_equity_score < avg_district_wait_time_score 
         AND avg_district_equity_score < avg_district_engagement_score THEN 'Focus on Equity'
        WHEN avg_district_wait_time_score < avg_district_engagement_score THEN 'Focus on Wait Time'
        ELSE 'Focus on Student Engagement'
    END as primary_improvement_area,
    
    -- Capacity for improvement
    CASE 
        WHEN school_participation_rate < 70 THEN 'Expand School Participation'
        WHEN teacher_adoption_rate < 60 THEN 'Increase Teacher Adoption'
        WHEN teacher_engagement_rate < 70 THEN 'Improve Teacher Engagement'
        ELSE 'Optimize Performance Quality'
    END as capacity_improvement_area,
    
    -- Success indicators
    schools_exemplary + schools_high_performing as high_performing_schools_count,
    exemplary_teachers_count,
    district_goal_achievement_rate,
    
    -- Challenge indicators
    schools_needs_support as schools_requiring_intensive_support,
    teachers_needing_support as teachers_requiring_support,
    performance_consistency,
    
    -- Strategic recommendations
    multiIf(
        district_performance_tier = 'Needs Intensive Support', 'Comprehensive Intervention Required',
        trend_direction = 'Strongly Declining', 'Immediate Action Required',
        school_participation_rate < 50, 'Focus on Adoption Strategy',
        performance_consistency = 'High Variation', 'Standardize Best Practices',
        'Continue Current Strategy with Targeted Improvements'
    ) as strategic_recommendation
FROM agg_monthly_district_trends
WHERE month_start_date = (SELECT max(month_start_date) FROM agg_monthly_district_trends);

-- Optimize table after creation
OPTIMIZE TABLE agg_monthly_district_trends;

-- Show table info
DESCRIBE agg_monthly_district_trends;

-- Validation query
SELECT 
    'agg_monthly_district_trends' as table_name,
    count() as total_records,
    countDistinct(district_id) as unique_districts,
    countDistinct(month_start_date) as unique_months,
    sum(total_sessions) as total_sessions_aggregated,
    avg(avg_district_overall_score) as overall_avg_score,
    min(month_start_date) as earliest_month,
    max(month_start_date) as latest_month,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM agg_monthly_district_trends amdt
LEFT JOIN system.parts sp ON sp.table = 'agg_monthly_district_trends' AND sp.database = 'andi_warehouse' AND sp.active = 1;