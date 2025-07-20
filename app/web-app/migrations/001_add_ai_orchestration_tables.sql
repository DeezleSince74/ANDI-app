-- Migration: Add AI Orchestration Tables
-- Created: 2025-07-20
-- Description: Adds tables for AI job tracking, recording sessions, transcripts, CIQ analyses, and coaching recommendations

-- Recording Sessions Table
CREATE TABLE IF NOT EXISTS "andi_web_recording_session" (
  "session_id" VARCHAR(255) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_user"("id"),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "audio_url" VARCHAR(500),
  "duration" INTEGER, -- in seconds
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  "transcript_id" VARCHAR(255), -- Assembly AI transcript ID
  "ciq_score" INTEGER, -- 0-100
  "ciq_data" JSONB,
  "coaching_insights" JSONB,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Jobs Table (for job tracking)
CREATE TABLE IF NOT EXISTS "andi_web_ai_job" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" VARCHAR(255) REFERENCES "andi_web_recording_session"("session_id"),
  "user_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_user"("id"),
  "job_type" VARCHAR(50) NOT NULL, -- 'transcription', 'ciq_analysis', 'coaching', 'realtime'
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  "progress" INTEGER DEFAULT 0, -- 0-100
  "external_id" VARCHAR(255), -- Assembly AI transcript_id, etc.
  "result" JSONB,
  "error_message" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transcripts Table
CREATE TABLE IF NOT EXISTS "andi_web_transcript" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_recording_session"("session_id"),
  "external_id" VARCHAR(255) NOT NULL, -- Assembly AI transcript ID
  "status" VARCHAR(50) NOT NULL, -- 'queued', 'processing', 'completed', 'error'
  "text" TEXT,
  "confidence" INTEGER, -- 0-100
  "audio_url" VARCHAR(500),
  "words" JSONB, -- Array of word objects with timestamps
  "utterances" JSONB, -- Array of utterance objects with speaker info
  "summary" TEXT,
  "chapters" JSONB, -- Array of chapter objects
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CIQ Analyses Table
CREATE TABLE IF NOT EXISTS "andi_web_ciq_analysis" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_recording_session"("session_id"),
  "transcript_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_transcript"("id"),
  "overall_score" INTEGER, -- 0-100
  "equity_score" INTEGER, -- 0-100
  "creativity_score" INTEGER, -- 0-100
  "innovation_score" INTEGER, -- 0-100
  "component_scores" JSONB, -- ECI Component Scores (E1-E5, C6-C10, I11-I15)
  "equity_analysis" JSONB, -- Detailed analysis by component
  "creativity_analysis" JSONB,
  "innovation_analysis" JSONB,
  "key_insights" JSONB, -- Array of key insights
  "strengths_identified" JSONB, -- Array of strengths
  "areas_for_growth" JSONB, -- Array of growth areas
  "evidence_snippets" JSONB, -- Array of evidence objects with timestamps
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coaching Recommendations Table
CREATE TABLE IF NOT EXISTS "andi_web_coaching_recommendation" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_recording_session"("session_id"),
  "analysis_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_ciq_analysis"("id"),
  "category" VARCHAR(50) NOT NULL, -- 'equity', 'creativity', 'innovation'
  "component" VARCHAR(10), -- 'E1', 'E2', 'C6', 'I11', etc.
  "priority" VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "action_steps" JSONB, -- Array of action steps
  "resources" JSONB, -- Array of resource objects
  "expected_outcome" TEXT,
  "timeframe" VARCHAR(50), -- 'immediate', 'weekly', 'monthly'
  "difficulty_level" VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
  "evidence_basis" JSONB, -- Array of evidence objects
  "is_implemented" BOOLEAN DEFAULT false,
  "implemented_at" TIMESTAMP WITH TIME ZONE,
  "feedback" JSONB,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "recording_session_user_idx" ON "andi_web_recording_session"("user_id");
CREATE INDEX IF NOT EXISTS "recording_session_status_idx" ON "andi_web_recording_session"("status");
CREATE INDEX IF NOT EXISTS "recording_session_transcript_idx" ON "andi_web_recording_session"("transcript_id");
CREATE INDEX IF NOT EXISTS "recording_session_created_idx" ON "andi_web_recording_session"("created_at");

CREATE INDEX IF NOT EXISTS "ai_job_session_idx" ON "andi_web_ai_job"("session_id");
CREATE INDEX IF NOT EXISTS "ai_job_user_idx" ON "andi_web_ai_job"("user_id");
CREATE INDEX IF NOT EXISTS "ai_job_status_idx" ON "andi_web_ai_job"("status");
CREATE INDEX IF NOT EXISTS "ai_job_type_idx" ON "andi_web_ai_job"("job_type");
CREATE INDEX IF NOT EXISTS "ai_job_external_idx" ON "andi_web_ai_job"("external_id");
CREATE INDEX IF NOT EXISTS "ai_job_created_idx" ON "andi_web_ai_job"("created_at");

CREATE INDEX IF NOT EXISTS "transcript_session_idx" ON "andi_web_transcript"("session_id");
CREATE INDEX IF NOT EXISTS "transcript_external_idx" ON "andi_web_transcript"("external_id");
CREATE INDEX IF NOT EXISTS "transcript_status_idx" ON "andi_web_transcript"("status");

CREATE INDEX IF NOT EXISTS "ciq_analysis_session_idx" ON "andi_web_ciq_analysis"("session_id");
CREATE INDEX IF NOT EXISTS "ciq_analysis_transcript_idx" ON "andi_web_ciq_analysis"("transcript_id");
CREATE INDEX IF NOT EXISTS "ciq_analysis_score_idx" ON "andi_web_ciq_analysis"("overall_score");

CREATE INDEX IF NOT EXISTS "coaching_recommendation_session_idx" ON "andi_web_coaching_recommendation"("session_id");
CREATE INDEX IF NOT EXISTS "coaching_recommendation_analysis_idx" ON "andi_web_coaching_recommendation"("analysis_id");
CREATE INDEX IF NOT EXISTS "coaching_recommendation_category_idx" ON "andi_web_coaching_recommendation"("category");
CREATE INDEX IF NOT EXISTS "coaching_recommendation_priority_idx" ON "andi_web_coaching_recommendation"("priority");
CREATE INDEX IF NOT EXISTS "coaching_recommendation_implemented_idx" ON "andi_web_coaching_recommendation"("is_implemented");

-- Add updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_recording_session_updated_at BEFORE UPDATE ON "andi_web_recording_session" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_job_updated_at BEFORE UPDATE ON "andi_web_ai_job" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transcript_updated_at BEFORE UPDATE ON "andi_web_transcript" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ciq_analysis_updated_at BEFORE UPDATE ON "andi_web_ciq_analysis" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaching_recommendation_updated_at BEFORE UPDATE ON "andi_web_coaching_recommendation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();