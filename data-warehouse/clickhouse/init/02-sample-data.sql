-- ANDI Data Warehouse - Sample Data for Testing
-- Insert realistic sample data to validate schema and test queries

USE andi_warehouse;

SELECT 'Inserting sample data for ANDI Data Warehouse...' as status, now() as timestamp;

-- 1. Insert sample districts
INSERT INTO dims_districts (
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
    district_priorities,
    improvement_initiatives,
    effective_date,
    created_at,
    updated_at
) VALUES
(
    generateUUIDv4(),
    'Metro City School District',
    'MCSD-001',
    'public',
    'California',
    'Central Valley',
    'Dr. Sarah Johnson',
    25,
    15,
    5,
    5,
    18500,
    950,
    19.5,
    'Proficient',
    78.5,
    87.2,
    45.3,
    285000000,
    15405,
    72000,
    '2024-01-15',
    12,
    156,
    142,
    76.8,
    1247,
    ['Student Achievement', 'Teacher Development', 'Technology Integration'],
    ['CIQ Implementation', 'Professional Learning Communities', 'Data-Driven Instruction'],
    '2024-01-01',
    now(),
    now()
),
(
    generateUUIDv4(),
    'Riverside County Schools',
    'RCS-002',
    'public',
    'California',
    'Southern California',
    'Dr. Michael Rodriguez',
    18,
    10,
    4,
    4,
    12800,
    680,
    18.8,
    'High Performing',
    82.1,
    91.5,
    28.7,
    195000000,
    15234,
    68500,
    '2024-03-01',
    8,
    98,
    89,
    81.2,
    892,
    ['Equity in Education', 'STEM Excellence', 'Community Engagement'],
    ['Equity-Centered Teaching', 'STEM Academy Expansion', 'Parent Partnership Program'],
    '2024-01-01',
    now(),
    now()
),
(
    generateUUIDv4(),
    'Mountain View Unified',
    'MVU-003',
    'public',
    'Colorado',
    'Front Range',
    'Dr. Jennifer Chen',
    8,
    5,
    2,
    1,
    5200,
    285,
    18.2,
    'Exemplary',
    85.3,
    94.1,
    15.2,
    89000000,
    17115,
    75000,
    '2024-02-01',
    6,
    52,
    48,
    83.4,
    567,
    ['Innovation in Learning', 'Personalized Education', 'Sustainability'],
    ['Personalized Learning Pathways', 'Green Schools Initiative', 'Teacher Leadership Development'],
    '2024-01-01',
    now(),
    now()
);

-- Get the district IDs for use in subsequent inserts
-- Note: In a real scenario, these would be actual UUIDs from the source system

-- 2. Insert sample schools
INSERT INTO dims_schools (
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
    test_scores_avg,
    andi_adoption_date,
    total_andi_teachers,
    active_andi_teachers,
    avg_school_ciq_score,
    total_ciq_sessions,
    free_lunch_eligible_percent,
    community_type,
    socioeconomic_level,
    improvement_goals,
    focus_initiatives,
    effective_date,
    created_at,
    updated_at
) VALUES
(
    generateUUIDv4(),
    'Lincoln Elementary School',
    'LES-101',
    'elementary',
    '1234 Oak Street',
    'Metro City',
    'California',
    '95401',
    '+15551234567',
    'principal@lincoln.mcsd.edu',
    'Ms. Patricia Williams',
    (SELECT district_id FROM dims_districts WHERE district_name = 'Metro City School District' LIMIT 1),
    'Metro City School District',
    ['K', '1', '2', '3', '4', '5'],
    485,
    24,
    'traditional',
    ['gifted', 'special_ed', 'esl'],
    'Proficient',
    76.2,
    '2024-02-01',
    18,
    16,
    74.8,
    156,
    52.1,
    'urban',
    'medium',
    ['Improve Reading Scores', 'Increase Family Engagement', 'Enhance STEM Learning'],
    ['Reading Recovery Program', 'Family Math Nights', 'Science Lab Upgrade'],
    '2024-01-01',
    now(),
    now()
),
(
    generateUUIDv4(),
    'Washington Middle School',
    'WMS-201',
    'middle',
    '5678 Maple Avenue',
    'Metro City',
    'California',
    '95402',
    '+15551234568',
    'principal@washington.mcsd.edu',
    'Dr. Robert Kim',
    (SELECT district_id FROM dims_districts WHERE district_name = 'Metro City School District' LIMIT 1),
    'Metro City School District',
    ['6', '7', '8'],
    650,
    32,
    'traditional',
    ['honors', 'special_ed', 'arts'],
    'Good',
    78.9,
    '2024-01-15',
    25,
    23,
    77.6,
    287,
    41.3,
    'urban',
    'medium',
    ['Reduce Achievement Gap', 'Improve School Climate', 'Increase Student Engagement'],
    ['Peer Tutoring Program', 'Restorative Justice Practices', 'Project-Based Learning'],
    '2024-01-01',
    now(),
    now()
),
(
    generateUUIDv4(),
    'Riverside High School',
    'RHS-301',
    'high',
    '9876 River Road',
    'Riverside',
    'California',
    '92501',
    '+15551234569',
    'principal@riverside.rcs.edu',
    'Mr. David Thompson',
    (SELECT district_id FROM dims_districts WHERE district_name = 'Riverside County Schools' LIMIT 1),
    'Riverside County Schools',
    ['9', '10', '11', '12'],
    1200,
    68,
    'comprehensive',
    ['ap', 'dual_enrollment', 'career_tech'],
    'High Performing',
    84.7,
    '2024-03-15',
    45,
    42,
    82.1,
    456,
    25.8,
    'suburban',
    'high',
    ['College Readiness', 'Career Pathway Completion', 'Student Wellness'],
    ['AP for All Initiative', 'Industry Partnership Program', 'Mental Health Support'],
    '2024-01-01',
    now(),
    now()
);

