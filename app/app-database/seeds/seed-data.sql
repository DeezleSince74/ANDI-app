-- ANDI Database Seed Data
-- This file contains sample data for development and testing

-- Insert test districts
INSERT INTO core.districts (id, name, state, contact_email) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Montgomery County Public Schools', 'MD', 'contact@mcps.edu'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Prince George County Public Schools', 'MD', 'info@pgcps.edu'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Baltimore City Public Schools', 'MD', 'admin@bcps.edu')
ON CONFLICT (id) DO NOTHING;

-- Insert test schools
INSERT INTO core.schools (id, name, district_id, school_type, address, phone, contact_email) VALUES
    ('550e8400-e29b-41d4-a716-446655440004', 'Lincoln Elementary School', '550e8400-e29b-41d4-a716-446655440001', 'public', '123 Main St, Rockville, MD 20850', '301-555-0001', 'lincoln@mcps.edu'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Washington Middle School', '550e8400-e29b-41d4-a716-446655440001', 'public', '456 Oak Ave, Bethesda, MD 20814', '301-555-0002', 'washington@mcps.edu'),
    ('550e8400-e29b-41d4-a716-446655440006', 'Roosevelt High School', '550e8400-e29b-41d4-a716-446655440002', 'public', '789 Pine St, College Park, MD 20740', '301-555-0003', 'roosevelt@pgcps.edu'),
    ('550e8400-e29b-41d4-a716-446655440007', 'Jefferson Charter School', NULL, 'charter', '321 Elm St, Baltimore, MD 21201', '410-555-0004', 'jefferson@charter.edu')
ON CONFLICT (id) DO NOTHING;

-- Insert test users
INSERT INTO auth.users (id, email, password_hash, full_name, role, is_active, email_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440008', 'sarah.johnson@mcps.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVYNJnQNnUOHHlKi', 'Sarah Johnson', 'teacher', true, true),
    ('550e8400-e29b-41d4-a716-446655440009', 'michael.chen@mcps.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVYNJnQNnUOHHlKi', 'Michael Chen', 'teacher', true, true),
    ('550e8400-e29b-41d4-a716-446655440010', 'emily.rodriguez@pgcps.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVYNJnQNnUOHHlKi', 'Emily Rodriguez', 'teacher', true, true),
    ('550e8400-e29b-41d4-a716-446655440011', 'david.thompson@mcps.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVYNJnQNnUOHHlKi', 'David Thompson', 'coach', true, true),
    ('550e8400-e29b-41d4-a716-446655440012', 'admin@andi.ai', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVYNJnQNnUOHHlKi', 'ANDI Administrator', 'admin', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert teacher profiles
INSERT INTO core.teacher_profiles (user_id, school_id, grades_taught, subjects_taught, years_experience, teaching_styles, personal_interests, strengths, onboarding_completed) VALUES
    ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 
     ARRAY['3', '4', '5'], ARRAY['Mathematics', 'Science'], 8, 
     ARRAY['collaborative', 'inquiry-based'], ARRAY['technology', 'gardening'], 
     ARRAY['classroom management', 'differentiated instruction'], true),
    ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', 
     ARRAY['6', '7', '8'], ARRAY['English Language Arts', 'Social Studies'], 5, 
     ARRAY['project-based', 'socratic'], ARRAY['reading', 'travel'], 
     ARRAY['student engagement', 'curriculum design'], true),
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 
     ARRAY['9', '10', '11', '12'], ARRAY['Biology', 'Chemistry'], 12, 
     ARRAY['hands-on', 'flipped-classroom'], ARRAY['research', 'hiking'], 
     ARRAY['laboratory instruction', 'mentoring'], true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert coach profile
INSERT INTO core.coach_profiles (user_id, school_id, district_id, specializations, years_coaching) VALUES
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 
     ARRAY['instructional design', 'classroom management', 'equity practices'], 6)
ON CONFLICT (user_id) DO NOTHING;

-- Insert coach-teacher assignments
INSERT INTO core.coach_teacher_assignments (coach_id, teacher_id, is_active, notes) VALUES
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440008', true, 'Focus on equity and innovation practices'),
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440009', true, 'Working on classroom engagement strategies')
ON CONFLICT (coach_id, teacher_id) DO NOTHING;

