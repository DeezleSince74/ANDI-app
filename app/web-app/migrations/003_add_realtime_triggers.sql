-- Migration: Add Real-time WebSocket Triggers
-- Created: 2025-07-25
-- Description: Adds PostgreSQL NOTIFY triggers for real-time WebSocket events

-- Create notification channel types
-- These channels will be listened to by the Node.js application

-- 1. Progress Update Triggers
-- Trigger when recording session progress changes
CREATE OR REPLACE FUNCTION notify_progress_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if progress actually changed or stage changed
  IF (OLD.processing_progress IS DISTINCT FROM NEW.processing_progress) OR 
     (OLD.processing_stage IS DISTINCT FROM NEW.processing_stage) OR
     (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    PERFORM pg_notify(
      'recording_progress_update',
      json_build_object(
        'sessionId', NEW.session_id,
        'userId', NEW.user_id,
        'displayName', NEW.display_name,
        'progress', NEW.processing_progress,
        'stage', NEW.processing_stage,
        'status', NEW.status,
        'sourceType', NEW.source_type,
        'updatedAt', extract(epoch from NEW.updated_at) * 1000,
        'eventType', 'progress_update'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to recording sessions
CREATE TRIGGER recording_progress_update_trigger
  AFTER UPDATE ON andi_web_recording_session
  FOR EACH ROW
  EXECUTE FUNCTION notify_progress_update();

-- 2. Queue Status Triggers
-- Trigger when queue items change status
CREATE OR REPLACE FUNCTION notify_queue_update()
RETURNS TRIGGER AS $$
DECLARE
  session_data RECORD;
BEGIN
  -- Get session details for context
  SELECT rs.user_id, rs.display_name, rs.source_type
  INTO session_data
  FROM andi_web_recording_session rs
  WHERE rs.session_id = NEW.session_id;
  
  -- Notify on status changes
  IF (OLD.status IS DISTINCT FROM NEW.status) OR 
     (OLD.queue_position IS DISTINCT FROM NEW.queue_position) OR
     (OLD.priority IS DISTINCT FROM NEW.priority) THEN
    
    PERFORM pg_notify(
      'queue_status_update',
      json_build_object(
        'queueId', NEW.id,
        'sessionId', NEW.session_id,
        'userId', session_data.user_id,
        'displayName', session_data.display_name,
        'status', NEW.status,
        'queuePosition', NEW.queue_position,
        'priority', NEW.priority,
        'retryCount', NEW.retry_count,
        'startedAt', CASE WHEN NEW.started_at IS NOT NULL 
                         THEN extract(epoch from NEW.started_at) * 1000 
                         ELSE NULL END,
        'estimatedCompletion', CASE WHEN NEW.estimated_completion IS NOT NULL 
                                   THEN extract(epoch from NEW.estimated_completion) * 1000 
                                   ELSE NULL END,
        'updatedAt', extract(epoch from NEW.updated_at) * 1000,
        'eventType', 'queue_update'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to processing queue
CREATE TRIGGER queue_status_update_trigger
  AFTER UPDATE ON andi_web_processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION notify_queue_update();

-- 3. New Queue Item Trigger
-- Trigger when new items are added to queue
CREATE OR REPLACE FUNCTION notify_queue_insert()
RETURNS TRIGGER AS $$
DECLARE
  session_data RECORD;
BEGIN
  -- Get session details
  SELECT rs.user_id, rs.display_name, rs.source_type, rs.duration
  INTO session_data
  FROM andi_web_recording_session rs
  WHERE rs.session_id = NEW.session_id;
  
  PERFORM pg_notify(
    'queue_item_added',
    json_build_object(
      'queueId', NEW.id,
      'sessionId', NEW.session_id,
      'userId', session_data.user_id,
      'displayName', session_data.display_name,
      'queuePosition', NEW.queue_position,
      'priority', NEW.priority,
      'sourceType', session_data.source_type,
      'duration', session_data.duration,
      'createdAt', extract(epoch from NEW.created_at) * 1000,
      'eventType', 'queue_item_added'
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for new queue items
CREATE TRIGGER queue_item_added_trigger
  AFTER INSERT ON andi_web_processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION notify_queue_insert();

-- 4. Notification Triggers
-- Trigger when new notifications are created
CREATE OR REPLACE FUNCTION notify_user_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'user_notification',
    json_build_object(
      'notificationId', NEW.id,
      'userId', NEW.user_id,
      'sessionId', NEW.session_id,
      'type', NEW.type,
      'title', NEW.title,
      'message', NEW.message,
      'actionUrl', NEW.action_url,
      'priority', NEW.priority,
      'isRead', NEW.is_read,
      'createdAt', extract(epoch from NEW.created_at) * 1000,
      'eventType', 'notification_created'
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for notifications
CREATE TRIGGER user_notification_trigger
  AFTER INSERT ON andi_web_notification
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_notification();

-- 5. Notification Read Status Trigger
-- Trigger when notifications are marked as read
CREATE OR REPLACE FUNCTION notify_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if read status changed
  IF OLD.is_read IS DISTINCT FROM NEW.is_read THEN
    PERFORM pg_notify(
      'notification_status_update',
      json_build_object(
        'notificationId', NEW.id,
        'userId', NEW.user_id,
        'isRead', NEW.is_read,
        'readAt', CASE WHEN NEW.read_at IS NOT NULL 
                      THEN extract(epoch from NEW.read_at) * 1000 
                      ELSE NULL END,
        'eventType', 'notification_read_status'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for notification updates
CREATE TRIGGER notification_read_status_trigger
  AFTER UPDATE ON andi_web_notification
  FOR EACH ROW
  EXECUTE FUNCTION notify_notification_read();

-- 6. Recording Session Creation Trigger
-- Trigger when new recording sessions are created
CREATE OR REPLACE FUNCTION notify_recording_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'recording_session_created',
    json_build_object(
      'sessionId', NEW.session_id,
      'userId', NEW.user_id,
      'displayName', NEW.display_name,
      'sourceType', NEW.source_type,
      'fileName', NEW.file_name,
      'fileSize', NEW.file_size,
      'duration', NEW.duration,
      'status', NEW.status,
      'processingStage', NEW.processing_stage,
      'createdAt', extract(epoch from NEW.created_at) * 1000,
      'eventType', 'recording_created'
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for new recording sessions
CREATE TRIGGER recording_session_created_trigger
  AFTER INSERT ON andi_web_recording_session
  FOR EACH ROW
  EXECUTE FUNCTION notify_recording_created();

-- 7. AI Job Status Trigger (for detailed job tracking)
-- Trigger when AI jobs change status
CREATE OR REPLACE FUNCTION notify_ai_job_update()
RETURNS TRIGGER AS $$
DECLARE
  session_data RECORD;
BEGIN
  -- Get session details for context
  SELECT rs.user_id, rs.display_name
  INTO session_data
  FROM andi_web_recording_session rs
  WHERE rs.session_id = NEW.session_id;
  
  -- Only notify on status or progress changes
  IF (OLD.status IS DISTINCT FROM NEW.status) OR 
     (OLD.progress IS DISTINCT FROM NEW.progress) THEN
    
    PERFORM pg_notify(
      'ai_job_update',
      json_build_object(
        'jobId', NEW.id,
        'sessionId', NEW.session_id,
        'userId', session_data.user_id,
        'displayName', session_data.display_name,
        'jobType', NEW.job_type,
        'status', NEW.status,
        'progress', NEW.progress,
        'externalId', NEW.external_id,
        'errorMessage', NEW.error_message,
        'result', NEW.result,
        'updatedAt', extract(epoch from NEW.updated_at) * 1000,
        'eventType', 'ai_job_update'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for AI jobs
CREATE TRIGGER ai_job_update_trigger
  AFTER UPDATE ON andi_web_ai_job
  FOR EACH ROW
  EXECUTE FUNCTION notify_ai_job_update();

-- 8. Create indexes for better trigger performance
CREATE INDEX IF NOT EXISTS idx_recording_session_user_updated 
  ON andi_web_recording_session(user_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_processing_queue_session_updated 
  ON andi_web_processing_queue(session_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_notification_user_created 
  ON andi_web_notification(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_job_session_updated 
  ON andi_web_ai_job(session_id, updated_at);

-- 9. Create a function to manually test notifications
CREATE OR REPLACE FUNCTION test_websocket_notification(
  user_id_param VARCHAR,
  message_param TEXT DEFAULT 'Test message'
)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_notify(
    'test_notification',
    json_build_object(
      'userId', user_id_param,
      'message', message_param,
      'timestamp', extract(epoch from NOW()) * 1000,
      'eventType', 'test'
    )::text
  );
END;
$$ LANGUAGE plpgsql;

-- 10. Add trigger to track trigger execution (for debugging)
CREATE TABLE IF NOT EXISTS andi_web_trigger_log (
  id SERIAL PRIMARY KEY,
  trigger_name VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  payload JSONB
);

CREATE OR REPLACE FUNCTION log_trigger_execution(
  trigger_name_param VARCHAR,
  table_name_param VARCHAR,
  operation_param VARCHAR,
  user_id_param VARCHAR DEFAULT NULL,
  session_id_param VARCHAR DEFAULT NULL,
  payload_param JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO andi_web_trigger_log (
    trigger_name,
    table_name,
    operation,
    user_id,
    session_id,
    notification_sent,
    payload
  ) VALUES (
    trigger_name_param,
    table_name_param,
    operation_param,
    user_id_param,
    session_id_param,
    TRUE,
    payload_param
  );
END;
$$ LANGUAGE plpgsql;

-- Add logging to existing triggers (modify progress update trigger as example)
CREATE OR REPLACE FUNCTION notify_progress_update()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSONB;
BEGIN
  -- Only notify if progress actually changed or stage changed
  IF (OLD.processing_progress IS DISTINCT FROM NEW.processing_progress) OR 
     (OLD.processing_stage IS DISTINCT FROM NEW.processing_stage) OR
     (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    notification_payload := json_build_object(
      'sessionId', NEW.session_id,
      'userId', NEW.user_id,
      'displayName', NEW.display_name,
      'progress', NEW.processing_progress,
      'stage', NEW.processing_stage,
      'status', NEW.status,
      'sourceType', NEW.source_type,
      'updatedAt', extract(epoch from NEW.updated_at) * 1000,
      'eventType', 'progress_update'
    );
    
    PERFORM pg_notify('recording_progress_update', notification_payload::text);
    
    -- Log the trigger execution
    PERFORM log_trigger_execution(
      'notify_progress_update',
      'andi_web_recording_session',
      'UPDATE',
      NEW.user_id,
      NEW.session_id,
      notification_payload
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;