-- 3. Insert sample teachers
INSERT INTO dims_teachers (
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
    onboarding_date,
    last_login_date,
    total_sessions,
    avg_ciq_score,
    community_engagement_score,
    resource_usage_score,
    current_goals,
    focus_areas,
    strengths,
    effective_date,
    created_at,
    updated_at
) VALUES
(
    generateUUIDv4(),
    'Emily Johnson',
    'ejohnson@lincoln.mcsd.edu',
    (SELECT school_id FROM dims_schools WHERE school_name = 'Lincoln Elementary School' LIMIT 1),
    'Lincoln Elementary School',
    (SELECT district_id FROM dims_districts WHERE district_name = 'Metro City School District' LIMIT 1),
    'Metro City School District',
    ['3', '4'],
    ['Mathematics', 'Science'],
    8,
    'inquiry_based',
    'teacher',
    1,
    '2024-02-15',
    today() - 1,
    23,
    78.4,
    6.8,
    8.2,
    ['Increase student engagement', 'Improve wait time'],
    ['Student participation', 'Question techniques'],
    ['Math instruction', 'Student rapport'],
    '2024-01-01',
    now(),
    now()
),
(
    generateUUIDv4(),
    'Michael Chen',
    'mchen@washington.mcsd.edu',
    (SELECT school_id FROM dims_schools WHERE school_name = 'Washington Middle School' LIMIT 1),
    'Washington Middle School',
    (SELECT district_id FROM dims_districts WHERE district_name = 'Metro City School District' LIMIT 1),
    'Metro City School District',
    ['7', '8'],
    ['English Language Arts'],
    12,
    'collaborative',
    'teacher',
    1,
    '2024-01-30',
    today(),
    31,
    81.2,
    8.5,
    7.9,
    ['Enhance discussion quality', 'Build reading comprehension'],
    ['Socratic seminars', 'Text analysis'],
    ['Writing instruction', 'Critical thinking'],
    '2024-01-01',
    now(),
    now()
),
(
    generateUUIDv4(),
    'Sarah Rodriguez',
    'srodriguez@riverside.rcs.edu',
    (SELECT school_id FROM dims_schools WHERE school_name = 'Riverside High School' LIMIT 1),
    'Riverside High School',
    (SELECT district_id FROM dims_districts WHERE district_name = 'Riverside County Schools' LIMIT 1),
    'Riverside County Schools',
    ['10', '11', '12'],
    ['Biology', 'Chemistry'],
    15,
    'direct_instruction',
    'mentor_teacher',
    1,
    '2024-03-20',
    today(),
    42,
    85.6,
    9.1,
    8.8,
    ['Support new teachers', 'Advance AP success'],
    ['Mentoring skills', 'Laboratory safety'],
    ['Science content', 'Lab management', 'Student motivation'],
    '2024-01-01',
    now(),
    now()
),
(
    generateUUIDv4(),
    'James Wilson',
    'jwilson@lincoln.mcsd.edu',
    (SELECT school_id FROM dims_schools WHERE school_name = 'Lincoln Elementary School' LIMIT 1),
    'Lincoln Elementary School',
    (SELECT district_id FROM dims_districts WHERE district_name = 'Metro City School District' LIMIT 1),
    'Metro City School District',
    ['K', '1', '2'],
    ['Reading', 'Language Arts'],
    5,
    'balanced_literacy',
    'teacher',
    1,
    '2024-02-10',
    today() - 2,
    18,
    72.3,
    5.2,
    6.8,
    ['Improve phonics instruction', 'Increase equity'],
    ['Phonemic awareness', 'Inclusive practices'],
    ['Early literacy', 'Patience with struggling readers'],
    '2024-01-01',
    now(),
    now()
);

