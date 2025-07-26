-- Onboarding Content Tables and Data

-- Create onboarding_content table to store configurable content for each screen
CREATE TABLE IF NOT EXISTS core.onboarding_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screen_name VARCHAR(50) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'option', 'instruction', 'label', 'placeholder'
    content_key VARCHAR(100) NOT NULL,
    content_value TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(screen_name, content_type, content_key)
);

-- Create onboarding_progress table to track user progress
CREATE TABLE IF NOT EXISTS core.onboarding_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER[] DEFAULT '{}',
    step_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create onboarding_goals table to store goal options for screen 8
CREATE TABLE IF NOT EXISTS core.onboarding_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(20) NOT NULL CHECK (category IN ('equity', 'creativity', 'innovation')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert grade level options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order) VALUES
    ('grade_levels', 'option', 'pre-k', 'Pre-K', 1),
    ('grade_levels', 'option', 'kindergarten', 'Kindergarten', 2),
    ('grade_levels', 'option', '1st', '1st Grade', 3),
    ('grade_levels', 'option', '2nd', '2nd Grade', 4),
    ('grade_levels', 'option', '3rd', '3rd Grade', 5),
    ('grade_levels', 'option', '4th', '4th Grade', 6),
    ('grade_levels', 'option', '5th', '5th Grade', 7),
    ('grade_levels', 'option', '6th', '6th Grade', 8),
    ('grade_levels', 'option', '7th', '7th Grade', 9),
    ('grade_levels', 'option', '8th', '8th Grade', 10),
    ('grade_levels', 'option', '9th', '9th Grade', 11),
    ('grade_levels', 'option', '10th', '10th Grade', 12),
    ('grade_levels', 'option', '11th', '11th Grade', 13),
    ('grade_levels', 'option', '12th', '12th Grade', 14),
    ('grade_levels', 'option', 'college', 'College/University', 15),
    ('grade_levels', 'option', 'other', 'Other', 16)
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order;

-- Insert subject options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order, metadata) VALUES
    ('subjects_taught', 'option', 'language_arts', 'Language Arts/English', 1, '{"category": "core"}'),
    ('subjects_taught', 'option', 'mathematics', 'Mathematics', 2, '{"category": "core"}'),
    ('subjects_taught', 'option', 'science', 'Science', 3, '{"category": "core"}'),
    ('subjects_taught', 'option', 'social_studies', 'Social Studies & History', 4, '{"category": "core"}'),
    ('subjects_taught', 'option', 'foreign_languages', 'Foreign Languages', 5, '{"category": "specialized"}'),
    ('subjects_taught', 'option', 'fine_arts', 'Fine Arts/Music/Drama', 6, '{"category": "specialized"}'),
    ('subjects_taught', 'option', 'physical_education', 'Physical Education & Health', 7, '{"category": "specialized"}'),
    ('subjects_taught', 'option', 'career_technical', 'Career & Technical Education', 8, '{"category": "technical"}'),
    ('subjects_taught', 'option', 'stem_electives', 'STEM Electives', 9, '{"category": "technical"}'),
    ('subjects_taught', 'option', 'media_communication', 'Media and Communication', 10, '{"category": "technical"}'),
    ('subjects_taught', 'option', 'honors_ap', 'Honors & Advanced Placement', 11, '{"category": "advanced"}'),
    ('subjects_taught', 'option', 'ib_program', 'International Baccalaureate Program', 12, '{"category": "advanced"}')
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order, metadata = EXCLUDED.metadata;

-- Insert teaching style options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order, metadata) VALUES
    ('teaching_styles', 'option', 'lunchtime_mentor', 'Lunchtime Mentor', 1, '{"description": "Creates safe, welcoming space where students feel valued"}'),
    ('teaching_styles', 'option', 'high_energy_entertainer', 'High-Energy Entertainer', 2, '{"description": "Transforms lessons into exciting experiences"}'),
    ('teaching_styles', 'option', 'life_coach', 'Life Coach', 3, '{"description": "Inspires students to see potential and tackle challenges"}'),
    ('teaching_styles', 'option', 'chill_teacher', 'Chill Teacher', 4, '{"description": "Keeps classroom calm and focused with laid-back approach"}')
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order, metadata = EXCLUDED.metadata;

