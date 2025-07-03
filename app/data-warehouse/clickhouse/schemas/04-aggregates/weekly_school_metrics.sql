-- ANDI Data Warehouse - Weekly School Metrics Aggregation Table
-- Pre-computed weekly school-level performance metrics

USE andi_warehouse;

-- Create weekly school metrics aggregation table
CREATE TABLE IF NOT EXISTS agg_weekly_school_metrics
(
    -- Time dimension (week starting Monday)
    week_start_date Date,
    week_end_date Date MATERIALIZED week_start_date + INTERVAL 6 DAY,
    week_year UInt16 MATERIALIZED toYear(week_start_date),
    week_number UInt8 MATERIALIZED toWeek(week_start_date),
    
    -- School identifiers
    school_id UUID,
    district_id UUID,
    
    -- Teacher participation metrics
    total_teachers UInt16, -- Total teachers in school
    active_teachers UInt16, -- Teachers who had sessions this week
    andi_teachers UInt16,   -- Teachers using ANDI platform
    engagement_rate Float32 MATERIALIZED CASE 
        WHEN total_teachers > 0 THEN (active_teachers * 100.0) / total_teachers 
        ELSE 0.0 
    END,
    
    -- Session metrics
    total_sessions UInt32,
    total_duration_hours Float32,
    avg_sessions_per_teacher Float32,
    avg_session_duration_minutes Float32,
    
    -- CIQ Performance Metrics
    avg_school_overall_score Float32,
    avg_school_equity_score Float32,
    avg_school_wait_time_score Float32,
    avg_school_engagement_score Float32,
    
    -- Performance distribution
    teachers_excellent UInt16,  -- Teachers with avg score >= 85
    teachers_good UInt16,       -- Teachers with avg score 75-84
    teachers_fair UInt16,       -- Teachers with avg score 65-74
    teachers_poor UInt16,       -- Teachers with avg score < 65
    
    -- School performance indicators
    top_performer_score Float32,    -- Highest teacher average
    lowest_performer_score Float32, -- Lowest teacher average
    score_standard_deviation Float32,
    performance_consistency String MATERIALIZED CASE
        WHEN score_standard_deviation <= 5.0 THEN 'Very Consistent'
        WHEN score_standard_deviation <= 10.0 THEN 'Consistent'
        WHEN score_standard_deviation <= 15.0 THEN 'Moderate Variation'
        ELSE 'High Variation'
    END,
    
    -- Improvement tracking
    week_over_week_change Float32 DEFAULT 0.0,
    teachers_improving UInt16 DEFAULT 0,
    teachers_declining UInt16 DEFAULT 0,
    
    -- Goal achievement
    school_goal_target Float32 DEFAULT 75.0,
    teachers_meeting_goal UInt16 DEFAULT 0,
    goal_achievement_rate Float32 MATERIALIZED CASE
        WHEN andi_teachers > 0 THEN (teachers_meeting_goal * 100.0) / andi_teachers
        ELSE 0.0
    END,
    
    -- Interaction quality metrics
    avg_questions_per_session Float32,
    avg_responses_per_session Float32,
    avg_student_talk_percentage Float32,
    
    -- Professional development indicators
    teachers_needing_support UInt16 MATERIALIZED teachers_poor + teachers_fair,
    pd_priority_areas Array(String) DEFAULT [],
    
    -- School performance tier
    school_performance_tier String MATERIALIZED CASE
        WHEN avg_school_overall_score >= 85 THEN 'Exemplary'
        WHEN avg_school_overall_score >= 80 THEN 'High Performing'
        WHEN avg_school_overall_score >= 75 THEN 'Proficient'
        WHEN avg_school_overall_score >= 70 THEN 'Developing'
        ELSE 'Needs Intensive Support'
    END,
    
    -- Engagement quality score (composite metric)
    school_engagement_quality Float32 MATERIALIZED (
        (engagement_rate * 0.3) +
        (avg_school_overall_score * 0.4) +
        (goal_achievement_rate * 0.2) +
        (CASE WHEN score_standard_deviation <= 10 THEN 10.0 ELSE 5.0 END * 0.1)
    ),
    
    -- Resource usage and community engagement
    community_posts_count UInt16 DEFAULT 0,
    resource_interactions_count UInt32 DEFAULT 0,
    cross_teacher_collaboration_score Float32 DEFAULT 0.0,
    
    -- Metadata
    created_at DateTime64(3) DEFAULT now(),
    updated_at DateTime64(3) DEFAULT now(),
    
    -- Data lineage
    etl_batch_id String DEFAULT '',
    calculation_timestamp DateTime64(3) DEFAULT now()
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(week_start_date)
ORDER BY (district_id, school_id, week_start_date)
PRIMARY KEY (district_id, school_id, week_start_date)
SETTINGS 
    index_granularity = 8192;

-- Create indexes for common query patterns
ALTER TABLE agg_weekly_school_metrics 
ADD INDEX idx_week_date (week_start_date, week_year, week_number) TYPE minmax GRANULARITY 1;

ALTER TABLE agg_weekly_school_metrics 
ADD INDEX idx_performance (avg_school_overall_score, school_performance_tier) TYPE minmax GRANULARITY 1;

ALTER TABLE agg_weekly_school_metrics 
ADD INDEX idx_engagement (engagement_rate, goal_achievement_rate) TYPE minmax GRANULARITY 1;

-- Create materialized view to populate from daily teacher performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_weekly_school_metrics_populate
TO agg_weekly_school_metrics
AS SELECT 
    toMonday(performance_date) as week_start_date,
    school_id,
    district_id,
    
    -- Teacher counts (will need to be enhanced by ETL process with actual teacher counts)
    countDistinct(teacher_id) as total_teachers,
    countDistinct(teacher_id) as active_teachers,
    countDistinct(teacher_id) as andi_teachers,
    
    -- Session aggregations
    sum(session_count) as total_sessions,
    sum(total_duration_minutes) / 60.0 as total_duration_hours,
    avg(session_count) as avg_sessions_per_teacher,
    avg(avg_session_duration_minutes) as avg_session_duration_minutes,
    
    -- School-level CIQ averages
    avg(avg_overall_score) as avg_school_overall_score,
    avg(avg_equity_score) as avg_school_equity_score,
    avg(avg_wait_time_score) as avg_school_wait_time_score,
    avg(avg_student_engagement) as avg_school_engagement_score,
    
    -- Performance distribution
    countIf(avg_overall_score >= 85) as teachers_excellent,
    countIf(avg_overall_score >= 75 AND avg_overall_score < 85) as teachers_good,
    countIf(avg_overall_score >= 65 AND avg_overall_score < 75) as teachers_fair,
    countIf(avg_overall_score < 65) as teachers_poor,
    
    -- Performance spread
    max(avg_overall_score) as top_performer_score,
    min(avg_overall_score) as lowest_performer_score,
    stddevPop(avg_overall_score) as score_standard_deviation,
    
    -- Defaults for calculated fields
    0.0 as week_over_week_change,
    0 as teachers_improving,
    0 as teachers_declining,
    75.0 as school_goal_target,
    countIf(avg_overall_score >= 75) as teachers_meeting_goal,
    
    -- Interaction metrics
    avg(avg_questions_per_session) as avg_questions_per_session,
    avg(avg_responses_per_session) as avg_responses_per_session,
    avg(avg_student_talk_percentage) as avg_student_talk_percentage,
    
    -- Defaults for additional metrics
    [] as pd_priority_areas,
    0 as community_posts_count,
    0 as resource_interactions_count,
    0.0 as cross_teacher_collaboration_score,
    
    now() as created_at,
    now() as updated_at,
    '' as etl_batch_id,
    now() as calculation_timestamp
FROM agg_daily_teacher_performance
WHERE performance_date >= today() - INTERVAL 12 WEEK
GROUP BY toMonday(performance_date), school_id, district_id;

-- Create view for school performance trends
CREATE VIEW IF NOT EXISTS v_school_performance_trends AS
SELECT 
    school_id,
    district_id,
    week_start_date,
    avg_school_overall_score,
    school_performance_tier,
    engagement_rate,
    goal_achievement_rate,
    total_sessions,
    active_teachers,
    
    -- Calculate 4-week moving averages
    avg(avg_school_overall_score) OVER (
        PARTITION BY school_id 
        ORDER BY week_start_date 
        ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
    ) as moving_avg_4week_score,
    
    -- Calculate month-over-month change
    avg_school_overall_score - lag(avg_school_overall_score, 4) OVER (
        PARTITION BY school_id 
        ORDER BY week_start_date
    ) as month_over_month_change,
    
    -- Rank schools within district
    rank() OVER (
        PARTITION BY district_id, week_start_date 
        ORDER BY avg_school_overall_score DESC
    ) as district_rank,
    
    -- Calculate improvement trend
    CASE 
        WHEN avg_school_overall_score - lag(avg_school_overall_score, 4) OVER (
            PARTITION BY school_id ORDER BY week_start_date
        ) > 2.0 THEN 'Improving'
        WHEN avg_school_overall_score - lag(avg_school_overall_score, 4) OVER (
            PARTITION BY school_id ORDER BY week_start_date
        ) < -2.0 THEN 'Declining'
        ELSE 'Stable'
    END as trend_direction
FROM agg_weekly_school_metrics
WHERE week_start_date >= today() - INTERVAL 24 WEEK
ORDER BY school_id, week_start_date;

-- Create view for district school comparison
CREATE VIEW IF NOT EXISTS v_district_school_comparison AS
SELECT 
    district_id,
    week_start_date,
    school_id,
    avg_school_overall_score,
    school_performance_tier,
    engagement_rate,
    goal_achievement_rate,
    active_teachers,
    
    -- Compare to district average
    avg_school_overall_score - avg(avg_school_overall_score) OVER (
        PARTITION BY district_id, week_start_date
    ) as score_vs_district_avg,
    
    -- Calculate percentile within district
    percent_rank() OVER (
        PARTITION BY district_id, week_start_date 
        ORDER BY avg_school_overall_score
    ) * 100 as district_percentile,
    
    -- Flag schools needing attention
    CASE 
        WHEN avg_school_overall_score < 70 THEN 'Immediate Attention'
        WHEN engagement_rate < 50 THEN 'Engagement Issue'
        WHEN goal_achievement_rate < 60 THEN 'Goal Achievement Issue'
        WHEN score_standard_deviation > 15 THEN 'Consistency Issue'
        ELSE 'Performing Well'
    END as attention_flag
FROM agg_weekly_school_metrics
WHERE week_start_date >= today() - INTERVAL 12 WEEK;

-- Create view for professional development recommendations
CREATE VIEW IF NOT EXISTS v_school_pd_recommendations AS
SELECT 
    school_id,
    district_id,
    week_start_date,
    school_performance_tier,
    teachers_needing_support,
    avg_school_equity_score,
    avg_school_wait_time_score,
    avg_school_engagement_score,
    score_standard_deviation,
    
    -- Generate PD recommendations based on lowest scores
    CASE 
        WHEN avg_school_equity_score < avg_school_wait_time_score 
         AND avg_school_equity_score < avg_school_engagement_score THEN 'Equity and Student Participation'
        WHEN avg_school_wait_time_score < avg_school_engagement_score THEN 'Wait Time and Questioning Techniques'
        ELSE 'Student Engagement Strategies'
    END as primary_pd_focus,
    
    -- Secondary recommendations
    multiIf(
        score_standard_deviation > 15, 'Teacher Collaboration and Consistency',
        engagement_rate < 70, 'Platform Adoption and Usage',
        goal_achievement_rate < 70, 'Goal Setting and Progress Monitoring',
        'Advanced Teaching Strategies'
    ) as secondary_pd_focus,
    
    -- Urgency level
    CASE 
        WHEN teachers_needing_support > (total_teachers * 0.5) THEN 'High Priority'
        WHEN teachers_needing_support > (total_teachers * 0.25) THEN 'Medium Priority'
        ELSE 'Low Priority'
    END as pd_urgency
FROM agg_weekly_school_metrics
WHERE week_start_date = (SELECT max(week_start_date) FROM agg_weekly_school_metrics);

-- Optimize table after creation
OPTIMIZE TABLE agg_weekly_school_metrics;

-- Show table info
DESCRIBE agg_weekly_school_metrics;

-- Validation query
SELECT 
    'agg_weekly_school_metrics' as table_name,
    count() as total_records,
    countDistinct(school_id) as unique_schools,
    countDistinct(week_start_date) as unique_weeks,
    sum(total_sessions) as total_sessions_aggregated,
    avg(avg_school_overall_score) as overall_avg_score,
    min(week_start_date) as earliest_week,
    max(week_start_date) as latest_week,
    formatReadableSize(sum(data_compressed_bytes)) as compressed_size
FROM agg_weekly_school_metrics awsm
LEFT JOIN system.parts sp ON sp.table = 'agg_weekly_school_metrics' AND sp.database = 'andi_warehouse' AND sp.active = 1;