-- ANDI CIQ Framework Mock Data
-- Description: Comprehensive seed data for testing the complete CIQ framework including students, surveys, and detailed analytics

-- Clear existing CIQ-related data for fresh seeding (only if tables exist)
DO $$
BEGIN
    -- Clear tables in dependency order
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'classroom_enrollments') THEN
        DELETE FROM core.classroom_enrollments;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'student_academic_records') THEN
        DELETE FROM core.student_academic_records;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'student_attendance') THEN
        DELETE FROM core.student_attendance;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'student_behavior_records') THEN
        DELETE FROM core.student_behavior_records;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'survey_responses') THEN
        DELETE FROM survey_responses;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'students') THEN
        DELETE FROM core.students;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'classrooms') THEN
        DELETE FROM core.classrooms;
    END IF;
END $$;

-- Set search path
SET search_path TO core, public;

-- Insert mock students using existing district and school IDs
INSERT INTO core.students (student_id, student_identifier, district_id, school_id, first_name, last_name, grade_level, date_of_birth, demographic_data, special_needs) VALUES
-- Montgomery County Students
('550e8400-e29b-41d4-a716-446655440001', 'MC001', (SELECT id FROM core.districts LIMIT 1), (SELECT id FROM core.schools LIMIT 1), 'Aaliyah', 'Johnson', '7', '2011-03-15', '{"ethnicity": "African American", "primary_language": "English", "free_lunch": true, "cultural_background": "African American"}', '{}'),
('550e8400-e29b-41d4-a716-446655440002', 'MC002', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Benjamin', 'Chen', '7', '2011-07-22', '{"ethnicity": "Asian", "primary_language": "Mandarin", "free_lunch": false, "cultural_background": "Chinese American"}', '{"accommodations": ["ESL support", "extra time for tests"]}'),
('550e8400-e29b-41d4-a716-446655440003', 'MC003', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Carlos', 'Rodriguez', '7', '2011-01-08', '{"ethnicity": "Hispanic", "primary_language": "Spanish", "free_lunch": true, "cultural_background": "Mexican American"}', '{"accommodations": ["bilingual support"]}'),
('550e8400-e29b-41d4-a716-446655440004', 'MC004', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Diana', 'Williams', '7', '2011-09-12', '{"ethnicity": "African American", "primary_language": "English", "free_lunch": false, "cultural_background": "African American"}', '{}'),
('550e8400-e29b-41d4-a716-446655440005', 'MC005', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Emma', 'Anderson', '7', '2011-05-30', '{"ethnicity": "White", "primary_language": "English", "free_lunch": false, "cultural_background": "European American"}', '{"accommodations": ["504 plan for ADHD"]}'),
('550e8400-e29b-41d4-a716-446655440006', 'MC006', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Fatima', 'Al-Hassan', '7', '2011-11-03', '{"ethnicity": "Middle Eastern", "primary_language": "Arabic", "free_lunch": true, "cultural_background": "Syrian American"}', '{"accommodations": ["ESL support", "cultural sensitivity"]}'),
('550e8400-e29b-41d4-a716-446655440007', 'MC007', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Gabriel', 'Thompson', '7', '2011-04-18', '{"ethnicity": "Mixed Race", "primary_language": "English", "free_lunch": false, "cultural_background": "Mixed (African American/White)"}', '{}'),
('550e8400-e29b-41d4-a716-446655440008', 'MC008', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Hannah', 'Kim', '7', '2011-08-07', '{"ethnicity": "Asian", "primary_language": "Korean", "free_lunch": false, "cultural_background": "Korean American"}', '{"accommodations": ["gifted program"]}'),
('550e8400-e29b-41d4-a716-446655440009', 'MC009', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Isaiah', 'Martinez', '7', '2011-02-25', '{"ethnicity": "Hispanic", "primary_language": "English", "free_lunch": true, "cultural_background": "Puerto Rican"}', '{}'),
('550e8400-e29b-41d4-a716-446655440010', 'MC010', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Jasmine', 'Patel', '7', '2011-06-14', '{"ethnicity": "Asian", "primary_language": "Hindi", "free_lunch": false, "cultural_background": "Indian American"}', '{}'),

-- Additional students for different classes
('550e8400-e29b-41d4-a716-446655440011', 'MC011', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Kevin', 'Brown', '8', '2010-03-20', '{"ethnicity": "African American", "primary_language": "English", "free_lunch": true}', '{}'),
('550e8400-e29b-41d4-a716-446655440012', 'MC012', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Luna', 'Garcia', '8', '2010-07-11', '{"ethnicity": "Hispanic", "primary_language": "Spanish", "free_lunch": true}', '{}'),
('550e8400-e29b-41d4-a716-446655440013', 'MC013', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Marcus', 'Davis', '8', '2010-01-17', '{"ethnicity": "African American", "primary_language": "English", "free_lunch": false}', '{}'),
('550e8400-e29b-41d4-a716-446655440014', 'MC014', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Nora', 'Wilson', '8', '2010-09-05', '{"ethnicity": "White", "primary_language": "English", "free_lunch": false}', '{}'),
('550e8400-e29b-41d4-a716-446655440015', 'MC015', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Omar', 'Ali', '8', '2010-04-28', '{"ethnicity": "Middle Eastern", "primary_language": "Arabic", "free_lunch": true}', '{"accommodations": ["ESL support"]}')
ON CONFLICT (district_id, student_identifier) DO NOTHING;

-- Insert mock classrooms using existing teacher IDs
INSERT INTO core.classrooms (classroom_id, teacher_id, school_id, classroom_name, subject, grade_level, academic_year, semester, class_period, room_number, max_capacity) VALUES
('550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM core.schools LIMIT 1), '7th Grade Mathematics - Period 3', 'Mathematics', '7', '2024-25', 'Fall', '3', '201', 28),
('550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM core.schools LIMIT 1), '7th Grade Mathematics - Period 5', 'Mathematics', '7', '2024-25', 'Fall', '5', '201', 25),
('550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM core.schools LIMIT 1), '8th Grade Science - Period 2', 'Science', '8', '2024-25', 'Fall', '2', '305', 30),
('550e8400-e29b-41d4-a716-446655441004', '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM core.schools LIMIT 1), '7th Grade English Language Arts - Period 1', 'English Language Arts', '7', '2024-25', 'Fall', '1', '102', 26),
('550e8400-e29b-41d4-a716-446655441005', '550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM core.schools LIMIT 1), '8th Grade Social Studies - Period 4', 'Social Studies', '8', '2024-25', 'Fall', '4', '210', 28)
ON CONFLICT DO NOTHING;

-- Insert classroom enrollments
INSERT INTO core.classroom_enrollments (enrollment_id, classroom_id, student_id, enrollment_date, enrollment_status) VALUES
-- Sarah Chen's 7th Grade Math - Period 3
('550e8400-e29b-41d4-a716-446655442001', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440001', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442002', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440002', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442003', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440003', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442004', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440004', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442005', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440005', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442006', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440006', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442007', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440007', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442008', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440008', '2024-08-26', 'active'),

-- Additional enrollments for other classes
('550e8400-e29b-41d4-a716-446655442009', '550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440011', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442010', '550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440012', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442011', '550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440013', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442012', '550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440014', '2024-08-26', 'active'),
('550e8400-e29b-41d4-a716-446655442013', '550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440015', '2024-08-26', 'active')
ON CONFLICT DO NOTHING;

-- Insert student academic records with varied performance
INSERT INTO core.student_academic_records (record_id, student_id, classroom_id, academic_year, semester, current_grade, grade_percentage, participation_grade, recorded_date) VALUES
-- Sarah Chen's Math Class - showing diverse performance levels
('550e8400-e29b-41d4-a716-446655443001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441001', '2024-25', 'Fall', 'B', 85.5, 'A', '2024-11-15'),
('550e8400-e29b-41d4-a716-446655443002', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655441001', '2024-25', 'Fall', 'A', 94.2, 'B', '2024-11-15'),
('550e8400-e29b-41d4-a716-446655443003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655441001', '2024-25', 'Fall', 'C', 73.8, 'B', '2024-11-15'),
('550e8400-e29b-41d4-a716-446655443004', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441001', '2024-25', 'Fall', 'A', 91.7, 'A', '2024-11-15'),
('550e8400-e29b-41d4-a716-446655443005', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655441001', '2024-25', 'Fall', 'B', 82.3, 'A', '2024-11-15'),
('550e8400-e29b-41d4-a716-446655443006', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655441001', '2024-25', 'Fall', 'C', 76.1, 'C', '2024-11-15'),
('550e8400-e29b-41d4-a716-446655443007', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655441001', '2024-25', 'Fall', 'B', 88.9, 'A', '2024-11-15'),
('550e8400-e29b-41d4-a716-446655443008', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655441001', '2024-25', 'Fall', 'A', 96.5, 'A', '2024-11-15')
ON CONFLICT DO NOTHING;

-- Insert attendance records (past 30 days)
INSERT INTO core.student_attendance (attendance_id, student_id, classroom_id, attendance_date, status, minutes_present, total_minutes) 
SELECT 
    gen_random_uuid(),
    s.student_id,
    ce.classroom_id,
    d.attendance_date,
    CASE 
        WHEN random() < 0.92 THEN 'present'
        WHEN random() < 0.05 THEN 'tardy'
        ELSE 'absent'
    END,
    CASE 
        WHEN random() < 0.92 THEN 50
        WHEN random() < 0.05 THEN 35
        ELSE 0
    END,
    50
FROM 
    core.students s
    JOIN core.classroom_enrollments ce ON s.student_id = ce.student_id
    CROSS JOIN (
        SELECT CURRENT_DATE - generate_series(1, 30) as attendance_date
    ) d
WHERE ce.enrollment_status = 'active'
ON CONFLICT DO NOTHING;

-- Insert behavioral records (mix of positive and negative)
INSERT INTO core.student_behavior_records (behavior_id, student_id, classroom_id, recorded_by, incident_date, behavior_type, behavior_category, behavior_description, severity_level) VALUES
-- Positive behaviors
('550e8400-e29b-41d4-a716-446655444001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', '2024-11-10', 'positive', 'leadership', 'Helped classmate understand difficult concept', 1),
('550e8400-e29b-41d4-a716-446655444002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', '2024-11-08', 'positive', 'participation', 'Excellent contribution to class discussion', 1),
('550e8400-e29b-41d4-a716-446655444003', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', '2024-11-05', 'positive', 'cooperation', 'Outstanding teamwork during group project', 1),

-- Minor negative behaviors requiring intervention
('550e8400-e29b-41d4-a716-446655444004', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', '2024-11-12', 'negative', 'disruption', 'Talking during instruction', 2),
('550e8400-e29b-41d4-a716-446655444005', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', '2024-11-07', 'intervention', 'engagement', 'Provided additional support for participation', 1)
ON CONFLICT DO NOTHING;

-- Insert survey infrastructure
INSERT INTO surveys (survey_id, title, description, survey_type, target_audience, start_date, end_date, status, estimated_duration, is_anonymous) VALUES
('550e8400-e29b-41d4-a716-446655445001', 'CIQ Teacher Experience Assessment - Fall 2024', 'Assessment of teacher confidence, satisfaction, and perception of student engagement', 'teacher_experience', 'teachers', '2024-09-01', '2025-06-30', 'active', 15, false),
('550e8400-e29b-41d4-a716-446655445002', 'CIQ Student Learning Experience Survey - Fall 2024', 'Assessment of student well-being, belonging, and learning effectiveness', 'student_experience', 'students', '2024-09-01', '2025-06-30', 'active', 12, true)
ON CONFLICT DO NOTHING;

-- Insert survey questions for teacher experience
INSERT INTO survey_questions (question_id, survey_id, question_text, question_type, question_order, is_required, likert_scale_type, min_value, max_value, scale_labels) VALUES
-- Teacher Experience Questions
('550e8400-e29b-41d4-a716-446655446001', '550e8400-e29b-41d4-a716-446655445001', 'How confident do you feel in your instructional delivery?', 'likert_scale', 1, true, 'confidence', 1, 5, '{"1": "Not confident", "2": "Slightly confident", "3": "Moderately confident", "4": "Very confident", "5": "Extremely confident"}'),
('550e8400-e29b-41d4-a716-446655446002', '550e8400-e29b-41d4-a716-446655445001', 'How satisfied are you with your current job?', 'likert_scale', 2, true, 'satisfaction', 1, 5, '{"1": "Very dissatisfied", "2": "Dissatisfied", "3": "Neutral", "4": "Satisfied", "5": "Very satisfied"}'),
('550e8400-e29b-41d4-a716-446655446003', '550e8400-e29b-41d4-a716-446655445001', 'How would you rate your students\' overall engagement in your classroom?', 'likert_scale', 3, true, 'effectiveness', 1, 5, '{"1": "Very low", "2": "Low", "3": "Moderate", "4": "High", "5": "Very high"}'),
('550e8400-e29b-41d4-a716-446655446004', '550e8400-e29b-41d4-a716-446655445001', 'How stressed do you feel in your teaching role?', 'likert_scale', 4, true, 'frequency', 1, 5, '{"1": "Never", "2": "Rarely", "3": "Sometimes", "4": "Often", "5": "Always"}'),

-- Student Experience Questions
('550e8400-e29b-41d4-a716-446655446005', '550e8400-e29b-41d4-a716-446655445002', 'How do you feel emotionally in this class?', 'likert_scale', 1, true, 'satisfaction', 1, 5, '{"1": "Very negative", "2": "Negative", "3": "Neutral", "4": "Positive", "5": "Very positive"}'),
('550e8400-e29b-41d4-a716-446655446006', '550e8400-e29b-41d4-a716-446655445002', 'Do you feel like you belong in this classroom?', 'likert_scale', 2, true, 'agreement', 1, 5, '{"1": "Strongly disagree", "2": "Disagree", "3": "Neutral", "4": "Agree", "5": "Strongly agree"}'),
('550e8400-e29b-41d4-a716-446655446007', '550e8400-e29b-41d4-a716-446655445002', 'How effective is the teaching in helping you learn?', 'likert_scale', 3, true, 'effectiveness', 1, 5, '{"1": "Not effective", "2": "Slightly effective", "3": "Moderately effective", "4": "Very effective", "5": "Extremely effective"}'),
('550e8400-e29b-41d4-a716-446655446008', '550e8400-e29b-41d4-a716-446655445002', 'Do you feel comfortable sharing your voice and ideas in class?', 'likert_scale', 4, true, 'agreement', 1, 5, '{"1": "Strongly disagree", "2": "Disagree", "3": "Neutral", "4": "Agree", "5": "Strongly agree"}')
ON CONFLICT DO NOTHING;

-- Insert survey assignments
INSERT INTO survey_assignments (assignment_id, survey_id, assigned_to_user_id, classroom_id, assigned_date, due_date) VALUES
-- Teacher survey assignments
('550e8400-e29b-41d4-a716-446655447001', '550e8400-e29b-41d4-a716-446655445001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655441001', '2024-09-01', '2024-12-31'),
('550e8400-e29b-41d4-a716-446655447002', '550e8400-e29b-41d4-a716-446655445001', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655441003', '2024-09-01', '2024-12-31'),
('550e8400-e29b-41d4-a716-446655447003', '550e8400-e29b-41d4-a716-446655445001', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655441004', '2024-09-01', '2024-12-31'),

-- Student survey assignments (classroom-based)
('550e8400-e29b-41d4-a716-446655447004', '550e8400-e29b-41d4-a716-446655445002', NULL, '550e8400-e29b-41d4-a716-446655441001', '2024-09-01', '2024-12-31'),
('550e8400-e29b-41d4-a716-446655447005', '550e8400-e29b-41d4-a716-446655445002', NULL, '550e8400-e29b-41d4-a716-446655441003', '2024-09-01', '2024-12-31')
ON CONFLICT DO NOTHING;

-- Insert survey responses with realistic data
INSERT INTO survey_responses (response_id, survey_id, assignment_id, respondent_user_id, respondent_role, status, start_time, completion_time, completion_percentage, responses) VALUES
-- Teacher responses
('550e8400-e29b-41d4-a716-446655448001', '550e8400-e29b-41d4-a716-446655445001', '550e8400-e29b-41d4-a716-446655447001', '550e8400-e29b-41d4-a716-446655440021', 'teacher', 'completed', '2024-11-01 09:00:00', '2024-11-01 09:15:00', 100.00, '{"550e8400-e29b-41d4-a716-446655446001": 4, "550e8400-e29b-41d4-a716-446655446002": 4, "550e8400-e29b-41d4-a716-446655446003": 3, "550e8400-e29b-41d4-a716-446655446004": 3}'),
('550e8400-e29b-41d4-a716-446655448002', '550e8400-e29b-41d4-a716-446655445001', '550e8400-e29b-41d4-a716-446655447002', '550e8400-e29b-41d4-a716-446655440022', 'teacher', 'completed', '2024-11-02 14:30:00', '2024-11-02 14:45:00', 100.00, '{"550e8400-e29b-41d4-a716-446655446001": 5, "550e8400-e29b-41d4-a716-446655446002": 5, "550e8400-e29b-41d4-a716-446655446003": 4, "550e8400-e29b-41d4-a716-446655446004": 2}')
ON CONFLICT DO NOTHING;

-- Insert corresponding question responses
INSERT INTO question_responses (question_response_id, response_id, question_id, numeric_response) VALUES
-- Sarah Chen's responses
('550e8400-e29b-41d4-a716-446655449001', '550e8400-e29b-41d4-a716-446655448001', '550e8400-e29b-41d4-a716-446655446001', 4),
('550e8400-e29b-41d4-a716-446655449002', '550e8400-e29b-41d4-a716-446655448001', '550e8400-e29b-41d4-a716-446655446002', 4),
('550e8400-e29b-41d4-a716-446655449003', '550e8400-e29b-41d4-a716-446655448001', '550e8400-e29b-41d4-a716-446655446003', 3),
('550e8400-e29b-41d4-a716-446655449004', '550e8400-e29b-41d4-a716-446655448001', '550e8400-e29b-41d4-a716-446655446004', 3),

-- Michael Rodriguez's responses
('550e8400-e29b-41d4-a716-446655449005', '550e8400-e29b-41d4-a716-446655448002', '550e8400-e29b-41d4-a716-446655446001', 5),
('550e8400-e29b-41d4-a716-446655449006', '550e8400-e29b-41d4-a716-446655448002', '550e8400-e29b-41d4-a716-446655446002', 5),
('550e8400-e29b-41d4-a716-446655449007', '550e8400-e29b-41d4-a716-446655448002', '550e8400-e29b-41d4-a716-446655446003', 4),
('550e8400-e29b-41d4-a716-446655449008', '550e8400-e29b-41d4-a716-446655448002', '550e8400-e29b-41d4-a716-446655446004', 2)
ON CONFLICT DO NOTHING;

-- Insert SIS/LMS integration configurations
INSERT INTO external_system_integrations (integration_id, district_id, system_name, system_vendor, integration_type, status, sync_frequency) VALUES
('550e8400-e29b-41d4-a716-446655450001', '550e8400-e29b-41d4-a716-446655440001', 'PowerSchool SIS', 'PowerSchool', 'sis', 'active', 'daily'),
('550e8400-e29b-41d4-a716-446655450002', '550e8400-e29b-41d4-a716-446655440001', 'Canvas LMS', 'Instructure', 'lms', 'active', 'hourly'),
('550e8400-e29b-41d4-a716-446655450003', '550e8400-e29b-41d4-a716-446655440001', 'PowerTeacher Gradebook', 'PowerSchool', 'gradebook', 'active', 'daily')
ON CONFLICT DO NOTHING;

-- Insert sample gradebook data
INSERT INTO gradebook_integration_data (gradebook_entry_id, integration_id, external_gradebook_id, student_id, classroom_id, assignment_name, assignment_type, points_earned, points_possible, percentage_score, assignment_date) VALUES
('550e8400-e29b-41d4-a716-446655451001', '550e8400-e29b-41d4-a716-446655450003', 'GRAD001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441001', 'Chapter 5 Quiz - Fractions', 'quiz', 18, 20, 90.0, '2024-11-08'),
('550e8400-e29b-41d4-a716-446655451002', '550e8400-e29b-41d4-a716-446655450003', 'GRAD002', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655441001', 'Chapter 5 Quiz - Fractions', 'quiz', 19, 20, 95.0, '2024-11-08'),
('550e8400-e29b-41d4-a716-446655451003', '550e8400-e29b-41d4-a716-446655450003', 'GRAD003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655441001', 'Chapter 5 Quiz - Fractions', 'quiz', 14, 20, 70.0, '2024-11-08'),
('550e8400-e29b-41d4-a716-446655451004', '550e8400-e29b-41d4-a716-446655450003', 'GRAD004', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655441001', 'Problem Solving Project', 'project', 85, 100, 85.0, '2024-11-15')
ON CONFLICT DO NOTHING;

-- Insert adaptive weighting configurations
INSERT INTO analytics.ciq_adaptive_weights (weight_config_id, classroom_id, teacher_id, sis_lms_weight, survey_weight, eci_blueprint_weight, equity_component_weight, creativity_component_weight, innovation_component_weight) VALUES
-- Sarah Chen's math class - standard weighting
('550e8400-e29b-41d4-a716-446655452001', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', 0.500, 0.200, 0.300, 0.333, 0.333, 0.334),
-- Michael Rodriguez's science class - emphasis on innovation
('550e8400-e29b-41d4-a716-446655452002', '550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440022', 0.500, 0.200, 0.300, 0.300, 0.300, 0.400),
-- Other teachers with varied approaches
('550e8400-e29b-41d4-a716-446655452003', '550e8400-e29b-41d4-a716-446655441004', '550e8400-e29b-41d4-a716-446655440023', 0.500, 0.200, 0.300, 0.400, 0.350, 0.250),
('550e8400-e29b-41d4-a716-446655452004', '550e8400-e29b-41d4-a716-446655441005', '550e8400-e29b-41d4-a716-446655440024', 0.500, 0.200, 0.300, 0.350, 0.300, 0.350)
ON CONFLICT DO NOTHING;

-- Insert detailed ECI component scores for recent sessions
INSERT INTO analytics.eci_component_scores (
    component_score_id, session_id, classroom_id, teacher_id, calculation_date,
    e1_identity_recognition, e2_psychological_safety, e3_access_equity, e4_voice_elevation, e5_collaboration,
    c6_self_expression, c7_experimentation, c8_active_learning, c9_skill_development, c10_imagination,
    i11_possibility_mindset, i12_real_world_connections, i13_change_making, i14_impact_assessment, i15_continuous_improvement,
    analyzer_confidence, transcript_quality_score, llm_model_version
) VALUES
-- Session 1 - High performing session
('550e8400-e29b-41d4-a716-446655453001', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', '2024-11-15',
 8.2, 7.8, 8.0, 7.5, 8.5, 7.2, 7.8, 8.1, 7.6, 6.9, 7.8, 8.2, 7.0, 7.4, 7.7, 0.87, 8.9, 'claude-3.5-sonnet'),

-- Session 2 - Moderate performing session  
('550e8400-e29b-41d4-a716-446655453002', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', '2024-11-14',
 6.8, 7.2, 6.5, 6.8, 7.1, 6.5, 6.2, 7.0, 6.8, 6.1, 6.7, 7.1, 6.2, 6.5, 6.8, 0.82, 8.3, 'claude-3.5-sonnet'),

-- Session 3 - Lower performing session with opportunities
('550e8400-e29b-41d4-a716-446655453003', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440021', '2024-11-13',
 5.8, 6.2, 5.9, 5.5, 6.0, 5.2, 5.8, 6.1, 5.7, 5.0, 5.9, 6.2, 5.1, 5.4, 5.8, 0.78, 7.8, 'claude-3.5-sonnet'),

-- Science class sessions
('550e8400-e29b-41d4-a716-446655453004', '550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440022', '2024-11-15',
 7.5, 8.1, 7.8, 8.2, 7.9, 8.5, 8.8, 8.3, 8.0, 8.7, 8.9, 9.1, 8.2, 8.5, 8.6, 0.91, 9.2, 'claude-3.5-sonnet'),

-- English class session
('550e8400-e29b-41d4-a716-446655453005', '550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655441004', '550e8400-e29b-41d4-a716-446655440023', '2024-11-15',
 8.8, 8.5, 8.2, 9.1, 8.7, 9.2, 8.0, 7.8, 8.5, 9.5, 7.8, 8.1, 7.5, 8.0, 8.2, 0.89, 9.0, 'claude-3.5-sonnet')
ON CONFLICT DO NOTHING;

-- Update existing analytics.ciq_metrics table with enhanced data for these sessions
UPDATE analytics.ciq_metrics SET
    eci_detailed_scores = jsonb_build_object(
        'equity', jsonb_build_object('e1', 8.2, 'e2', 7.8, 'e3', 8.0, 'e4', 7.5, 'e5', 8.5),
        'creativity', jsonb_build_object('c6', 7.2, 'c7', 7.8, 'c8', 8.1, 'c9', 7.6, 'c10', 6.9),
        'innovation', jsonb_build_object('i11', 7.8, 'i12', 8.2, 'i13', 7.0, 'i14', 7.4, 'i15', 7.7)
    ),
    adaptive_weights = jsonb_build_object('sis_lms', 0.5, 'survey', 0.2, 'eci_blueprint', 0.3),
    data_source_weights = jsonb_build_object('academic', 0.15, 'attendance', 0.05, 'behavior', 0.10, 'participation', 0.20),
    quality_indicators = jsonb_build_object('transcript_quality', 0.89, 'analysis_confidence', 0.87, 'data_completeness', 0.95)
WHERE session_id = '550e8400-e29b-41d4-a716-446655440031';

-- Log success message
SELECT 'CIQ Framework mock data seeded successfully!' as message,
       (SELECT COUNT(*) FROM students) as students_created,
       (SELECT COUNT(*) FROM classrooms) as classrooms_created,
       (SELECT COUNT(*) FROM classroom_enrollments) as enrollments_created,
       (SELECT COUNT(*) FROM surveys) as surveys_created,
       (SELECT COUNT(*) FROM analytics.eci_component_scores) as eci_scores_created;