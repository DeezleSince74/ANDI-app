-- Migration v1.2.0: Add Student Management System for CIQ Framework
-- Description: Creates student, classroom enrollment, and academic tracking tables to support CIQ SIS/LMS integration (50% weight)

-- Check if migration has been applied
DO $$
BEGIN
    IF NOT migration_applied('v1.2.0') THEN
        
        RAISE NOTICE 'Applying migration v1.2.0: Student Management System';
        
        -- Set schema to core
        SET search_path TO core, public;
        
        -- Create students table
        CREATE TABLE IF NOT EXISTS core.students (
            student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_identifier VARCHAR(100) NOT NULL, -- External SIS ID or student number
            district_id UUID REFERENCES core.districts(id) ON DELETE CASCADE,
            school_id UUID REFERENCES core.schools(id) ON DELETE CASCADE,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            grade_level VARCHAR(10) NOT NULL,
            date_of_birth DATE,
            enrollment_date DATE DEFAULT CURRENT_DATE,
            graduation_date DATE,
            is_active BOOLEAN DEFAULT true,
            demographic_data JSONB DEFAULT '{}', -- Stores cultural, linguistic, socioeconomic data
            special_needs JSONB DEFAULT '{}', -- IEP, 504 plans, accommodations
            emergency_contact JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_student_identifier_per_district UNIQUE(district_id, student_identifier)
        );
        
        -- Create index for efficient lookups
        CREATE INDEX IF NOT EXISTS idx_students_district_school ON students(district_id, school_id);
        CREATE INDEX IF NOT EXISTS idx_students_grade_active ON students(grade_level, is_active);
        CREATE INDEX IF NOT EXISTS idx_students_identifier ON students(student_identifier);
        
        -- Create classrooms table to define specific class sections
        CREATE TABLE IF NOT EXISTS core.classrooms (
            classroom_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID REFERENCES core.teacher_profiles(user_id) ON DELETE CASCADE,
            school_id UUID REFERENCES core.schools(id) ON DELETE CASCADE,
            classroom_name VARCHAR(200) NOT NULL, -- e.g., "Math 101 - Period 3", "5th Grade Science"
            subject VARCHAR(100) NOT NULL,
            grade_level VARCHAR(10) NOT NULL,
            academic_year VARCHAR(10) NOT NULL, -- e.g., "2024-25"
            semester VARCHAR(20), -- e.g., "Fall", "Spring", "Full Year"
            class_period VARCHAR(10), -- e.g., "1", "3", "A"
            room_number VARCHAR(20),
            max_capacity INTEGER DEFAULT 30,
            class_schedule JSONB DEFAULT '{}', -- Meeting times, days of week
            curriculum_standards JSONB DEFAULT '{}', -- Learning objectives, standards
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_teacher_classroom_period UNIQUE(teacher_id, academic_year, semester, class_period)
        );
        
        -- Create index for classroom lookups
        CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_classrooms_school_year ON classrooms(school_id, academic_year);
        CREATE INDEX IF NOT EXISTS idx_classrooms_subject_grade ON classrooms(subject, grade_level);
        
        -- Create classroom enrollments junction table
        CREATE TABLE IF NOT EXISTS core.classroom_enrollments (
            enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            classroom_id UUID REFERENCES core.classrooms(classroom_id) ON DELETE CASCADE,
            student_id UUID REFERENCES core.students(student_id) ON DELETE CASCADE,
            enrollment_date DATE DEFAULT CURRENT_DATE,
            withdrawal_date DATE,
            enrollment_status VARCHAR(20) DEFAULT 'active', -- active, withdrawn, transferred
            seat_number INTEGER,
            special_accommodations JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_active_enrollment UNIQUE(classroom_id, student_id, enrollment_status),
            CONSTRAINT valid_enrollment_status CHECK (enrollment_status IN ('active', 'withdrawn', 'transferred', 'completed'))
        );
        
        -- Create indexes for enrollment queries
        CREATE INDEX IF NOT EXISTS idx_enrollments_classroom ON classroom_enrollments(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_enrollments_student ON classroom_enrollments(student_id);
        CREATE INDEX IF NOT EXISTS idx_enrollments_status ON classroom_enrollments(enrollment_status);
        
        -- Create student academic records table
        CREATE TABLE IF NOT EXISTS core.student_academic_records (
            record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID REFERENCES core.students(student_id) ON DELETE CASCADE,
            classroom_id UUID REFERENCES core.classrooms(classroom_id) ON DELETE CASCADE,
            academic_year VARCHAR(10) NOT NULL,
            semester VARCHAR(20),
            
            -- Academic Performance Metrics (15% of CIQ weight)
            current_grade VARCHAR(5), -- A, B, C, D, F, or numeric
            grade_percentage DECIMAL(5,2), -- 0.00 to 100.00
            assignment_scores JSONB DEFAULT '{}', -- Individual assignment tracking
            test_scores JSONB DEFAULT '{}', -- Standardized and classroom assessments
            project_scores JSONB DEFAULT '{}', -- Project-based learning outcomes
            participation_grade VARCHAR(5),
            effort_grade VARCHAR(5),
            
            -- Progress Metrics
            learning_objectives_met JSONB DEFAULT '{}', -- Standards mastery tracking
            skill_assessments JSONB DEFAULT '{}', -- Specific skill evaluations
            growth_measurements JSONB DEFAULT '{}', -- Progress over time
            
            -- Notes and Comments
            teacher_comments TEXT,
            parent_comments TEXT,
            student_reflection TEXT,
            
            recorded_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_student_classroom_semester UNIQUE(student_id, classroom_id, academic_year, semester)
        );
        
        -- Create indexes for academic record queries
        CREATE INDEX IF NOT EXISTS idx_academic_records_student ON student_academic_records(student_id);
        CREATE INDEX IF NOT EXISTS idx_academic_records_classroom ON student_academic_records(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_academic_records_year_semester ON student_academic_records(academic_year, semester);
        
        -- Create attendance tracking table
        CREATE TABLE IF NOT EXISTS core.student_attendance (
            attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID REFERENCES core.students(student_id) ON DELETE CASCADE,
            classroom_id UUID REFERENCES core.classrooms(classroom_id) ON DELETE CASCADE,
            attendance_date DATE NOT NULL,
            
            -- Attendance Data (5% of CIQ weight)
            status VARCHAR(20) NOT NULL, -- present, absent, tardy, excused, unexcused
            arrival_time TIME,
            departure_time TIME,
            minutes_present INTEGER DEFAULT 0,
            total_minutes INTEGER DEFAULT 0, -- Total class time
            
            -- Additional Context
            reason VARCHAR(200), -- Reason for absence/tardiness
            parent_notified BOOLEAN DEFAULT false,
            makeup_work_assigned BOOLEAN DEFAULT false,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_student_classroom_date UNIQUE(student_id, classroom_id, attendance_date),
            CONSTRAINT valid_attendance_status CHECK (status IN ('present', 'absent', 'tardy', 'excused', 'unexcused'))
        );
        
        -- Create indexes for attendance queries
        CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON student_attendance(student_id, attendance_date);
        CREATE INDEX IF NOT EXISTS idx_attendance_classroom_date ON student_attendance(classroom_id, attendance_date);
        CREATE INDEX IF NOT EXISTS idx_attendance_status ON student_attendance(status);
        
        -- Create behavioral tracking table
        CREATE TABLE IF NOT EXISTS core.student_behavior_records (
            behavior_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID REFERENCES core.students(student_id) ON DELETE CASCADE,
            classroom_id UUID REFERENCES core.classrooms(classroom_id) ON DELETE CASCADE,
            recorded_by UUID REFERENCES auth.users(id), -- Teacher or staff member
            incident_date DATE NOT NULL,
            incident_time TIME,
            
            -- SEL/Behavioral Data (10% of CIQ weight)
            behavior_type VARCHAR(50) NOT NULL, -- positive, negative, intervention
            behavior_category VARCHAR(100), -- participation, disruption, leadership, cooperation
            behavior_description TEXT NOT NULL,
            severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5), -- 1=minor, 5=severe
            
            -- Context and Response
            classroom_context TEXT, -- What was happening when incident occurred
            antecedent TEXT, -- What happened before the behavior
            consequence TEXT, -- What happened after/response
            intervention_used VARCHAR(200),
            
            -- Follow-up
            parent_contacted BOOLEAN DEFAULT false,
            follow_up_required BOOLEAN DEFAULT false,
            follow_up_date DATE,
            resolution_notes TEXT,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT valid_behavior_type CHECK (behavior_type IN ('positive', 'negative', 'intervention', 'observation'))
        );
        
        -- Create indexes for behavior tracking
        CREATE INDEX IF NOT EXISTS idx_behavior_student ON student_behavior_records(student_id);
        CREATE INDEX IF NOT EXISTS idx_behavior_classroom ON student_behavior_records(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_behavior_date ON student_behavior_records(incident_date);
        CREATE INDEX IF NOT EXISTS idx_behavior_type ON student_behavior_records(behavior_type);
        
        -- Add to core schema
        SET search_path TO core;
        
        -- Update audit triggers would be added here if the function exists
        
        -- Grant appropriate permissions (skip if roles don't exist)
        -- GRANT statements would go here for production roles
        
        -- Record migration as applied
        PERFORM public.record_migration('v1.2.0', 'Added student management system for CIQ framework SIS/LMS integration');
        
        RAISE NOTICE 'Migration v1.2.0 applied successfully - Student management system created';
        
    ELSE
        RAISE NOTICE 'Migration v1.2.0 already applied, skipping';
    END IF;
END $$;