/**
 * Processing Queue System for ANDI Recordings
 * Handles background processing of audio files with priority and retry logic
 */

import { query as db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getWebSocketManager } from '@/app/api/ws/route';

export interface QueueItem {
  id: string;
  sessionId: string;
  userId: string;
  queuePosition: number;
  priority: 'high' | 'normal' | 'low';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessingStage {
  stage: 'pending' | 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  estimatedTimeRemaining?: number; // seconds
}

export class ProcessingQueue {
  private static instance: ProcessingQueue;
  private isProcessing = false;
  private readonly maxConcurrentJobs = 3;
  private activeJobs = new Set<string>();
  private wsManager: any; // WebSocket manager instance

  static getInstance(): ProcessingQueue {
    if (!ProcessingQueue.instance) {
      ProcessingQueue.instance = new ProcessingQueue();
    }
    return ProcessingQueue.instance;
  }

  constructor() {
    // Initialize WebSocket manager
    try {
      this.wsManager = getWebSocketManager();
    } catch (error) {
      // WebSocket manager might not be available in all environments
      logger.warn('WebSocket manager not available', { error });
      this.wsManager = null;
    }
  }

  /**
   * Emit WebSocket event to user's connections
   */
  private emitToUser(userId: string, eventType: string, data: any) {
    if (this.wsManager) {
      try {
        this.wsManager.broadcast(userId, {
          type: eventType,
          data,
          timestamp: Date.now()
        });
      } catch (error) {
        logger.error('Failed to emit WebSocket event', { userId, eventType, error });
      }
    }
  }

