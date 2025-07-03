-- CIQ Analytics & Performance Tables

-- CIQ Metrics
CREATE TABLE IF NOT EXISTS analytics.ciq_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    equity_score NUMERIC(5,2) CHECK (equity_score >= 0 AND equity_score <= 100),
    creativity_score NUMERIC(5,2) CHECK (creativity_score >= 0 AND creativity_score <= 100),
    innovation_score NUMERIC(5,2) CHECK (innovation_score >= 0 AND innovation_score <= 100),
    overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    framework_type framework_type DEFAULT 'eci',
    equity_details JSONB DEFAULT '{}',
    creativity_details JSONB DEFAULT '{}',
    innovation_details JSONB DEFAULT '{}',
    talk_time_ratio NUMERIC(5,2) CHECK (talk_time_ratio >= 0 AND talk_time_ratio <= 100),
    question_metrics JSONB DEFAULT '{}',
    radar_data JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id)
);

-- Teacher Performance Summary
CREATE TABLE IF NOT EXISTS analytics.teacher_performance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    total_duration_hours NUMERIC(10,2) DEFAULT 0 CHECK (total_duration_hours >= 0),
    sessions_this_week INTEGER DEFAULT 0 CHECK (sessions_this_week >= 0),
    sessions_last_week INTEGER DEFAULT 0 CHECK (sessions_last_week >= 0),
    performance_status performance_status,
    performance_title VARCHAR(255),
    avg_equity_score NUMERIC(5,2) CHECK (avg_equity_score >= 0 AND avg_equity_score <= 100),
    avg_creativity_score NUMERIC(5,2) CHECK (avg_creativity_score >= 0 AND avg_creativity_score <= 100),
    avg_innovation_score NUMERIC(5,2) CHECK (avg_innovation_score >= 0 AND avg_innovation_score <= 100),
    avg_overall_score NUMERIC(5,2) CHECK (avg_overall_score >= 0 AND avg_overall_score <= 100),
    equity_trend trend_direction,
    creativity_trend trend_direction,
    innovation_trend trend_direction,
    weekly_trends JSONB DEFAULT '{}',
    radar_performance_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_period CHECK (period_end >= period_start),
    UNIQUE(teacher_id, period_start, period_end)
);

-- Create indexes for analytics tables
CREATE INDEX idx_ciq_metrics_session_id ON analytics.ciq_metrics(session_id);
CREATE INDEX idx_ciq_metrics_teacher_id ON analytics.ciq_metrics(teacher_id);
CREATE INDEX idx_ciq_metrics_calculated_at ON analytics.ciq_metrics(calculated_at);
CREATE INDEX idx_ciq_metrics_scores ON analytics.ciq_metrics(equity_score, creativity_score, innovation_score);
CREATE INDEX idx_teacher_performance_teacher_id ON analytics.teacher_performance_summary(teacher_id);
CREATE INDEX idx_teacher_performance_period ON analytics.teacher_performance_summary(period_start, period_end);
CREATE INDEX idx_teacher_performance_status ON analytics.teacher_performance_summary(performance_status);
CREATE INDEX idx_teacher_performance_updated ON analytics.teacher_performance_summary(updated_at);