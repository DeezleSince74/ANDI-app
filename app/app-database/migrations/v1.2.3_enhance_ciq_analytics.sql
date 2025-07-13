-- Migration v1.2.3: Enhance CIQ Analytics Tables
-- Description: Updates existing CIQ analytics to support full ECI framework with detailed component tracking and adaptive weighting

-- Check if migration has been applied
DO $$
BEGIN
    IF NOT migration_applied('v1.2.3') THEN
        
        RAISE NOTICE 'Applying migration v1.2.3: Enhanced CIQ Analytics';
        
        -- Set schema
        SET search_path TO analytics, core, public;
        
        -- Add new columns to existing analytics.ciq_metrics table for detailed ECI tracking
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS classroom_id UUID;
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS calculation_date DATE DEFAULT CURRENT_DATE;
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS teacher_talk_percentage DECIMAL(5,2);
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS student_talk_percentage DECIMAL(5,2);
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS question_count INTEGER;
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS wait_time_avg DECIMAL(5,2);
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS eci_detailed_scores JSONB DEFAULT '{}';
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS adaptive_weights JSONB DEFAULT '{}';
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS calculation_metadata JSONB DEFAULT '{}';
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS data_source_weights JSONB DEFAULT '{}';
        ALTER TABLE analytics.ciq_metrics ADD COLUMN IF NOT EXISTS quality_indicators JSONB DEFAULT '{}';
        
        -- Add foreign key for classroom_id
        ALTER TABLE analytics.ciq_metrics ADD CONSTRAINT fk_ciq_metrics_classroom_id 
            FOREIGN KEY (classroom_id) REFERENCES core.classrooms(classroom_id) ON DELETE SET NULL;
        
        -- Create detailed ECI component tracking table
        CREATE TABLE IF NOT EXISTS analytics.eci_component_scores (
            component_score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
            classroom_id UUID REFERENCES core.classrooms(classroom_id) ON DELETE CASCADE,
            teacher_id UUID REFERENCES core.teacher_profiles(user_id) ON DELETE CASCADE,
            calculation_date DATE DEFAULT CURRENT_DATE,
            
            -- Equity Components (E1-E5)
            e1_identity_recognition DECIMAL(4,2) DEFAULT 0.00 CHECK (e1_identity_recognition BETWEEN 0 AND 10),
            e2_psychological_safety DECIMAL(4,2) DEFAULT 0.00 CHECK (e2_psychological_safety BETWEEN 0 AND 10),
            e3_access_equity DECIMAL(4,2) DEFAULT 0.00 CHECK (e3_access_equity BETWEEN 0 AND 10),
            e4_voice_elevation DECIMAL(4,2) DEFAULT 0.00 CHECK (e4_voice_elevation BETWEEN 0 AND 10),
            e5_collaboration DECIMAL(4,2) DEFAULT 0.00 CHECK (e5_collaboration BETWEEN 0 AND 10),
            
            -- Creativity Components (C6-C10)
            c6_self_expression DECIMAL(4,2) DEFAULT 0.00 CHECK (c6_self_expression BETWEEN 0 AND 10),
            c7_experimentation DECIMAL(4,2) DEFAULT 0.00 CHECK (c7_experimentation BETWEEN 0 AND 10),
            c8_active_learning DECIMAL(4,2) DEFAULT 0.00 CHECK (c8_active_learning BETWEEN 0 AND 10),
            c9_skill_development DECIMAL(4,2) DEFAULT 0.00 CHECK (c9_skill_development BETWEEN 0 AND 10),
            c10_imagination DECIMAL(4,2) DEFAULT 0.00 CHECK (c10_imagination BETWEEN 0 AND 10),
            
            -- Innovation Components (I11-I15)
            i11_possibility_mindset DECIMAL(4,2) DEFAULT 0.00 CHECK (i11_possibility_mindset BETWEEN 0 AND 10),
            i12_real_world_connections DECIMAL(4,2) DEFAULT 0.00 CHECK (i12_real_world_connections BETWEEN 0 AND 10),
            i13_change_making DECIMAL(4,2) DEFAULT 0.00 CHECK (i13_change_making BETWEEN 0 AND 10),
            i14_impact_assessment DECIMAL(4,2) DEFAULT 0.00 CHECK (i14_impact_assessment BETWEEN 0 AND 10),
            i15_continuous_improvement DECIMAL(4,2) DEFAULT 0.00 CHECK (i15_continuous_improvement BETWEEN 0 AND 10),
            
            -- Component Group Averages
            equity_avg DECIMAL(4,2) GENERATED ALWAYS AS ((e1_identity_recognition + e2_psychological_safety + e3_access_equity + e4_voice_elevation + e5_collaboration) / 5.0) STORED,
            creativity_avg DECIMAL(4,2) GENERATED ALWAYS AS ((c6_self_expression + c7_experimentation + c8_active_learning + c9_skill_development + c10_imagination) / 5.0) STORED,
            innovation_avg DECIMAL(4,2) GENERATED ALWAYS AS ((i11_possibility_mindset + i12_real_world_connections + i13_change_making + i14_impact_assessment + i15_continuous_improvement) / 5.0) STORED,
            
            -- Analysis Metadata
            analyzer_confidence DECIMAL(4,2) DEFAULT 0.00 CHECK (analyzer_confidence BETWEEN 0 AND 1),
            transcript_quality_score DECIMAL(4,2) DEFAULT 0.00,
            analysis_duration_ms INTEGER DEFAULT 0,
            llm_model_version VARCHAR(50),
            analysis_prompts_used JSONB DEFAULT '{}',
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT unique_session_component_analysis UNIQUE(session_id)
        );
        
        -- Create indexes for ECI component scores
        CREATE INDEX IF NOT EXISTS idx_eci_components_session ON analytics.eci_component_scores(session_id);
        CREATE INDEX IF NOT EXISTS idx_eci_components_classroom ON analytics.eci_component_scores(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_eci_components_teacher ON analytics.eci_component_scores(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_eci_components_date ON analytics.eci_component_scores(calculation_date);
        CREATE INDEX IF NOT EXISTS idx_eci_components_equity ON analytics.eci_component_scores(equity_avg);
        CREATE INDEX IF NOT EXISTS idx_eci_components_creativity ON analytics.eci_component_scores(creativity_avg);
        CREATE INDEX IF NOT EXISTS idx_eci_components_innovation ON analytics.eci_component_scores(innovation_avg);
        
        -- Create adaptive weighting configuration table
        CREATE TABLE IF NOT EXISTS analytics.ciq_adaptive_weights (
            weight_config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            classroom_id UUID REFERENCES core.classrooms(classroom_id) ON DELETE CASCADE,
            teacher_id UUID REFERENCES core.teacher_profiles(user_id) ON DELETE CASCADE,
            
            -- Effective Date Range
            effective_start_date DATE DEFAULT CURRENT_DATE,
            effective_end_date DATE,
            is_active BOOLEAN DEFAULT true,
            
            -- Data Source Weights (must sum to 1.0)
            sis_lms_weight DECIMAL(4,3) DEFAULT 0.500 CHECK (sis_lms_weight BETWEEN 0 AND 1),
            survey_weight DECIMAL(4,3) DEFAULT 0.200 CHECK (survey_weight BETWEEN 0 AND 1),
            eci_blueprint_weight DECIMAL(4,3) DEFAULT 0.300 CHECK (eci_blueprint_weight BETWEEN 0 AND 1),
            
            -- ECI Component Weights within the 30% ECI allocation
            equity_component_weight DECIMAL(4,3) DEFAULT 0.333 CHECK (equity_component_weight BETWEEN 0 AND 1),
            creativity_component_weight DECIMAL(4,3) DEFAULT 0.333 CHECK (creativity_component_weight BETWEEN 0 AND 1),
            innovation_component_weight DECIMAL(4,3) DEFAULT 0.334 CHECK (innovation_component_weight BETWEEN 0 AND 1),
            
            -- Individual ECI Element Weights (within each component)
            eci_element_weights JSONB DEFAULT '{
                "e1": 0.2, "e2": 0.2, "e3": 0.2, "e4": 0.2, "e5": 0.2,
                "c6": 0.2, "c7": 0.2, "c8": 0.2, "c9": 0.2, "c10": 0.2,
                "i11": 0.2, "i12": 0.2, "i13": 0.2, "i14": 0.2, "i15": 0.2
            }',
            
            -- Customization Context
            teacher_goals JSONB DEFAULT '{}', -- Links to teacher_goals table
            classroom_context JSONB DEFAULT '{}', -- Grade level, subject, demographics
            customization_reason TEXT,
            
            -- Configuration Metadata
            configured_by UUID REFERENCES auth.users(id),
            approved_by UUID REFERENCES auth.users(id),
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT valid_total_weight CHECK ((sis_lms_weight + survey_weight + eci_blueprint_weight) = 1.0),
            CONSTRAINT valid_eci_total_weight CHECK ((equity_component_weight + creativity_component_weight + innovation_component_weight) = 1.0)
        );
        
        -- Create indexes for adaptive weights
        CREATE INDEX IF NOT EXISTS idx_adaptive_weights_classroom ON analytics.ciq_adaptive_weights(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_adaptive_weights_teacher ON analytics.ciq_adaptive_weights(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_adaptive_weights_active ON analytics.ciq_adaptive_weights(is_active);
        CREATE INDEX IF NOT EXISTS idx_adaptive_weights_dates ON analytics.ciq_adaptive_weights(effective_start_date, effective_end_date);
        
        -- Create comprehensive CIQ calculation view
        CREATE OR REPLACE VIEW analytics.ciq_comprehensive_view AS
        SELECT 
            cm.session_id,
            cm.classroom_id,
            cm.teacher_id,
            cm.calculation_date,
            
            -- Original CIQ Scores
            cm.overall_score as legacy_overall_score,
            cm.equity_score as legacy_equity_score,
            cm.creativity_score as legacy_creativity_score,
            cm.innovation_score as legacy_innovation_score,
            
            -- Detailed ECI Component Scores
            ecs.e1_identity_recognition, ecs.e2_psychological_safety, ecs.e3_access_equity, 
            ecs.e4_voice_elevation, ecs.e5_collaboration,
            ecs.c6_self_expression, ecs.c7_experimentation, ecs.c8_active_learning, 
            ecs.c9_skill_development, ecs.c10_imagination,
            ecs.i11_possibility_mindset, ecs.i12_real_world_connections, ecs.i13_change_making,
            ecs.i14_impact_assessment, ecs.i15_continuous_improvement,
            
            ecs.equity_avg as detailed_equity_score,
            ecs.creativity_avg as detailed_creativity_score,
            ecs.innovation_avg as detailed_innovation_score,
            
            -- Data Source Contributions
            sislms.avg_class_grade,
            sislms.attendance_rate,
            sislms.positive_behavior_ratio,
            
            -- Survey Contributions
            sa_teacher.teacher_confidence_avg,
            sa_teacher.teacher_satisfaction_avg,
            sa_teacher.perceived_engagement_avg,
            sa_student.student_wellbeing_avg,
            sa_student.student_belonging_avg,
            sa_student.learning_effectiveness_avg,
            
            -- Participation Metrics (from audio analysis)
            cm.teacher_talk_percentage,
            cm.student_talk_percentage,
            cm.question_count,
            cm.wait_time_avg,
            
            -- Adaptive Weights Applied
            aw.sis_lms_weight,
            aw.survey_weight,
            aw.eci_blueprint_weight,
            aw.equity_component_weight,
            aw.creativity_component_weight,
            aw.innovation_component_weight,
            
            -- Calculated Weighted CIQ Score
            ROUND((
                (COALESCE(sislms.avg_class_grade, 0) * 0.15 + 
                 COALESCE(sislms.attendance_rate, 0) * 100 * 0.05 + 
                 COALESCE(sislms.positive_behavior_ratio, 0) * 100 * 0.10) * aw.sis_lms_weight +
                
                (COALESCE(sa_teacher.teacher_confidence_avg, 0) * 2 + 
                 COALESCE(sa_teacher.teacher_satisfaction_avg, 0) * 2 + 
                 COALESCE(sa_teacher.perceived_engagement_avg, 0) * 2 +
                 COALESCE(sa_student.student_wellbeing_avg, 0) * 2 + 
                 COALESCE(sa_student.student_belonging_avg, 0) * 2 + 
                 COALESCE(sa_student.learning_effectiveness_avg, 0) * 2) / 6 * aw.survey_weight +
                
                (ecs.equity_avg * 10 * aw.equity_component_weight + 
                 ecs.creativity_avg * 10 * aw.creativity_component_weight + 
                 ecs.innovation_avg * 10 * aw.innovation_component_weight) * aw.eci_blueprint_weight
            ), 2) as weighted_ciq_score,
            
            -- Analysis Quality Indicators
            ecs.analyzer_confidence,
            ecs.transcript_quality_score,
            sislms.avg_data_quality,
            
            -- Context
            c.subject,
            c.grade_level,
            c.academic_year,
            tp.years_experience
            
        FROM analytics.ciq_metrics cm
        LEFT JOIN analytics.eci_component_scores ecs ON cm.session_id = ecs.session_id
        LEFT JOIN ciq_sis_lms_metrics sislms ON cm.classroom_id = sislms.classroom_id
        LEFT JOIN survey_analytics_for_ciq sa_teacher ON cm.classroom_id::text = sa_teacher.respondent_metadata->>'classroom_id' AND sa_teacher.survey_type = 'teacher_experience'
        LEFT JOIN survey_analytics_for_ciq sa_student ON cm.classroom_id::text = sa_student.respondent_metadata->>'classroom_id' AND sa_student.survey_type = 'student_experience'
        LEFT JOIN analytics.ciq_adaptive_weights aw ON cm.classroom_id = aw.classroom_id AND aw.is_active = true
        LEFT JOIN core.classrooms c ON cm.classroom_id = c.classroom_id
        LEFT JOIN core.teacher_profiles tp ON cm.teacher_id = tp.user_id;
        
        -- Create performance monitoring view for CIQ trends
        CREATE OR REPLACE VIEW analytics.ciq_performance_trends AS
        SELECT 
            classroom_id,
            teacher_id,
            DATE_TRUNC('week', calculation_date) as week_start,
            DATE_TRUNC('month', calculation_date) as month_start,
            
            -- Weekly Aggregations
            COUNT(*) as sessions_count,
            AVG(weighted_ciq_score) as avg_weekly_ciq,
            AVG(detailed_equity_score * 10) as avg_weekly_equity,
            AVG(detailed_creativity_score * 10) as avg_weekly_creativity,
            AVG(detailed_innovation_score * 10) as avg_weekly_innovation,
            
            -- Trend Indicators
            LAG(AVG(weighted_ciq_score)) OVER (PARTITION BY classroom_id ORDER BY DATE_TRUNC('week', calculation_date)) as prev_week_ciq,
            CASE 
                WHEN AVG(weighted_ciq_score) > LAG(AVG(weighted_ciq_score)) OVER (PARTITION BY classroom_id ORDER BY DATE_TRUNC('week', calculation_date)) THEN 'improving'
                WHEN AVG(weighted_ciq_score) < LAG(AVG(weighted_ciq_score)) OVER (PARTITION BY classroom_id ORDER BY DATE_TRUNC('week', calculation_date)) THEN 'declining'
                ELSE 'stable'
            END as trend_direction,
            
            -- Quality Indicators
            AVG(analyzer_confidence) as avg_analysis_confidence,
            AVG(transcript_quality_score) as avg_transcript_quality,
            
            MIN(calculation_date) as period_start,
            MAX(calculation_date) as period_end
            
        FROM analytics.ciq_comprehensive_view
        WHERE calculation_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY classroom_id, teacher_id, DATE_TRUNC('week', calculation_date), DATE_TRUNC('month', calculation_date);
        
        -- Update audit triggers would be added here if the function exists
        
        -- Grant appropriate permissions (skip if roles don't exist)
        -- GRANT statements would go here for production roles
        
        -- Update existing ciq_metrics table with sample data structure for new columns
        UPDATE analytics.ciq_metrics 
        SET 
            eci_detailed_scores = '{"equity": {"e1": 0, "e2": 0, "e3": 0, "e4": 0, "e5": 0}, "creativity": {"c6": 0, "c7": 0, "c8": 0, "c9": 0, "c10": 0}, "innovation": {"i11": 0, "i12": 0, "i13": 0, "i14": 0, "i15": 0}}',
            adaptive_weights = '{"sis_lms": 0.5, "survey": 0.2, "eci_blueprint": 0.3}',
            data_source_weights = '{"academic": 0.15, "attendance": 0.05, "behavior": 0.10, "participation": 0.20}',
            quality_indicators = '{"transcript_quality": 0.8, "analysis_confidence": 0.85, "data_completeness": 0.9}'
        WHERE eci_detailed_scores IS NULL OR eci_detailed_scores = '{}';
        
        -- Record migration as applied
        PERFORM public.record_migration('v1.2.3', 'Enhanced CIQ analytics with detailed ECI component tracking, adaptive weighting, and comprehensive scoring views');
        
        RAISE NOTICE 'Migration v1.2.3 applied successfully - Enhanced CIQ analytics system created';
        
    ELSE
        RAISE NOTICE 'Migration v1.2.3 already applied, skipping';
    END IF;
END $$;