-- Insert personal interest options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order) VALUES
    ('personal_interests', 'option', 'outdoor_activities', 'Outdoor Activities', 1),
    ('personal_interests', 'option', 'sports', 'Sports', 2),
    ('personal_interests', 'option', 'traveling', 'Traveling', 3),
    ('personal_interests', 'option', 'reading', 'Reading', 4),
    ('personal_interests', 'option', 'writing', 'Writing', 5),
    ('personal_interests', 'option', 'cooking_baking', 'Cooking/Baking', 6),
    ('personal_interests', 'option', 'gardening', 'Gardening', 7),
    ('personal_interests', 'option', 'music', 'Music', 8),
    ('personal_interests', 'option', 'art_craft', 'Art and Craft', 9),
    ('personal_interests', 'option', 'photography', 'Photography', 10),
    ('personal_interests', 'option', 'yoga_meditation', 'Yoga/Meditation', 11),
    ('personal_interests', 'option', 'fitness_exercise', 'Fitness & Exercise', 12),
    ('personal_interests', 'option', 'movies_tv', 'Watching Movies/TV Shows', 13),
    ('personal_interests', 'option', 'gaming', 'Gaming', 14)
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order;

-- Insert teaching strength options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order) VALUES
    ('teaching_strengths', 'option', 'communication_skills', 'Communication Skills', 1),
    ('teaching_strengths', 'option', 'subject_expertise', 'Subject Matter Expertise', 2),
    ('teaching_strengths', 'option', 'adaptability', 'Adaptability', 3),
    ('teaching_strengths', 'option', 'problem_solving', 'Problem-Solving Skills', 4),
    ('teaching_strengths', 'option', 'cultural_competence', 'Cultural Competence', 5),
    ('teaching_strengths', 'option', 'classroom_management', 'Classroom Management', 6),
    ('teaching_strengths', 'option', 'lesson_planning', 'Effective Lesson Planning', 7),
    ('teaching_strengths', 'option', 'empathy_eq', 'Empathy and Emotional Intelligence', 8),
    ('teaching_strengths', 'option', 'collaboration', 'Collaboration and Teamwork', 9),
    ('teaching_strengths', 'option', 'patience', 'Patience and Perseverance', 10),
    ('teaching_strengths', 'option', 'creativity_innovation', 'Creativity and Innovation', 11)
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order;

-- Insert goal options for CIQ framework
INSERT INTO core.onboarding_goals (category, title, description, display_order) VALUES
    -- Equity goals
    ('equity', 'Increase Student Voice', 'Ensure all students have opportunities to share their thoughts and ideas', 1),
    ('equity', 'Create Inclusive Environment', 'Build a classroom where every student feels valued and respected', 2),
    ('equity', 'Address Learning Gaps', 'Identify and support students who need additional assistance', 3),
    ('equity', 'Foster Cultural Awareness', 'Celebrate diversity and integrate culturally responsive teaching', 4),
    
    -- Creativity goals
    ('creativity', 'Encourage Creative Expression', 'Provide opportunities for students to express themselves creatively', 5),
    ('creativity', 'Design Engaging Activities', 'Develop innovative lessons that spark curiosity and imagination', 6),
    ('creativity', 'Support Risk-Taking', 'Create safe spaces for students to experiment and learn from mistakes', 7),
    ('creativity', 'Integrate Arts & Projects', 'Incorporate creative projects and artistic elements into curriculum', 8),
    
    -- Innovation goals
    ('innovation', 'Connect to Real World', 'Help students see how learning applies to their lives and future', 9),
    ('innovation', 'Integrate Technology', 'Use digital tools to enhance learning experiences', 10),
    ('innovation', 'Promote Critical Thinking', 'Develop activities that challenge students to think deeply', 11),
    ('innovation', 'Encourage Problem-Solving', 'Guide students to find creative solutions to complex challenges', 12)