  /**
   * Add a recording session to the processing queue
   */
  async enqueue(sessionId: string, userId: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<string> {
    try {
      // Get next queue position
      const { rows } = await db.query(`
        SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position
        FROM andi_web_processing_queue
        WHERE status IN ('queued', 'processing')
      `);
      
      const queuePosition = rows[0]?.next_position || 1;
      
      // Insert into queue
      const result = await db.query(`
        INSERT INTO andi_web_processing_queue (
          session_id, user_id, queue_position, priority, status, metadata
        ) VALUES ($1, $2, $3, $4, 'queued', '{}')
        RETURNING id
      `, [sessionId, userId, queuePosition, priority]);

      const queueId = result.rows[0].id;

      // Update recording session with queue ID
      await db.query(`
        UPDATE andi_web_recording_session 
        SET processing_queue_id = $1, processing_stage = 'pending'
        WHERE session_id = $2
      `, [queueId, sessionId]);

      logger.info(`Added session ${sessionId} to processing queue at position ${queuePosition}`);
      
      // Start processing if not already running
      this.startProcessing();
      
      return queueId;
    } catch (error) {
      logger.error('Failed to enqueue recording session', { sessionId, userId, error });
      throw error;
    }
  }

  /**
   * Get queue status for a specific session
   */
  async getQueueStatus(sessionId: string): Promise<QueueItem | null> {
    try {
      const result = await db.query(`
        SELECT * FROM andi_web_processing_queue
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [sessionId]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get queue status', { sessionId, error });
      return null;
    }
  }

  /**
   * Get current queue with position information
   */
  async getCurrentQueue(userId?: string): Promise<QueueItem[]> {
    try {
      const whereClause = userId ? 'WHERE user_id = $1' : '';
      const params = userId ? [userId] : [];
      
      const result = await db.query(`
        SELECT q.*, rs.display_name, rs.duration
        FROM andi_web_processing_queue q
        LEFT JOIN andi_web_recording_session rs ON q.session_id = rs.session_id
        ${whereClause}
        AND q.status IN ('queued', 'processing')
        ORDER BY 
          CASE q.priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            WHEN 'low' THEN 3 
          END,
          q.queue_position ASC
      `, params);

      return result.rows;
    } catch (error) {
      logger.error('Failed to get current queue', { userId, error });
      return [];
    }
  }

  /**
   * Update processing stage and progress
   * Note: WebSocket events are now automatically triggered by PostgreSQL triggers
   */
  async updateProgress(sessionId: string, stage: ProcessingStage): Promise<void> {
    try {
      await db.query(`
        UPDATE andi_web_recording_session 
        SET 
          processing_stage = $1,
          processing_progress = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $3
      `, [stage.stage, stage.progress, sessionId]);

      // Update queue item if in processing state
      if (stage.stage === 'processing') {
        await db.query(`
          UPDATE andi_web_processing_queue
          SET 
            status = 'processing',
            started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
            estimated_completion = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE session_id = $2 AND status = 'queued'
        `, [stage.estimatedTimeRemaining ? new Date(Date.now() + stage.estimatedTimeRemaining * 1000) : null, sessionId]);
      }

      // WebSocket events are automatically triggered by PostgreSQL triggers
      logger.info(`Updated processing progress for session ${sessionId}`, stage);
    } catch (error) {
      logger.error('Failed to update processing progress', { sessionId, stage, error });
      throw error;
    }
  }

  /**
   * Mark a job as completed
   * Note: WebSocket events are now automatically triggered by PostgreSQL triggers
   */
  async markCompleted(sessionId: string): Promise<void> {
    try {
      await db.query(`
        UPDATE andi_web_processing_queue 
        SET 
          status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $1
      `, [sessionId]);

      await db.query(`
        UPDATE andi_web_recording_session 
        SET 
          processing_stage = 'completed',
          processing_progress = 100,
          completed_at = CURRENT_TIMESTAMP,
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $1
      `, [sessionId]);

      this.activeJobs.delete(sessionId);
      
      // Create completion notification (will trigger notification triggers)
      await this.createNotification(sessionId, 'processing_complete', 
        'Recording Analysis Complete', 
        'Your recording has been processed and analysis is ready to view.');

      logger.info(`Marked session ${sessionId} as completed`);
      
      // Continue processing queue
      this.startProcessing();
    } catch (error) {
      logger.error('Failed to mark job as completed', { sessionId, error });
      throw error;
    }
  }

  /**
   * Mark a job as failed with retry logic
   */
  async markFailed(sessionId: string, errorMessage: string): Promise<void> {
    try {
      const result = await db.query(`
        SELECT retry_count, max_retries FROM andi_web_processing_queue
        WHERE session_id = $1
      `, [sessionId]);

      const queueItem = result.rows[0];
      const shouldRetry = queueItem && queueItem.retry_count < queueItem.max_retries;

      if (shouldRetry) {
        // Increment retry count and requeue
        await db.query(`
          UPDATE andi_web_processing_queue 
          SET 
            status = 'queued',
            retry_count = retry_count + 1,
            error_message = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE session_id = $2
        `, [errorMessage, sessionId]);

        await db.query(`
          UPDATE andi_web_recording_session 
          SET 
            processing_stage = 'pending',
            processing_progress = 0,
            error_details = jsonb_build_object('message', $1, 'retry_count', $2),
            updated_at = CURRENT_TIMESTAMP
          WHERE session_id = $3
        `, [errorMessage, queueItem.retry_count + 1, sessionId]);

        logger.warn(`Retrying failed job for session ${sessionId} (attempt ${queueItem.retry_count + 1})`);
      } else {
        // Mark as permanently failed
        await db.query(`
          UPDATE andi_web_processing_queue 
          SET 
            status = 'failed',
            error_message = $1,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE session_id = $2
        `, [errorMessage, sessionId]);

        await db.query(`
          UPDATE andi_web_recording_session 
          SET 
            processing_stage = 'failed',
            status = 'failed',
            error_details = jsonb_build_object('message', $1, 'final_failure', true),
            updated_at = CURRENT_TIMESTAMP
          WHERE session_id = $2
        `, [errorMessage, sessionId]);

        // Create failure notification
        await this.createNotification(sessionId, 'processing_failed',
          'Recording Processing Failed',
          'There was an error processing your recording. Please try uploading again.');

        logger.error(`Permanently failed job for session ${sessionId}: ${errorMessage}`);
      }

      this.activeJobs.delete(sessionId);
      
      // Continue processing queue
      this.startProcessing();
    } catch (error) {
      logger.error('Failed to mark job as failed', { sessionId, errorMessage, error });
      throw error;
    }
  }

  /**
   * Start processing jobs from the queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing || this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get next job from queue
      const result = await db.query(`
        SELECT session_id, user_id FROM andi_web_processing_queue
        WHERE status = 'queued'
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            WHEN 'low' THEN 3 
          END,
          queue_position ASC
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        this.isProcessing = false;
        return;
      }

      const { session_id: sessionId, user_id: userId } = result.rows[0];
      this.activeJobs.add(sessionId);

      // Process the job asynchronously
      this.processRecording(sessionId, userId).catch(error => {
        logger.error('Processing job failed', { sessionId, userId, error });
        this.markFailed(sessionId, error.message);
      });

      // Continue processing if we can handle more jobs
      if (this.activeJobs.size < this.maxConcurrentJobs) {
        this.isProcessing = false;
        setTimeout(() => this.startProcessing(), 1000);
      } else {
        this.isProcessing = false;
      }
    } catch (error) {
      logger.error('Failed to start processing', { error });
      this.isProcessing = false;
    }
  }

  /**
   * Process a single recording (placeholder for actual processing logic)
   */
  private async processRecording(sessionId: string, userId: string): Promise<void> {
    // This would integrate with your existing processing pipeline
    // For now, this is a placeholder that shows the flow
    
    await this.updateProgress(sessionId, {
      stage: 'transcribing',
      progress: 20,
      message: 'Starting transcription...'
    });

    // Simulate transcription process
    await new Promise(resolve => setTimeout(resolve, 5000));

    await this.updateProgress(sessionId, {
      stage: 'analyzing',
      progress: 70,
      message: 'Analyzing classroom dynamics...'
    });

    // Simulate analysis process
    await new Promise(resolve => setTimeout(resolve, 3000));

    await this.markCompleted(sessionId);
  }

  /**
   * Create a notification for the user
   */
  private async createNotification(
    sessionId: string, 
    type: string, 
    title: string, 
    message: string
  ): Promise<void> {
    try {
      const result = await db.query(`
        SELECT user_id, display_name FROM andi_web_recording_session
        WHERE session_id = $1
      `, [sessionId]);

      if (result.rows.length === 0) return;

      const { user_id: userId, display_name: recordingName } = result.rows[0];

      await db.query(`
        INSERT INTO andi_web_notification (
          user_id, session_id, type, title, message, action_url
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId, 
        sessionId, 
        type, 
        title, 
        message.replace('{recordingName}', recordingName || 'Your recording'),
        `/recordings/${sessionId}`
      ]);
    } catch (error) {
      logger.error('Failed to create notification', { sessionId, type, error });
    }
  }
}

export const processingQueue = ProcessingQueue.getInstance();