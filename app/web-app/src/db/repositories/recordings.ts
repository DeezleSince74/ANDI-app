/**
 * Recording Repository
 * Type-safe database operations for recordings
 */

import { query, queryOne, queryMany, transaction, sql } from '../client';
import type { 
  RecordingSession, 
  CreateRecordingSession, 
  UpdateRecordingSession,
  AIJob,
  CreateAIJob,
  UpdateAIJob
} from '../types';

/**
 * Get all recordings for a user
 */
export async function getRecordingsByUser(userId: string): Promise<RecordingSession[]> {
  return queryMany<RecordingSession>(`
    SELECT 
      session_id as "sessionId",
      user_id as "userId",
      title,
      description,
      audio_url as "audioUrl",
      duration,
      status,
      transcript_id as "transcriptId",
      ciq_score as "ciqScore",
      ciq_data as "ciqData",
      coaching_insights as "coachingInsights",
      metadata,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM andi_web_recording_session
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);
}

/**
 * Get a single recording by ID
 */
export async function getRecordingById(sessionId: string): Promise<RecordingSession | null> {
  return queryOne<RecordingSession>(`
    SELECT 
      session_id as "sessionId",
      user_id as "userId",
      title,
      description,
      audio_url as "audioUrl",
      duration,
      status,
      transcript_id as "transcriptId",
      ciq_score as "ciqScore",
      ciq_data as "ciqData",
      coaching_insights as "coachingInsights",
      metadata,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM andi_web_recording_session
    WHERE session_id = $1
  `, [sessionId]);
}

/**
 * Get a single recording by session ID (alias for getRecordingById)
 */
export const getRecordingBySessionId = getRecordingById;

/**
 * Create a new recording session
 */
export async function createRecording(data: CreateRecordingSession): Promise<RecordingSession> {
  const result = await queryOne<RecordingSession>(`
    INSERT INTO andi_web_recording_session (
      session_id, user_id, title, description, audio_url, 
      duration, status, transcript_id, ciq_score, ciq_data, 
      coaching_insights, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING 
      session_id as "sessionId",
      user_id as "userId",
      title,
      description,
      audio_url as "audioUrl",
      duration,
      status,
      transcript_id as "transcriptId",
      ciq_score as "ciqScore",
      ciq_data as "ciqData",
      coaching_insights as "coachingInsights",
      metadata,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, [
    data.sessionId,
    data.userId,
    data.title,
    data.description,
    data.audioUrl,
    data.duration || 0,
    data.status || 'pending',
    data.transcriptId,
    data.ciqScore,
    data.ciqData,
    data.coachingInsights,
    data.metadata || {}
  ]);

  if (!result) {
    throw new Error('Failed to create recording session');
  }

  return result;
}

/**
 * Update a recording session
 */
export async function updateRecording(
  sessionId: string, 
  data: UpdateRecordingSession
): Promise<RecordingSession | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  // Build dynamic update query
  if (data.title !== undefined) {
    updates.push(`title = $${paramCount++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(data.description);
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
  }
  if (data.transcriptId !== undefined) {
    updates.push(`transcript_id = $${paramCount++}`);
    values.push(data.transcriptId);
  }
  if (data.ciqScore !== undefined) {
    updates.push(`ciq_score = $${paramCount++}`);
    values.push(data.ciqScore);
  }
  if (data.ciqData !== undefined) {
    updates.push(`ciq_data = $${paramCount++}`);
    values.push(data.ciqData);
  }
  if (data.coachingInsights !== undefined) {
    updates.push(`coaching_insights = $${paramCount++}`);
    values.push(data.coachingInsights);
  }
  if (data.metadata !== undefined) {
    updates.push(`metadata = $${paramCount++}`);
    values.push(data.metadata);
  }

  // Always update the timestamp
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  if (updates.length === 1) {
    return null; // No fields to update
  }

  values.push(sessionId);

  return queryOne<RecordingSession>(`
    UPDATE andi_web_recording_session
    SET ${updates.join(', ')}
    WHERE session_id = $${paramCount}
    RETURNING 
      session_id as "sessionId",
      user_id as "userId",
      title,
      description,
      audio_url as "audioUrl",
      duration,
      status,
      transcript_id as "transcriptId",
      ciq_score as "ciqScore",
      ciq_data as "ciqData",
      coaching_insights as "coachingInsights",
      metadata,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, values);
}

/**
 * Create an AI job for a recording
 */
export async function createAIJob(data: CreateAIJob): Promise<AIJob> {
  const result = await queryOne<AIJob>(`
    INSERT INTO andi_web_ai_job (
      session_id, user_id, job_type, status, progress,
      external_id, result, error_message, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING 
      id,
      session_id as "sessionId",
      user_id as "userId",
      job_type as "jobType",
      status,
      progress,
      external_id as "externalId",
      result,
      error_message as "errorMessage",
      metadata,
      started_at as "startedAt",
      completed_at as "completedAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, [
    data.sessionId,
    data.userId,
    data.jobType,
    data.status || 'pending',
    data.progress || 0,
    data.externalId,
    data.result,
    data.errorMessage,
    data.metadata || {}
  ]);

  if (!result) {
    throw new Error('Failed to create AI job');
  }

  return result;
}

/**
 * Update an AI job
 */
export async function updateAIJob(
  jobId: string,
  data: UpdateAIJob
): Promise<AIJob | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
    
    // Set timestamps based on status
    if (data.status === 'processing' && !data.startedAt) {
      updates.push(`started_at = CURRENT_TIMESTAMP`);
    } else if ((data.status === 'completed' || data.status === 'failed') && !data.completedAt) {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
    }
  }
  
  if (data.progress !== undefined) {
    updates.push(`progress = $${paramCount++}`);
    values.push(data.progress);
  }
  
  if (data.result !== undefined) {
    updates.push(`result = $${paramCount++}`);
    values.push(data.result);
  }
  
  if (data.errorMessage !== undefined) {
    updates.push(`error_message = $${paramCount++}`);
    values.push(data.errorMessage);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(jobId);

  return queryOne<AIJob>(`
    UPDATE andi_web_ai_job
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING 
      id,
      session_id as "sessionId",
      user_id as "userId",
      job_type as "jobType",
      status,
      progress,
      external_id as "externalId",
      result,
      error_message as "errorMessage",
      metadata,
      started_at as "startedAt",
      completed_at as "completedAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, values);
}

/**
 * Get AI jobs for a session
 */
export async function getAIJobsBySession(sessionId: string): Promise<AIJob[]> {
  return queryMany<AIJob>(`
    SELECT 
      id,
      session_id as "sessionId",
      user_id as "userId",
      job_type as "jobType",
      status,
      progress,
      external_id as "externalId",
      result,
      error_message as "errorMessage",
      metadata,
      started_at as "startedAt",
      completed_at as "completedAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM andi_web_ai_job
    WHERE session_id = $1
    ORDER BY created_at DESC
  `, [sessionId]);
}

/**
 * Get AI job by external ID (e.g., Assembly AI transcript ID)
 */
export async function getAIJobByExternalId(externalId: string): Promise<AIJob | null> {
  return queryOne<AIJob>(`
    SELECT 
      id,
      session_id as "sessionId",
      user_id as "userId",
      job_type as "jobType",
      status,
      progress,
      external_id as "externalId",
      result,
      error_message as "errorMessage",
      metadata,
      started_at as "startedAt",
      completed_at as "completedAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM andi_web_ai_job
    WHERE external_id = $1
  `, [externalId]);
}