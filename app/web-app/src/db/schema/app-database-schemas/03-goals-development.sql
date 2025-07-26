-- Goals and Development Tables

-- Teacher goals
CREATE TABLE IF NOT EXISTS core.teacher_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category goal_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status goal_status DEFAULT 'active',
    target_date DATE,
    success_criteria JSONB DEFAULT '[]',
    progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_target_date CHECK (target_date IS NULL OR target_date >= CURRENT_DATE)
);

-- Goal progress logs
CREATE TABLE IF NOT EXISTS core.goal_progress_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES core.teacher_goals(id) ON DELETE CASCADE,
    session_id UUID, -- Will reference audio_sessions later
    notes TEXT,
    progress_increment NUMERIC(5,2) CHECK (progress_increment >= -100 AND progress_increment <= 100),
    metrics_snapshot JSONB DEFAULT '{}',
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for goals tables
CREATE INDEX idx_teacher_goals_teacher_id ON core.teacher_goals(teacher_id);
CREATE INDEX idx_teacher_goals_status ON core.teacher_goals(status);
CREATE INDEX idx_teacher_goals_category ON core.teacher_goals(category);
CREATE INDEX idx_teacher_goals_target_date ON core.teacher_goals(target_date);
CREATE INDEX idx_goal_progress_logs_goal_id ON core.goal_progress_logs(goal_id);
CREATE INDEX idx_goal_progress_logs_session_id ON core.goal_progress_logs(session_id);
CREATE INDEX idx_goal_progress_logs_logged_at ON core.goal_progress_logs(logged_at);