-- 4. Insert sample CIQ sessions (last 30 days)
INSERT INTO facts_ciq_sessions (
    session_id,
    teacher_id,
    school_id,
    district_id,
    session_date,
    session_timestamp,
    duration_seconds,
    equity_score,
    wait_time_avg,
    student_engagement,
    overall_score,
    student_talk_time,
    teacher_talk_time,
    silence_time,
    question_count,
    response_count,
    created_at
)
SELECT 
    generateUUIDv4() as session_id,
    dt.teacher_id,
    dt.school_id,
    dt.district_id,
    session_date,
    session_date + INTERVAL (rand() * 8 + 8) HOUR as session_timestamp, -- Random time between 8am-4pm
    1800 + (rand() * 1800) as duration_seconds, -- 30-60 minute sessions
    60 + (rand() * 35) as equity_score,      -- 60-95 range
    65 + (rand() * 30) as wait_time_avg,     -- 65-95 range  
    70 + (rand() * 25) as student_engagement, -- 70-95 range
    (60 + (rand() * 35) + 65 + (rand() * 30) + 70 + (rand() * 25)) / 3 as overall_score, -- Average of the three
    600 + (rand() * 800) as student_talk_time,  -- Student talk time in seconds
    800 + (rand() * 600) as teacher_talk_time,   -- Teacher talk time in seconds
    200 + (rand() * 400) as silence_time,        -- Silence time in seconds
    8 + (rand() * 15) as question_count,         -- 8-23 questions
    12 + (rand() * 20) as response_count,        -- 12-32 responses
    session_date + INTERVAL (rand() * 8 + 8) HOUR + INTERVAL 5 MINUTE as created_at
FROM (
    SELECT teacher_id, school_id, district_id 
    FROM dims_teachers 
    WHERE is_current = 1
) dt
CROSS JOIN (
    SELECT today() - number as session_date
    FROM numbers(30)
    WHERE toDayOfWeek(today() - number) NOT IN (6, 7) -- Exclude weekends
) dates
WHERE rand() > 0.3; -- ~70% chance teacher has a session on any given day

-- 5. Insert sample resource usage data
INSERT INTO facts_resource_usage (
    interaction_id,
    user_id,
    resource_id,
    interaction_date,
    interaction_timestamp,
    interaction_type,
    resource_title,
    resource_type,
    resource_category,
    user_type,
    user_school_id,
    user_district_id,
    session_duration_seconds,
    created_at
)
SELECT 
    generateUUIDv4() as interaction_id,
    dt.teacher_id as user_id,
    generateUUIDv4() as resource_id, -- Would be actual resource IDs in production
    interaction_date,
    interaction_date + INTERVAL (rand() * 16 + 6) HOUR as interaction_timestamp, -- 6am-10pm
    ['view', 'like', 'bookmark', 'download', 'share'][toUInt32(rand() * 5) + 1] as interaction_type,
    ['Effective Questioning Strategies', 'Building Student Engagement', 'Wait Time Best Practices', 'Equity in the Classroom', 'CIQ Framework Guide'][toUInt32(rand() * 5) + 1] as resource_title,
    ['article', 'video', 'guide', 'template'][toUInt32(rand() * 4) + 1] as resource_type,
    ['student_engagement', 'wait_time', 'equity', 'classroom_management'][toUInt32(rand() * 4) + 1] as resource_category,
    'teacher' as user_type,
    dt.school_id as user_school_id,
    dt.district_id as user_district_id,
    30 + (rand() * 300) as session_duration_seconds, -- 30 seconds to 5 minutes
    interaction_date + INTERVAL (rand() * 16 + 6) HOUR + INTERVAL 2 MINUTE as created_at
FROM (
    SELECT teacher_id, school_id, district_id 
    FROM dims_teachers 
    WHERE is_current = 1
) dt
CROSS JOIN (
    SELECT today() - number as interaction_date
    FROM numbers(14) -- Last 2 weeks
) dates
WHERE rand() > 0.6; -- ~40% chance of resource interaction per teacher per day