ON CONFLICT DO NOTHING;

-- Insert screen instructions and labels
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value) VALUES
    ('grade_levels', 'instruction', 'main', 'Which grade levels do you teach?'),
    ('grade_levels', 'instruction', 'subtitle', 'This helps us provide tools and resources suited to your students'' needs'),
    ('grade_levels', 'instruction', 'helper', 'Select all that apply'),
    
    ('teaching_experience', 'instruction', 'main', 'How many years have you been teaching?'),
    ('teaching_experience', 'instruction', 'subtitle', 'Your experience level helps us tailor our focus areas and strategies to your journey'),
    
    ('subjects_taught', 'instruction', 'main', 'What subjects do you teach?'),
    ('subjects_taught', 'instruction', 'subtitle', 'Let''s focus on the subjects that matter most to you and your students'),
    ('subjects_taught', 'instruction', 'helper', 'Select all that apply'),
    
    ('teaching_styles', 'instruction', 'main', 'How would you describe your teaching style?'),
    ('teaching_styles', 'instruction', 'subtitle', 'Understanding your approach helps us provide tailored recommendations'),
    ('teaching_styles', 'instruction', 'helper', 'Select up to 3'),
    
    ('personal_interests', 'instruction', 'main', 'What are your personal interests?'),
    ('personal_interests', 'instruction', 'subtitle', 'We''ll recommend activities and strategies that align with your passions and teaching style'),
    ('personal_interests', 'instruction', 'helper', 'Select all that apply'),
    
    ('teaching_strengths', 'instruction', 'main', 'What are your greatest strengths as a teacher?'),
    ('teaching_strengths', 'instruction', 'subtitle', 'This helps us suggest focus areas and personalized feedback for your growth'),
    ('teaching_strengths', 'instruction', 'helper', 'Select all that apply'),
    
    ('goal_setting', 'instruction', 'main', 'Let''s set your goals'),
    ('goal_setting', 'instruction', 'subtitle', 'Based on your responses, ANDI will help shape your personalized path using our CIQ framework'),
    ('goal_setting', 'instruction', 'helper', 'Select 4 goals total: one from Equity, one from Creativity, one from Innovation, and one additional goal of your choice'),
    
    ('voice_sample_intro', 'instruction', 'main', 'Voice Sample Recording'),
    ('voice_sample_intro', 'instruction', 'subtitle', 'Help ANDI understand your speaking style and tone. This allows us to differentiate your voice from your students during classroom recordings.'),
    ('voice_sample_intro', 'instruction', 'helper', 'This takes less than 2 minutes'),
    
    ('voice_sample_recording', 'instruction', 'main', 'Please read the following phrase:'),
    ('voice_sample_recording', 'instruction', 'phrase1', 'Good morning, class. Let''s get started with today''s lesson.'),
    ('voice_sample_recording', 'instruction', 'phrase2', 'Remember to raise your hand if you have any questions.'),
    ('voice_sample_recording', 'instruction', 'phrase3', 'Great job everyone! I''m proud of the work you''ve done today.')
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value;

-- Create indexes for onboarding tables
CREATE INDEX idx_onboarding_content_screen ON core.onboarding_content(screen_name);
CREATE INDEX idx_onboarding_content_active ON core.onboarding_content(is_active);
CREATE INDEX idx_onboarding_progress_user ON core.onboarding_progress(user_id);
CREATE INDEX idx_onboarding_goals_category ON core.onboarding_goals(category);
CREATE INDEX idx_onboarding_goals_active ON core.onboarding_goals(is_active);