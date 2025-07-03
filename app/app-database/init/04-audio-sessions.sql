-- Audio Processing & Sessions Tables

-- Audio sessions
CREATE TABLE IF NOT EXISTS core.audio_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_seconds INTEGER CHECK (duration_seconds > 0),
    status session_status DEFAULT 'uploading',
    source session_source NOT NULL,
    audio_file_url VARCHAR(500),
    transcript TEXT,
    metadata JSONB DEFAULT '{}',
    session_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audio uploads tracking
CREATE TABLE IF NOT EXISTS core.audio_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT CHECK (file_size_bytes > 0),
    mime_type VARCHAR(100),
    upload_status upload_status DEFAULT 'pending',
    progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    error_message TEXT,
    upload_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    upload_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_mime_type CHECK (mime_type IN ('audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'))
);

-- Key moments within sessions
CREATE TABLE IF NOT EXISTS core.key_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time_seconds INTEGER NOT NULL CHECK (start_time_seconds >= 0),
    end_time_seconds INTEGER NOT NULL,
    audio_clip_url VARCHAR(500),
    moment_type moment_type NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (end_time_seconds > start_time_seconds)
);

-- Add foreign key constraint to goal_progress_logs
ALTER TABLE core.goal_progress_logs 
    ADD CONSTRAINT fk_goal_progress_session 
    FOREIGN KEY (session_id) 
    REFERENCES core.audio_sessions(id) 
    ON DELETE SET NULL;

-- Create indexes for audio tables
CREATE INDEX idx_audio_sessions_teacher_id ON core.audio_sessions(teacher_id);
CREATE INDEX idx_audio_sessions_status ON core.audio_sessions(status);
CREATE INDEX idx_audio_sessions_session_date ON core.audio_sessions(session_date);
CREATE INDEX idx_audio_sessions_created_at ON core.audio_sessions(created_at);
CREATE INDEX idx_audio_uploads_session_id ON core.audio_uploads(session_id);
CREATE INDEX idx_audio_uploads_status ON core.audio_uploads(upload_status);
CREATE INDEX idx_key_moments_session_id ON core.key_moments(session_id);
CREATE INDEX idx_key_moments_type ON core.key_moments(moment_type);
CREATE INDEX idx_key_moments_tags ON core.key_moments USING GIN(tags);