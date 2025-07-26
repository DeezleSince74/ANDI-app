-- Migration: Enhance Recordings Workflow
-- Created: 2025-07-25
-- Description: Enhances recording sessions table to support new workflow with recording names, source tracking, and background processing

-- Add new columns to recording sessions table
ALTER TABLE "andi_web_recording_session" 
ADD COLUMN IF NOT EXISTS "display_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "source_type" VARCHAR(20) NOT NULL DEFAULT 'recorded', -- 'recorded' or 'uploaded'
ADD COLUMN IF NOT EXISTS "file_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "file_size" BIGINT,
ADD COLUMN IF NOT EXISTS "processing_queue_id" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "upload_progress" INTEGER DEFAULT 0, -- 0-100
ADD COLUMN IF NOT EXISTS "processing_progress" INTEGER DEFAULT 0, -- 0-100
ADD COLUMN IF NOT EXISTS "processing_stage" VARCHAR(50) DEFAULT 'pending', -- 'pending', 'uploading', 'transcribing', 'analyzing', 'completed', 'failed'
ADD COLUMN IF NOT EXISTS "error_details" JSONB,
ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP WITH TIME ZONE;

-- Create processing queue table for background job management
CREATE TABLE IF NOT EXISTS "andi_web_processing_queue" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_recording_session"("session_id"),
  "user_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_user"("id"),
  "queue_position" INTEGER,
  "priority" VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
  "status" VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'cancelled'
  "started_at" TIMESTAMP WITH TIME ZONE,
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "estimated_completion" TIMESTAMP WITH TIME ZONE,
  "retry_count" INTEGER DEFAULT 0,
  "max_retries" INTEGER DEFAULT 3,
  "error_message" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table for notification bell system
CREATE TABLE IF NOT EXISTS "andi_web_notification" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" VARCHAR(255) NOT NULL REFERENCES "andi_web_user"("id"),
  "session_id" VARCHAR(255) REFERENCES "andi_web_recording_session"("session_id"),
  "type" VARCHAR(50) NOT NULL, -- 'processing_complete', 'processing_failed', 'upload_complete', 'analysis_ready'
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "action_url" VARCHAR(500),
  "is_read" BOOLEAN DEFAULT false,
  "priority" VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMP WITH TIME ZONE
);

-- Create indexes for new tables and columns
CREATE INDEX IF NOT EXISTS "recording_session_display_name_idx" ON "andi_web_recording_session"("display_name");
CREATE INDEX IF NOT EXISTS "recording_session_source_type_idx" ON "andi_web_recording_session"("source_type");
CREATE INDEX IF NOT EXISTS "recording_session_processing_stage_idx" ON "andi_web_recording_session"("processing_stage");
CREATE INDEX IF NOT EXISTS "recording_session_completed_idx" ON "andi_web_recording_session"("completed_at");

CREATE INDEX IF NOT EXISTS "processing_queue_user_idx" ON "andi_web_processing_queue"("user_id");
CREATE INDEX IF NOT EXISTS "processing_queue_status_idx" ON "andi_web_processing_queue"("status");
CREATE INDEX IF NOT EXISTS "processing_queue_priority_idx" ON "andi_web_processing_queue"("priority");
CREATE INDEX IF NOT EXISTS "processing_queue_position_idx" ON "andi_web_processing_queue"("queue_position");
CREATE INDEX IF NOT EXISTS "processing_queue_created_idx" ON "andi_web_processing_queue"("created_at");

CREATE INDEX IF NOT EXISTS "notification_user_idx" ON "andi_web_notification"("user_id");
CREATE INDEX IF NOT EXISTS "notification_session_idx" ON "andi_web_notification"("session_id");
CREATE INDEX IF NOT EXISTS "notification_type_idx" ON "andi_web_notification"("type");
CREATE INDEX IF NOT EXISTS "notification_read_idx" ON "andi_web_notification"("is_read");
CREATE INDEX IF NOT EXISTS "notification_priority_idx" ON "andi_web_notification"("priority");
CREATE INDEX IF NOT EXISTS "notification_created_idx" ON "andi_web_notification"("created_at");

-- Add triggers for updated_at columns
CREATE TRIGGER update_processing_queue_updated_at BEFORE UPDATE ON "andi_web_processing_queue" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate default recording names
CREATE OR REPLACE FUNCTION generate_default_recording_name(user_id VARCHAR, created_at TIMESTAMP WITH TIME ZONE)
RETURNS VARCHAR AS $$
DECLARE
    week_start DATE;
    week_num INTEGER;
    daily_count INTEGER;
    result VARCHAR;
BEGIN
    -- Get the start of the week (Monday)
    week_start := DATE_TRUNC('week', created_at::DATE);
    
    -- Count recordings this week for this user
    SELECT COUNT(*) + 1 INTO week_num
    FROM "andi_web_recording_session" 
    WHERE "user_id" = generate_default_recording_name.user_id 
    AND DATE_TRUNC('week', "created_at"::DATE) = week_start;
    
    -- Count recordings today for this user
    SELECT COUNT(*) + 1 INTO daily_count
    FROM "andi_web_recording_session" 
    WHERE "user_id" = generate_default_recording_name.user_id 
    AND DATE_TRUNC('day', "created_at"::DATE) = DATE_TRUNC('day', created_at::DATE);
    
    -- Generate name: "Recording {week_number} - {day_name} Session {daily_count}"
    result := CONCAT(
        'Recording ', week_num, ' - ',
        TO_CHAR(created_at, 'Day'), ' Session ', daily_count
    );
    
    RETURN TRIM(result);
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to auto-generate display names if not provided
CREATE OR REPLACE FUNCTION set_default_display_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
        NEW.display_name := generate_default_recording_name(NEW.user_id, NEW.created_at);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER set_recording_display_name 
    BEFORE INSERT ON "andi_web_recording_session" 
    FOR EACH ROW EXECUTE FUNCTION set_default_display_name();