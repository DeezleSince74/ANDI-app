-- Migration v1.2.1: Add Survey Infrastructure for CIQ Framework
-- Description: Creates survey system to collect teacher experience and student experience data (20% weight in CIQ)

-- Check if migration has been applied
DO $$
BEGIN
    IF NOT migration_applied('v1.2.1') THEN
        
        RAISE NOTICE 'Applying migration v1.2.1: Survey Infrastructure System';
        
        -- Set schema to core
        SET search_path TO core, public;
        
        -- Create survey types enum
        CREATE TYPE survey_type AS ENUM ('teacher_experience', 'student_experience', 'parent_feedback', 'peer_observation', 'administrative_review');
        CREATE TYPE question_type AS ENUM ('likert_scale', 'multiple_choice', 'open_text', 'rating', 'yes_no', 'ranking');
        CREATE TYPE survey_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
        CREATE TYPE response_status AS ENUM ('not_started', 'in_progress', 'completed', 'expired');
        
        -- Create surveys table
        CREATE TABLE IF NOT EXISTS surveys (
            survey_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(200) NOT NULL,
            description TEXT,
            survey_type survey_type NOT NULL,
            
            -- Survey Configuration
            target_audience VARCHAR(50) NOT NULL, -- teachers, students, parents, all
            grade_levels VARCHAR[] DEFAULT '{}', -- Filter by grade levels
            subjects VARCHAR[] DEFAULT '{}', -- Filter by subjects
            school_ids UUID[] DEFAULT '{}', -- Filter by schools
            district_ids UUID[] DEFAULT '{}', -- Filter by districts
            
            -- Scheduling
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            reminder_frequency INTEGER DEFAULT 7, -- Days between reminders
            max_reminders INTEGER DEFAULT 3,
            
            -- Survey Metadata
            estimated_duration INTEGER DEFAULT 10, -- Minutes
            is_anonymous BOOLEAN DEFAULT true,
            is_mandatory BOOLEAN DEFAULT false,
            allow_partial_responses BOOLEAN DEFAULT true,
            
            -- Survey Status
            status survey_status DEFAULT 'draft',
            created_by UUID REFERENCES auth.users(id),
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for surveys
        CREATE INDEX IF NOT EXISTS idx_surveys_type ON surveys(survey_type);
        CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
        CREATE INDEX IF NOT EXISTS idx_surveys_dates ON surveys(start_date, end_date);
        CREATE INDEX IF NOT EXISTS idx_surveys_audience ON surveys(target_audience);
        
        -- Create survey questions table
        CREATE TABLE IF NOT EXISTS survey_questions (
            question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            survey_id UUID REFERENCES surveys(survey_id) ON DELETE CASCADE,
            question_text TEXT NOT NULL,
            question_type question_type NOT NULL,
            
            -- Question Configuration
            question_order INTEGER NOT NULL,
            is_required BOOLEAN DEFAULT false,
            section_title VARCHAR(200), -- Optional grouping
            
            -- Question-specific settings
            options JSONB DEFAULT '{}', -- For multiple choice, rating scales, etc.
            validation_rules JSONB DEFAULT '{}', -- Min/max values, patterns, etc.
            conditional_logic JSONB DEFAULT '{}', -- Show/hide based on other answers
            
            -- Likert Scale Configuration (for teacher/student experience)
            likert_scale_type VARCHAR(20), -- satisfaction, agreement, frequency, effectiveness
            min_value INTEGER DEFAULT 1,
            max_value INTEGER DEFAULT 5,
            scale_labels JSONB DEFAULT '{}', -- {1: "Strongly Disagree", 5: "Strongly Agree"}
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_question_order UNIQUE(survey_id, question_order)
        );
        
        -- Create indexes for survey questions
        CREATE INDEX IF NOT EXISTS idx_questions_survey ON survey_questions(survey_id);
        CREATE INDEX IF NOT EXISTS idx_questions_order ON survey_questions(survey_id, question_order);
        CREATE INDEX IF NOT EXISTS idx_questions_type ON survey_questions(question_type);
        
        -- Create survey assignments table (who should take which surveys)
        CREATE TABLE IF NOT EXISTS survey_assignments (
            assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            survey_id UUID REFERENCES surveys(survey_id) ON DELETE CASCADE,
            
            -- Assignment Target
            assigned_to_user_id UUID REFERENCES auth.users(id), -- Specific user assignment
            assigned_to_role VARCHAR(50), -- Role-based assignment: teacher, student, parent
            classroom_id UUID REFERENCES core.classrooms(classroom_id), -- Classroom-specific
            school_id UUID REFERENCES core.schools(id), -- School-specific
            district_id UUID REFERENCES core.districts(id), -- District-wide
            
            -- Assignment Status
            assigned_date DATE DEFAULT CURRENT_DATE,
            due_date DATE,
            reminders_sent INTEGER DEFAULT 0,
            last_reminder_date DATE,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for survey assignments
        CREATE INDEX IF NOT EXISTS idx_assignments_survey ON survey_assignments(survey_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_user ON survey_assignments(assigned_to_user_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_role ON survey_assignments(assigned_to_role);
        CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON survey_assignments(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON survey_assignments(due_date);
        
        -- Create survey responses table
        CREATE TABLE IF NOT EXISTS survey_responses (
            response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            survey_id UUID REFERENCES surveys(survey_id) ON DELETE CASCADE,
            assignment_id UUID REFERENCES survey_assignments(assignment_id) ON DELETE CASCADE,
            
            -- Respondent Information
            respondent_user_id UUID REFERENCES auth.users(id), -- If not anonymous
            respondent_role VARCHAR(50), -- teacher, student, parent, admin
            respondent_metadata JSONB DEFAULT '{}', -- Grade level, subject, years experience, etc.
            
            -- Response Status
            status response_status DEFAULT 'not_started',
            start_time TIMESTAMP WITH TIME ZONE,
            completion_time TIMESTAMP WITH TIME ZONE,
            time_spent_minutes INTEGER,
            
            -- Response Data
            responses JSONB DEFAULT '{}', -- {question_id: answer_value}
            completion_percentage DECIMAL(5,2) DEFAULT 0.00,
            
            -- Context
            session_context JSONB DEFAULT '{}', -- Device, browser, location if relevant
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for survey responses
        CREATE INDEX IF NOT EXISTS idx_responses_survey ON survey_responses(survey_id);
        CREATE INDEX IF NOT EXISTS idx_responses_assignment ON survey_responses(assignment_id);
        CREATE INDEX IF NOT EXISTS idx_responses_user ON survey_responses(respondent_user_id);
        CREATE INDEX IF NOT EXISTS idx_responses_status ON survey_responses(status);
        CREATE INDEX IF NOT EXISTS idx_responses_completion ON survey_responses(completion_time);
        
        -- Create individual question responses table (for easier analytics)
        CREATE TABLE IF NOT EXISTS question_responses (
            question_response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            response_id UUID REFERENCES survey_responses(response_id) ON DELETE CASCADE,
            question_id UUID REFERENCES survey_questions(question_id) ON DELETE CASCADE,
            
            -- Response Values
            text_response TEXT,
            numeric_response DECIMAL(10,2),
            boolean_response BOOLEAN,
            json_response JSONB, -- For complex responses like rankings
            
            -- Response Metadata
            response_time_seconds INTEGER, -- Time spent on this question
            revision_count INTEGER DEFAULT 0, -- How many times answer was changed
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_response_question UNIQUE(response_id, question_id)
        );
        
        -- Create indexes for question responses
        CREATE INDEX IF NOT EXISTS idx_question_responses_response ON question_responses(response_id);
        CREATE INDEX IF NOT EXISTS idx_question_responses_question ON question_responses(question_id);
        CREATE INDEX IF NOT EXISTS idx_question_responses_numeric ON question_responses(numeric_response);
        
        -- Create teacher experience survey template data
        INSERT INTO surveys (survey_id, title, description, survey_type, target_audience, start_date, end_date, status, estimated_duration)
        VALUES (
            gen_random_uuid(),
            'Teacher Experience Assessment - CIQ Framework',
            'Survey to assess teacher confidence, job satisfaction, and perception of student engagement for CIQ calculations',
            'teacher_experience',
            'teachers',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '365 days',
            'draft',
            15
        ) ON CONFLICT DO NOTHING;
        
        -- Create student experience survey template data
        INSERT INTO surveys (survey_id, title, description, survey_type, target_audience, start_date, end_date, status, estimated_duration)
        VALUES (
            gen_random_uuid(),
            'Student Learning Experience Survey - CIQ Framework',
            'Survey to assess student emotional well-being, sense of belonging, and perceived learning effectiveness for CIQ calculations',
            'student_experience',
            'students',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '365 days',
            'draft',
            12
        ) ON CONFLICT DO NOTHING;
        
        -- Create survey analytics view for CIQ calculation
        CREATE OR REPLACE VIEW survey_analytics_for_ciq AS
        SELECT 
            sr.survey_id,
            s.survey_type,
            sr.respondent_role,
            sr.respondent_metadata,
            COUNT(*) as total_responses,
            AVG(sr.completion_percentage) as avg_completion_rate,
            
            -- Teacher Experience Metrics (10% of CIQ weight)
            AVG(CASE WHEN qr.question_id IN (
                SELECT question_id FROM survey_questions 
                WHERE question_text ILIKE '%confidence%instructional%'
            ) THEN qr.numeric_response END) as teacher_confidence_avg,
            
            AVG(CASE WHEN qr.question_id IN (
                SELECT question_id FROM survey_questions 
                WHERE question_text ILIKE '%job satisfaction%' OR question_text ILIKE '%stress%'
            ) THEN qr.numeric_response END) as teacher_satisfaction_avg,
            
            AVG(CASE WHEN qr.question_id IN (
                SELECT question_id FROM survey_questions 
                WHERE question_text ILIKE '%student engagement%'
            ) THEN qr.numeric_response END) as perceived_engagement_avg,
            
            -- Student Experience Metrics (10% of CIQ weight)
            AVG(CASE WHEN qr.question_id IN (
                SELECT question_id FROM survey_questions 
                WHERE question_text ILIKE '%emotional%well%being%'
            ) THEN qr.numeric_response END) as student_wellbeing_avg,
            
            AVG(CASE WHEN qr.question_id IN (
                SELECT question_id FROM survey_questions 
                WHERE question_text ILIKE '%belonging%' OR question_text ILIKE '%voice%'
            ) THEN qr.numeric_response END) as student_belonging_avg,
            
            AVG(CASE WHEN qr.question_id IN (
                SELECT question_id FROM survey_questions 
                WHERE question_text ILIKE '%learning effectiveness%'
            ) THEN qr.numeric_response END) as learning_effectiveness_avg,
            
            MIN(sr.completion_time) as first_response_date,
            MAX(sr.completion_time) as latest_response_date
            
        FROM survey_responses sr
        JOIN surveys s ON sr.survey_id = s.survey_id
        JOIN question_responses qr ON sr.response_id = qr.response_id
        WHERE sr.status = 'completed'
        GROUP BY sr.survey_id, s.survey_type, sr.respondent_role, sr.respondent_metadata;
        
        -- Update audit triggers would be added here if the function exists
        
        -- Grant appropriate permissions (skip if roles don't exist)
        -- GRANT statements would go here for production roles
        
        -- Record migration as applied
        PERFORM public.record_migration('v1.2.1', 'Added survey infrastructure for CIQ framework teacher and student experience data collection');
        
        RAISE NOTICE 'Migration v1.2.1 applied successfully - Survey infrastructure created';
        
    ELSE
        RAISE NOTICE 'Migration v1.2.1 already applied, skipping';
    END IF;
END $$;