-- 6. Insert sample community activity
INSERT INTO facts_community_activity (
    activity_id,
    user_id,
    target_id,
    activity_date,
    activity_timestamp,
    activity_type,
    target_type,
    content_title,
    content_tags,
    content_category,
    user_type,
    user_school_id,
    user_district_id,
    content_length,
    received_votes,
    is_accepted_answer,
    created_at
)
SELECT 
    generateUUIDv4() as activity_id,
    dt.teacher_id as user_id,
    generateUUIDv4() as target_id,
    activity_date,
    activity_date + INTERVAL (rand() * 14 + 7) HOUR as activity_timestamp, -- 7am-9pm
    ['question_posted', 'answer_posted', 'vote_up', 'bookmark', 'comment'][toUInt32(rand() * 5) + 1] as activity_type,
    ['question', 'answer', 'comment'][toUInt32(rand() * 3) + 1] as target_type,
    ['How to improve wait time?', 'Best strategies for student engagement', 'Equity practices that work', 'Managing diverse learners'][toUInt32(rand() * 4) + 1] as content_title,
    [['wait_time'], ['engagement'], ['equity'], ['classroom_management']][toUInt32(rand() * 4) + 1] as content_tags,
    ['wait_time', 'student_engagement', 'equity', 'classroom_management'][toUInt32(rand() * 4) + 1] as content_category,
    'teacher' as user_type,
    dt.school_id as user_school_id,
    dt.district_id as user_district_id,
    100 + (rand() * 500) as content_length, -- 100-600 characters
    toUInt32(rand() * 10) as received_votes, -- 0-10 votes
    CASE WHEN rand() > 0.8 THEN 1 ELSE 0 END as is_accepted_answer, -- 20% chance of accepted answer
    activity_date + INTERVAL (rand() * 14 + 7) HOUR + INTERVAL 1 MINUTE as created_at
FROM (
    SELECT teacher_id, school_id, district_id 
    FROM dims_teachers 
    WHERE is_current = 1
) dt
CROSS JOIN (
    SELECT today() - number as activity_date
    FROM numbers(21) -- Last 3 weeks
) dates
WHERE rand() > 0.8; -- ~20% chance of community activity per teacher per day

-- 7. Optimize all tables after data insertion
SELECT 'Optimizing tables after data insertion...' as status, now() as timestamp;

OPTIMIZE TABLE facts_ciq_sessions;
OPTIMIZE TABLE facts_resource_usage;
OPTIMIZE TABLE facts_community_activity;
OPTIMIZE TABLE dims_teachers;
OPTIMIZE TABLE dims_schools;
OPTIMIZE TABLE dims_districts;

-- 8. Display sample data summary
SELECT 'Sample data insertion completed!' as status, now() as timestamp;

-- Show data counts
SELECT 'Data Summary:' as summary;

SELECT 
    'Districts' as table_name,
    count() as record_count,
    countDistinct(district_id) as unique_count
FROM dims_districts

UNION ALL

SELECT 
    'Schools' as table_name,
    count() as record_count,
    countDistinct(school_id) as unique_count
FROM dims_schools

UNION ALL

SELECT 
    'Teachers' as table_name,
    count() as record_count,
    countDistinct(teacher_id) as unique_count
FROM dims_teachers

UNION ALL

SELECT 
    'CIQ Sessions' as table_name,
    count() as record_count,
    countDistinct(session_id) as unique_count
FROM facts_ciq_sessions

UNION ALL

SELECT 
    'Resource Usage' as table_name,
    count() as record_count,
    countDistinct(interaction_id) as unique_count
FROM facts_resource_usage

UNION ALL

SELECT 
    'Community Activity' as table_name,
    count() as record_count,
    countDistinct(activity_id) as unique_count
FROM facts_community_activity;

-- Show sample CIQ performance by teacher
SELECT 'Sample CIQ Performance by Teacher:' as info;
SELECT 
    dt.full_name as teacher_name,
    ds.school_name,
    count(fcs.session_id) as total_sessions,
    round(avg(fcs.overall_score), 1) as avg_overall_score,
    round(avg(fcs.equity_score), 1) as avg_equity_score,
    round(avg(fcs.student_engagement), 1) as avg_engagement,
    min(fcs.session_date) as first_session,
    max(fcs.session_date) as last_session
FROM dims_teachers dt
JOIN dims_schools ds ON dt.school_id = ds.school_id
LEFT JOIN facts_ciq_sessions fcs ON dt.teacher_id = fcs.teacher_id
WHERE dt.is_current = 1
GROUP BY dt.teacher_id, dt.full_name, ds.school_name
ORDER BY avg_overall_score DESC;

SELECT 'Sample data is ready for testing and development!' as final_status, now() as completion_time;