-- Insert sample teacher goals
INSERT INTO core.teacher_goals (teacher_id, category, title, description, status, target_date, progress_percentage) VALUES
    ('550e8400-e29b-41d4-a716-446655440008', 'equity', 'Improve Student Voice in Math Discussions', 'Increase the percentage of students who actively participate in math discussions', 'active', '2024-06-01', 35),
    ('550e8400-e29b-41d4-a716-446655440008', 'innovation', 'Integrate Technology in Science Lessons', 'Use digital tools to enhance hands-on science experiments', 'active', '2024-08-15', 60),
    ('550e8400-e29b-41d4-a716-446655440009', 'creativity', 'Develop Creative Writing Workshop', 'Implement weekly creative writing sessions with peer feedback', 'active', '2024-05-30', 80)
ON CONFLICT DO NOTHING;

-- Insert sample achievements
INSERT INTO gamification.achievements (id, name, description, achievement_type, criteria, points_value, progress_total) VALUES
    ('550e8400-e29b-41d4-a716-446655440013', 'First Recording', 'Complete your first classroom recording', 'milestone', '{"sessions": 1}', 10, 1),
    ('550e8400-e29b-41d4-a716-446655440014', 'Weekly Warrior', 'Record 5 sessions in one week', 'consistency', '{"sessions_per_week": 5}', 25, 5),
    ('550e8400-e29b-41d4-a716-446655440015', 'Community Contributor', 'Answer 10 questions in Teacher Lounge', 'community', '{"forum_answers": 10}', 50, 10),
    ('550e8400-e29b-41d4-a716-446655440016', 'Equity Champion', 'Achieve 85+ equity score for 3 consecutive sessions', 'practice_prodigy', '{"consecutive_equity_85": 3}', 100, 3)
ON CONFLICT (id) DO NOTHING;

-- Insert sample trivia questions
INSERT INTO gamification.trivia_questions (question_text, answer_options, correct_answer_index, explanation, category, difficulty) VALUES
    ('What is the optimal wait time after asking a question to allow students to think?', 
     ARRAY['1-2 seconds', '3-5 seconds', '6-10 seconds', '11-15 seconds'], 
     1, 'Research shows that 3-5 seconds of wait time significantly increases student participation and response quality.',
     'wait_time', 'medium'),
    ('Which questioning technique is most effective for promoting higher-order thinking?', 
     ARRAY['Yes/No questions', 'Multiple choice questions', 'Open-ended questions', 'Fill-in-the-blank questions'], 
     2, 'Open-ended questions require students to analyze, synthesize, and evaluate information.',
     'teaching_techniques', 'easy'),
    ('What percentage of class time should ideally be student talk versus teacher talk?', 
     ARRAY['20% student, 80% teacher', '50% student, 50% teacher', '70% student, 30% teacher', '90% student, 10% teacher'], 
     2, 'Research suggests that 70% student talk and 30% teacher talk leads to better learning outcomes.',
     'student_engagement', 'hard')
ON CONFLICT DO NOTHING;

-- Insert sample forum questions
INSERT INTO community.forum_questions (author_id, title, content, tags, status) VALUES
    ('550e8400-e29b-41d4-a716-446655440008', 'How to engage reluctant math students?', 
     'I have several students who seem disengaged during math lessons. What strategies have worked for you to get them more involved?',
     ARRAY['engagement', 'mathematics', 'motivation'], 'unanswered'),
    ('550e8400-e29b-41d4-a716-446655440009', 'Best practices for parent communication?', 
     'Looking for effective ways to communicate with parents about student progress. What tools or methods do you recommend?',
     ARRAY['parent_communication', 'progress_reporting'], 'unanswered'),
    ('550e8400-e29b-41d4-a716-446655440010', 'Laboratory safety in high school chemistry', 
     'What are your must-have safety protocols for chemistry labs? Any horror stories or close calls to share?',
     ARRAY['laboratory', 'safety', 'chemistry', 'high_school'], 'unanswered')
