-- Migration v1.2.2: Add SIS/LMS Integration Infrastructure for CIQ Framework
-- Description: Creates integration layer for external Student Information Systems and Learning Management Systems

-- Check if migration has been applied
DO $$
BEGIN
    IF NOT migration_applied('v1.2.2') THEN
        
        RAISE NOTICE 'Applying migration v1.2.2: SIS/LMS Integration Infrastructure';
        
        -- Set schema to core
        SET search_path TO core, public;
        
        -- Create integration types and statuses
        CREATE TYPE integration_type AS ENUM ('sis', 'lms', 'gradebook', 'attendance_system', 'assessment_platform');
        CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'pending', 'testing');
        CREATE TYPE sync_frequency AS ENUM ('real_time', 'hourly', 'daily', 'weekly', 'manual');
        CREATE TYPE data_sync_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'partial');
        
        -- Create SIS/LMS system configurations table
        CREATE TABLE IF NOT EXISTS external_system_integrations (
            integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            district_id UUID REFERENCES core.districts(id) ON DELETE CASCADE,
            school_id UUID REFERENCES core.schools(id), -- NULL for district-wide integrations
            
            -- System Information
            system_name VARCHAR(100) NOT NULL, -- e.g., "PowerSchool", "Canvas", "Google Classroom"
            system_vendor VARCHAR(100), -- e.g., "Pearson", "Instructure", "Google"
            integration_type integration_type NOT NULL,
            system_version VARCHAR(50),
            
            -- Connection Configuration
            base_url VARCHAR(500),
            api_endpoint VARCHAR(500),
            authentication_method VARCHAR(50), -- oauth2, api_key, basic_auth, etc.
            authentication_config JSONB DEFAULT '{}', -- Encrypted credentials and tokens
            
            -- Data Mapping Configuration
            field_mappings JSONB DEFAULT '{}', -- Maps external fields to our schema
            data_filters JSONB DEFAULT '{}', -- Filters for what data to sync
            transformation_rules JSONB DEFAULT '{}', -- Rules for data transformation
            
            -- Sync Configuration
            sync_frequency sync_frequency DEFAULT 'daily',
            sync_schedule VARCHAR(100), -- Cron expression or time specification
            last_successful_sync TIMESTAMP WITH TIME ZONE,
            next_scheduled_sync TIMESTAMP WITH TIME ZONE,
            
            -- Status and Monitoring
            status integration_status DEFAULT 'pending',
            error_count INTEGER DEFAULT 0,
            last_error_message TEXT,
            last_error_time TIMESTAMP WITH TIME ZONE,
            
            -- Metadata
            configured_by UUID REFERENCES auth.users(id),
            approved_by UUID REFERENCES auth.users(id),
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_system_per_district UNIQUE(district_id, system_name, integration_type)
        );
        
        -- Create indexes for integrations
        CREATE INDEX IF NOT EXISTS idx_integrations_district ON external_system_integrations(district_id);
        CREATE INDEX IF NOT EXISTS idx_integrations_type ON external_system_integrations(integration_type);
        CREATE INDEX IF NOT EXISTS idx_integrations_status ON external_system_integrations(status);
        CREATE INDEX IF NOT EXISTS idx_integrations_sync_schedule ON external_system_integrations(next_scheduled_sync);
        
        -- Create data synchronization logs table
        CREATE TABLE IF NOT EXISTS data_sync_logs (
            sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            integration_id UUID REFERENCES external_system_integrations(integration_id) ON DELETE CASCADE,
            
            -- Sync Operation Details
            sync_type VARCHAR(50) NOT NULL, -- full_sync, incremental, specific_table
            data_types VARCHAR[] DEFAULT '{}', -- students, grades, attendance, etc.
            sync_trigger VARCHAR(50), -- scheduled, manual, webhook, error_retry
            
            -- Sync Execution
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE,
            status data_sync_status DEFAULT 'pending',
            
            -- Sync Statistics
            records_attempted INTEGER DEFAULT 0,
            records_successful INTEGER DEFAULT 0,
            records_failed INTEGER DEFAULT 0,
            records_skipped INTEGER DEFAULT 0,
            
            -- Error Handling
            error_details JSONB DEFAULT '{}',
            warning_details JSONB DEFAULT '{}',
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            
            -- Performance Metrics
            execution_time_ms INTEGER,
            memory_usage_mb DECIMAL(10,2),
            api_calls_made INTEGER DEFAULT 0,
            
            -- Data Change Summary
            changes_summary JSONB DEFAULT '{}', -- Summary of what changed
            affected_tables VARCHAR[] DEFAULT '{}',
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for sync logs
        CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON data_sync_logs(integration_id);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON data_sync_logs(status);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_start_time ON data_sync_logs(start_time);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON data_sync_logs(sync_type);
        
        -- Create external data mappings table (for tracking source system IDs)
        CREATE TABLE IF NOT EXISTS external_data_mappings (
            mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            integration_id UUID REFERENCES external_system_integrations(integration_id) ON DELETE CASCADE,
            
            -- External System Reference
            external_id VARCHAR(200) NOT NULL, -- ID in the external system
            external_type VARCHAR(100) NOT NULL, -- student, teacher, class, grade, etc.
            external_metadata JSONB DEFAULT '{}', -- Additional data from external system
            
            -- Internal System Reference
            internal_id UUID NOT NULL, -- Our system's UUID
            internal_table VARCHAR(100) NOT NULL, -- Which table the UUID refers to
            
            -- Mapping Metadata
            first_mapped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_verified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            mapping_confidence DECIMAL(3,2) DEFAULT 1.00, -- 0.00 to 1.00
            is_active BOOLEAN DEFAULT true,
            
            -- Data Quality
            data_quality_score DECIMAL(3,2), -- 0.00 to 1.00
            quality_issues JSONB DEFAULT '{}',
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_external_mapping UNIQUE(integration_id, external_id, external_type),
            CONSTRAINT unique_internal_mapping UNIQUE(integration_id, internal_id, internal_table)
        );
        
        -- Create indexes for data mappings
        CREATE INDEX IF NOT EXISTS idx_mappings_integration ON external_data_mappings(integration_id);
        CREATE INDEX IF NOT EXISTS idx_mappings_external ON external_data_mappings(external_id, external_type);
        CREATE INDEX IF NOT EXISTS idx_mappings_internal ON external_data_mappings(internal_id, internal_table);
        CREATE INDEX IF NOT EXISTS idx_mappings_active ON external_data_mappings(is_active);
        
        -- Create grade book integration table (specific to academic performance)
        CREATE TABLE IF NOT EXISTS gradebook_integration_data (
            gradebook_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            integration_id UUID REFERENCES external_system_integrations(integration_id) ON DELETE CASCADE,
            external_gradebook_id VARCHAR(200) NOT NULL,
            
            -- Student and Class Reference
            student_id UUID REFERENCES core.students(student_id),
            classroom_id UUID REFERENCES core.classrooms(classroom_id),
            external_student_id VARCHAR(200),
            external_class_id VARCHAR(200),
            
            -- Assignment/Assessment Details
            assignment_name VARCHAR(300),
            assignment_type VARCHAR(100), -- homework, quiz, test, project, participation
            assignment_category VARCHAR(100), -- formative, summative, diagnostic
            assignment_date DATE,
            due_date DATE,
            
            -- Grade Information
            points_earned DECIMAL(10,2),
            points_possible DECIMAL(10,2),
            percentage_score DECIMAL(5,2),
            letter_grade VARCHAR(5),
            
            -- Standards and Learning Objectives
            learning_standards VARCHAR[] DEFAULT '{}',
            learning_objectives VARCHAR[] DEFAULT '{}',
            bloom_taxonomy_level VARCHAR(50),
            
            -- Additional Metadata
            teacher_comments TEXT,
            submission_status VARCHAR(50), -- submitted, late, missing, excused
            submission_date TIMESTAMP WITH TIME ZONE,
            
            -- Integration Metadata
            last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            sync_version INTEGER DEFAULT 1,
            external_last_modified TIMESTAMP WITH TIME ZONE,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_gradebook_entry UNIQUE(integration_id, external_gradebook_id)
        );
        
        -- Create indexes for gradebook data
        CREATE INDEX IF NOT EXISTS idx_gradebook_integration ON gradebook_integration_data(integration_id);
        CREATE INDEX IF NOT EXISTS idx_gradebook_student ON gradebook_integration_data(student_id);
        CREATE INDEX IF NOT EXISTS idx_gradebook_classroom ON gradebook_integration_data(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_gradebook_assignment_date ON gradebook_integration_data(assignment_date);
        CREATE INDEX IF NOT EXISTS idx_gradebook_sync ON gradebook_integration_data(last_synced);
        
        -- Create attendance integration table
        CREATE TABLE IF NOT EXISTS attendance_integration_data (
            attendance_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            integration_id UUID REFERENCES external_system_integrations(integration_id) ON DELETE CASCADE,
            external_attendance_id VARCHAR(200) NOT NULL,
            
            -- Student and Class Reference
            student_id UUID REFERENCES core.students(student_id),
            classroom_id UUID REFERENCES core.classrooms(classroom_id),
            external_student_id VARCHAR(200),
            external_class_id VARCHAR(200),
            
            -- Attendance Details
            attendance_date DATE NOT NULL,
            period_name VARCHAR(50), -- Period 1, Homeroom, etc.
            status VARCHAR(20) NOT NULL,
            arrival_time TIME,
            departure_time TIME,
            
            -- Additional Context
            reason_code VARCHAR(20),
            reason_description TEXT,
            parent_verification BOOLEAN DEFAULT false,
            office_verification BOOLEAN DEFAULT false,
            
            -- Integration Metadata
            last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            sync_version INTEGER DEFAULT 1,
            external_last_modified TIMESTAMP WITH TIME ZONE,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_attendance_entry UNIQUE(integration_id, external_attendance_id)
        );
        
        -- Create indexes for attendance data
        CREATE INDEX IF NOT EXISTS idx_attendance_integration ON attendance_integration_data(integration_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_integration_data(student_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_classroom ON attendance_integration_data(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_integration_data(attendance_date);
        
        -- Create view for CIQ SIS/LMS data aggregation
        CREATE OR REPLACE VIEW ciq_sis_lms_metrics AS
        SELECT 
            c.classroom_id,
            c.teacher_id,
            c.academic_year,
            c.semester,
            COUNT(DISTINCT ce.student_id) as total_students,
            
            -- Academic Data (15% of CIQ weight)
            AVG(sar.grade_percentage) as avg_class_grade,
            AVG(gid.percentage_score) as avg_gradebook_score,
            COUNT(gid.gradebook_entry_id) as total_assignments,
            
            -- Attendance Data (5% of CIQ weight)
            AVG(CASE WHEN sa.status = 'present' THEN 1.0 ELSE 0.0 END) as attendance_rate,
            AVG(CASE WHEN aid.status = 'present' THEN 1.0 ELSE 0.0 END) as integrated_attendance_rate,
            COUNT(sa.attendance_id) as total_attendance_records,
            
            -- SEL/Behavioral Data (10% of CIQ weight - calculated separately)
            COUNT(sbr.behavior_id) as total_behavior_records,
            AVG(CASE WHEN sbr.behavior_type = 'positive' THEN 1.0 ELSE 0.0 END) as positive_behavior_ratio,
            
            -- Participation Metrics (20% of CIQ weight - from audio analysis)
            -- These come from the existing analytics.ciq_metrics table
            
            -- Data Quality Indicators
            COUNT(DISTINCT edm.mapping_id) as total_external_mappings,
            AVG(edm.data_quality_score) as avg_data_quality,
            MAX(dsl.end_time) as last_successful_sync,
            
            -- Calculation Date
            CURRENT_DATE as calculation_date
            
        FROM classrooms c
        LEFT JOIN classroom_enrollments ce ON c.classroom_id = ce.classroom_id AND ce.enrollment_status = 'active'
        LEFT JOIN student_academic_records sar ON ce.student_id = sar.student_id AND c.classroom_id = sar.classroom_id
        LEFT JOIN student_attendance sa ON ce.student_id = sa.student_id AND c.classroom_id = sa.classroom_id
        LEFT JOIN student_behavior_records sbr ON ce.student_id = sbr.student_id AND c.classroom_id = sbr.classroom_id
        LEFT JOIN gradebook_integration_data gid ON ce.student_id = gid.student_id AND c.classroom_id = gid.classroom_id
        LEFT JOIN attendance_integration_data aid ON ce.student_id = aid.student_id AND c.classroom_id = aid.classroom_id
        LEFT JOIN external_data_mappings edm ON c.classroom_id::TEXT = edm.internal_id::TEXT
        LEFT JOIN external_system_integrations esi ON edm.integration_id = esi.integration_id
        LEFT JOIN data_sync_logs dsl ON esi.integration_id = dsl.integration_id AND dsl.status = 'completed'
        
        GROUP BY c.classroom_id, c.teacher_id, c.academic_year, c.semester;
        
        -- Update audit triggers would be added here if the function exists
        
        -- Grant appropriate permissions (skip if roles don't exist)
        -- GRANT statements would go here for production roles
        
        -- Record migration as applied
        PERFORM public.record_migration('v1.2.2', 'Added SIS/LMS integration infrastructure for external data source connectivity and CIQ academic/attendance data');
        
        RAISE NOTICE 'Migration v1.2.2 applied successfully - SIS/LMS integration infrastructure created';
        
    ELSE
        RAISE NOTICE 'Migration v1.2.2 already applied, skipping';
    END IF;
END $$;