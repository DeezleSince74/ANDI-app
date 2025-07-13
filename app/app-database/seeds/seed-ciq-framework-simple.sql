-- ANDI CIQ Framework Simple Mock Data
-- Description: Essential seed data for testing the CIQ framework

-- Set search path
SET search_path TO core, public;

-- Insert a few mock students using existing district and school
DO $$
DECLARE
    district_id_var UUID;
    school_id_var UUID;
    teacher_id_var UUID;
    classroom_id_var UUID;
BEGIN
    -- Get existing IDs
    SELECT id INTO district_id_var FROM core.districts LIMIT 1;
    SELECT id INTO school_id_var FROM core.schools LIMIT 1;
    SELECT user_id INTO teacher_id_var FROM core.teacher_profiles LIMIT 1;
    
    -- Insert students
    INSERT INTO core.students (student_id, student_identifier, district_id, school_id, first_name, last_name, grade_level, date_of_birth, demographic_data, special_needs) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'STU001', district_id_var, school_id_var, 'Aaliyah', 'Johnson', '7', '2011-03-15', '{"ethnicity": "African American", "primary_language": "English", "free_lunch": true}', '{}'),
    ('550e8400-e29b-41d4-a716-446655440002', 'STU002', district_id_var, school_id_var, 'Benjamin', 'Chen', '7', '2011-07-22', '{"ethnicity": "Asian", "primary_language": "Mandarin", "free_lunch": false}', '{"accommodations": ["ESL support"]}'),
    ('550e8400-e29b-41d4-a716-446655440003', 'STU003', district_id_var, school_id_var, 'Carlos', 'Rodriguez', '7', '2011-01-08', '{"ethnicity": "Hispanic", "primary_language": "Spanish", "free_lunch": true}', '{"accommodations": ["bilingual support"]}'),
    ('550e8400-e29b-41d4-a716-446655440004', 'STU004', district_id_var, school_id_var, 'Diana', 'Williams', '7', '2011-09-12', '{"ethnicity": "African American", "primary_language": "English", "free_lunch": false}', '{}'),
    ('550e8400-e29b-41d4-a716-446655440005', 'STU005', district_id_var, school_id_var, 'Emma', 'Anderson', '7', '2011-05-30', '{"ethnicity": "White", "primary_language": "English", "free_lunch": false}', '{"accommodations": ["504 plan for ADHD"]}')
    ON CONFLICT (district_id, student_identifier) DO NOTHING;
    
    -- Insert classroom
    INSERT INTO core.classrooms (classroom_id, teacher_id, school_id, classroom_name, subject, grade_level, academic_year, semester, class_period, room_number, max_capacity) VALUES
    ('550e8400-e29b-41d4-a716-446655441001', teacher_id_var, school_id_var, '7th Grade Mathematics - Period 3', 'Mathematics', '7', '2024-25', 'Fall', '3', '201', 28)
    ON CONFLICT DO NOTHING;
    
    classroom_id_var := '550e8400-e29b-41d4-a716-446655441001';
    
    -- Insert classroom enrollments
    INSERT INTO core.classroom_enrollments (enrollment_id, classroom_id, student_id, enrollment_date, enrollment_status) VALUES
    ('550e8400-e29b-41d4-a716-446655442001', classroom_id_var, '550e8400-e29b-41d4-a716-446655440001', '2024-08-26', 'active'),
    ('550e8400-e29b-41d4-a716-446655442002', classroom_id_var, '550e8400-e29b-41d4-a716-446655440002', '2024-08-26', 'active'),
    ('550e8400-e29b-41d4-a716-446655442003', classroom_id_var, '550e8400-e29b-41d4-a716-446655440003', '2024-08-26', 'active'),
    ('550e8400-e29b-41d4-a716-446655442004', classroom_id_var, '550e8400-e29b-41d4-a716-446655440004', '2024-08-26', 'active'),
    ('550e8400-e29b-41d4-a716-446655442005', classroom_id_var, '550e8400-e29b-41d4-a716-446655440005', '2024-08-26', 'active')
    ON CONFLICT DO NOTHING;
    
    -- Insert academic records
    INSERT INTO core.student_academic_records (record_id, student_id, classroom_id, academic_year, semester, current_grade, grade_percentage, participation_grade, recorded_date) VALUES
    ('550e8400-e29b-41d4-a716-446655443001', '550e8400-e29b-41d4-a716-446655440001', classroom_id_var, '2024-25', 'Fall', 'B', 85.5, 'A', '2024-11-15'),
    ('550e8400-e29b-41d4-a716-446655443002', '550e8400-e29b-41d4-a716-446655440002', classroom_id_var, '2024-25', 'Fall', 'A', 94.2, 'B', '2024-11-15'),
    ('550e8400-e29b-41d4-a716-446655443003', '550e8400-e29b-41d4-a716-446655440003', classroom_id_var, '2024-25', 'Fall', 'C', 73.8, 'B', '2024-11-15'),
    ('550e8400-e29b-41d4-a716-446655443004', '550e8400-e29b-41d4-a716-446655440004', classroom_id_var, '2024-25', 'Fall', 'A', 91.7, 'A', '2024-11-15'),
    ('550e8400-e29b-41d4-a716-446655443005', '550e8400-e29b-41d4-a716-446655440005', classroom_id_var, '2024-25', 'Fall', 'B', 82.3, 'A', '2024-11-15')
    ON CONFLICT DO NOTHING;
    
    -- Insert simple survey
    INSERT INTO surveys (survey_id, title, description, survey_type, target_audience, start_date, end_date, status, estimated_duration, is_anonymous) VALUES
    ('550e8400-e29b-41d4-a716-446655445001', 'Teacher Experience Survey', 'Basic teacher experience assessment', 'teacher_experience', 'teachers', '2024-09-01', '2025-06-30', 'active', 10, false)
    ON CONFLICT DO NOTHING;
    
    -- Insert survey questions
    INSERT INTO survey_questions (question_id, survey_id, question_text, question_type, question_order, is_required, likert_scale_type, min_value, max_value, scale_labels) VALUES
    ('550e8400-e29b-41d4-a716-446655446001', '550e8400-e29b-41d4-a716-446655445001', 'How confident do you feel in your instructional delivery?', 'likert_scale', 1, true, 'confidence', 1, 5, '{"1": "Not confident", "5": "Very confident"}'),
    ('550e8400-e29b-41d4-a716-446655446002', '550e8400-e29b-41d4-a716-446655445001', 'How satisfied are you with your current job?', 'likert_scale', 2, true, 'satisfaction', 1, 5, '{"1": "Very dissatisfied", "5": "Very satisfied"}')
    ON CONFLICT DO NOTHING;
    
    -- Insert adaptive weights
    INSERT INTO analytics.ciq_adaptive_weights (weight_config_id, classroom_id, teacher_id, sis_lms_weight, survey_weight, eci_blueprint_weight) VALUES
    ('550e8400-e29b-41d4-a716-446655452001', classroom_id_var, teacher_id_var, 0.500, 0.200, 0.300)
    ON CONFLICT DO NOTHING;
    
    -- Insert ECI component scores
    INSERT INTO analytics.eci_component_scores (
        component_score_id, session_id, classroom_id, teacher_id, calculation_date,
        e1_identity_recognition, e2_psychological_safety, e3_access_equity, e4_voice_elevation, e5_collaboration,
        c6_self_expression, c7_experimentation, c8_active_learning, c9_skill_development, c10_imagination,
        i11_possibility_mindset, i12_real_world_connections, i13_change_making, i14_impact_assessment, i15_continuous_improvement,
        analyzer_confidence, transcript_quality_score
    ) 
    SELECT 
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440031',
        classroom_id_var,
        teacher_id_var,
        CURRENT_DATE,
        8.2, 7.8, 8.0, 7.5, 8.5,
        7.2, 7.8, 8.1, 7.6, 6.9,
        7.8, 8.2, 7.0, 7.4, 7.7,
        0.87, 8.9
    WHERE EXISTS (SELECT 1 FROM core.audio_sessions WHERE id = '550e8400-e29b-41d4-a716-446655440031')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'CIQ Framework seed data inserted successfully!';
END $$;