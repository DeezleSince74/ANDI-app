-- ANDI Recording and AI Processing Schema
-- Version: 002
-- Description: Tables for audio recordings, transcripts, and AI analysis

-- Recording sessions
CREATE TABLE IF NOT EXISTS andi_web_recording_session (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES andi_web_user(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audio_url VARCHAR(500),
    duration INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    transcript_id VARCHAR(255),
    ciq_score INTEGER CHECK (ciq_score >= 0 AND ciq_score <= 100),
    ciq_data JSONB,
    coaching_insights JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AI processing jobs
CREATE TABLE IF NOT EXISTS andi_web_ai_job (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id VARCHAR(255) REFERENCES andi_web_recording_session(session_id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES andi_web_user(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('transcription', 'ciq_analysis', 'coaching', 'realtime')),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    external_id VARCHAR(255), -- Assembly AI transcript ID, etc.
    result JSONB,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Transcripts
CREATE TABLE IF NOT EXISTS andi_web_transcript (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id VARCHAR(255) NOT NULL REFERENCES andi_web_recording_session(session_id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL, -- Assembly AI transcript ID
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'error')),
    text TEXT,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    audio_url VARCHAR(500),
    words JSONB, -- Word-level timestamps
    utterances JSONB, -- Speaker-separated segments
    summary TEXT,
    chapters JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CIQ Analysis
CREATE TABLE IF NOT EXISTS andi_web_ciq_analysis (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id VARCHAR(255) NOT NULL REFERENCES andi_web_recording_session(session_id) ON DELETE CASCADE,
    transcript_id VARCHAR(255) NOT NULL REFERENCES andi_web_transcript(id) ON DELETE CASCADE,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    equity_score INTEGER CHECK (equity_score >= 0 AND equity_score <= 100),
    creativity_score INTEGER CHECK (creativity_score >= 0 AND creativity_score <= 100),
    innovation_score INTEGER CHECK (innovation_score >= 0 AND innovation_score <= 100),
    component_scores JSONB, -- Detailed E1-E5, C6-C10, I11-I15 scores
    equity_analysis JSONB,
    creativity_analysis JSONB,
    innovation_analysis JSONB,
    key_insights JSONB,
    strengths_identified JSONB,
    areas_for_growth JSONB,
    evidence_snippets JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Coaching recommendations
CREATE TABLE IF NOT EXISTS andi_web_coaching_recommendation (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id VARCHAR(255) NOT NULL REFERENCES andi_web_recording_session(session_id) ON DELETE CASCADE,
    analysis_id VARCHAR(255) NOT NULL REFERENCES andi_web_ciq_analysis(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('equity', 'creativity', 'innovation')),
    component VARCHAR(10), -- E1, E2, C6, etc.
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_steps JSONB,
    resources JSONB,
    expected_outcome TEXT,
    timeframe VARCHAR(50),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'moderate', 'challenging')),
    evidence_basis JSONB,
    is_implemented BOOLEAN DEFAULT false,
    implemented_at TIMESTAMPTZ,
    feedback JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recording_user ON andi_web_recording_session(user_id);
CREATE INDEX IF NOT EXISTS idx_recording_status ON andi_web_recording_session(status);
CREATE INDEX IF NOT EXISTS idx_recording_created ON andi_web_recording_session(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_job_session ON andi_web_ai_job(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_user ON andi_web_ai_job(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_status ON andi_web_ai_job(status);
CREATE INDEX IF NOT EXISTS idx_ai_job_type ON andi_web_ai_job(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_job_external ON andi_web_ai_job(external_id);

CREATE INDEX IF NOT EXISTS idx_transcript_session ON andi_web_transcript(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_external ON andi_web_transcript(external_id);
CREATE INDEX IF NOT EXISTS idx_transcript_status ON andi_web_transcript(status);

CREATE INDEX IF NOT EXISTS idx_ciq_session ON andi_web_ciq_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_ciq_score ON andi_web_ciq_analysis(overall_score);

CREATE INDEX IF NOT EXISTS idx_coaching_session ON andi_web_coaching_recommendation(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_category ON andi_web_coaching_recommendation(category);
CREATE INDEX IF NOT EXISTS idx_coaching_priority ON andi_web_coaching_recommendation(priority);