ON CONFLICT DO NOTHING;

-- Insert sample resources
INSERT INTO core.resources (title, description, resource_url, source, resource_type, category, tags, grade_levels, subjects, is_featured) VALUES
    ('Equity in Mathematics Education', 'Research-based strategies for creating equitable math classrooms', 'https://example.com/equity-math', 'NCTM', 'article', 'diversity_inclusion', 
     ARRAY['equity', 'mathematics', 'inclusive_teaching'], ARRAY['K-12'], ARRAY['Mathematics'], true),
    ('Student Voice and Choice in Learning', 'Video series on empowering students through voice and choice', 'https://example.com/student-voice', 'Edutopia', 'video', 'student_engagement', 
     ARRAY['student_voice', 'engagement', 'choice'], ARRAY['6-12'], ARRAY['All Subjects'], false),
    ('Classroom Management Toolkit', 'Comprehensive guide to positive classroom management strategies', 'https://example.com/classroom-management', 'Teaching Tolerance', 'tool', 'all', 
     ARRAY['classroom_management', 'behavior', 'positive_discipline'], ARRAY['K-12'], ARRAY['All Subjects'], true)
ON CONFLICT DO NOTHING;

-- Insert sample classroom activities
INSERT INTO core.classroom_activities (title, description, instructions, category, grade_levels, subjects, duration_minutes, difficulty, created_by, is_featured) VALUES
    ('Think-Pair-Share Plus', 'Enhanced version of think-pair-share with reflection component', 
     'Students think individually (2 min), pair up to discuss (3 min), then share with class and reflect on learning (5 min)', 
     'engagement', ARRAY['6-12'], ARRAY['All Subjects'], 10, 'beginner', '550e8400-e29b-41d4-a716-446655440008', true),
    ('Gallery Walk Carousel', 'Students rotate through stations to build understanding', 
     'Set up 4-6 stations with different questions/problems. Students rotate every 5 minutes, building on previous responses', 
     'collaboration', ARRAY['3-12'], ARRAY['All Subjects'], 30, 'intermediate', '550e8400-e29b-41d4-a716-446655440009', false),
    ('Scientific Method Mystery', 'Students use scientific method to solve classroom mystery', 
     'Present a classroom mystery (e.g., missing item). Students form hypotheses, design experiments, collect data, and draw conclusions', 
     'creativity', ARRAY['6-12'], ARRAY['Science'], 45, 'advanced', '550e8400-e29b-41d4-a716-446655440010', true)
ON CONFLICT DO NOTHING;

-- Sample notifications
INSERT INTO core.notifications (user_id, type, title, message, data) VALUES
    ('550e8400-e29b-41d4-a716-446655440008', 'achievement_unlocked', 'Welcome to ANDI!', 'You have unlocked your first achievement for completing your profile.', '{"achievement_id": "550e8400-e29b-41d4-a716-446655440013"}'),
    ('550e8400-e29b-41d4-a716-446655440009', 'recommendation_ready', 'New Recommendations Available', 'We have generated 3 new teaching recommendations based on your latest session.', '{"session_id": "example-session-id"}'),
    ('550e8400-e29b-41d4-a716-446655440010', 'forum_answer', 'Your Question Has Been Answered', 'Someone has answered your question about laboratory safety protocols.', '{"question_id": "example-question-id"}')
ON CONFLICT DO NOTHING;

-- Grant user achievements
INSERT INTO gamification.user_achievements (user_id, achievement_id, progress_current, progress_total, is_completed, completed_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440013', 1, 1, true, CURRENT_TIMESTAMP),
    ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440013', 1, 1, true, CURRENT_TIMESTAMP),
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440013', 1, 1, true, CURRENT_TIMESTAMP),
    ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440014', 3, 5, false, NULL)
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- Update statistics
UPDATE core.resources SET views_count = floor(random() * 500) + 50, likes_count = floor(random() * 100) + 10;
UPDATE core.classroom_activities SET likes_count = floor(random() * 50) + 5;
UPDATE community.forum_questions SET upvotes_count = floor(random() * 20) + 1;

RAISE NOTICE 'Sample data inserted successfully!';