/**
 * CIQ Data Extractor - Extract CIQ session data from PostgreSQL
 */

import { Pool } from 'pg';
import { format } from 'date-fns';
import { CIQSessionRaw, DatabaseConfig, ETLResult } from '../types';
import { Logger } from '../utils/logger';
import { retry } from '../utils/retry';

export class CIQExtractor {
  private pool: Pool;
  private logger: Logger;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    this.logger = new Logger('CIQExtractor');
  }

  /**
   * Extract CIQ sessions for a specific date range
   */
  @retry({ maxAttempts: 3, delayMs: 1000 })
  async extractCIQSessions(startDate: Date, endDate?: Date): Promise<CIQSessionRaw[]> {
    const end = endDate || new Date();
    this.logger.info(`Extracting CIQ sessions from ${format(startDate, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`);

    const query = `
      SELECT 
        s.id as session_id,
        s.teacher_id,
        tp.school_id,
        sc.district_id,
        DATE(s.recorded_at) as session_date,
        s.recorded_at as session_timestamp,
        EXTRACT(EPOCH FROM (s.ended_at - s.recorded_at))::integer as duration_seconds,
        COALESCE(m.equity_score, 0) as equity_score,
        COALESCE(m.wait_time_avg, 0) as wait_time_avg,
        COALESCE(m.student_engagement, 0) as student_engagement,
        COALESCE(m.overall_score, 0) as overall_score,
        COALESCE(m.student_talk_time, 0) as student_talk_time,
        COALESCE(m.teacher_talk_time, 0) as teacher_talk_time,
        COALESCE(m.silence_time, 0) as silence_time,
        COALESCE(m.question_count, 0) as question_count,
        COALESCE(m.response_count, 0) as response_count,
        s.created_at
      FROM audio.audio_sessions s
      LEFT JOIN analytics.ciq_metrics m ON s.id = m.session_id
      LEFT JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
      LEFT JOIN core.schools sc ON tp.school_id = sc.id
      WHERE s.recorded_at >= $1 
        AND s.recorded_at < $2
        AND s.status = 'completed'
        AND m.id IS NOT NULL
      ORDER BY s.recorded_at ASC
    `;

    try {
      const client = await this.pool.connect();
      const result = await client.query(query, [startDate, end]);
      client.release();

      this.logger.info(`Extracted ${result.rows.length} CIQ sessions`);
      return result.rows as CIQSessionRaw[];
    } catch (error) {
      this.logger.error(`Failed to extract CIQ sessions: ${error}`);
      throw error;
    }
  }

  /**
   * Extract CIQ sessions for a specific teacher
   */
  async extractTeacherCIQSessions(teacherId: string, startDate: Date, endDate?: Date): Promise<CIQSessionRaw[]> {
    const end = endDate || new Date();
    this.logger.info(`Extracting CIQ sessions for teacher ${teacherId}`);

    const query = `
      SELECT 
        s.id as session_id,
        s.teacher_id,
        tp.school_id,
        sc.district_id,
        DATE(s.recorded_at) as session_date,
        s.recorded_at as session_timestamp,
        EXTRACT(EPOCH FROM (s.ended_at - s.recorded_at))::integer as duration_seconds,
        m.equity_score,
        m.wait_time_avg,
        m.student_engagement,
        m.overall_score,
        m.student_talk_time,
        m.teacher_talk_time,
        m.silence_time,
        m.question_count,
        m.response_count,
        s.created_at
      FROM audio.audio_sessions s
      JOIN analytics.ciq_metrics m ON s.id = m.session_id
      JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
      JOIN core.schools sc ON tp.school_id = sc.id
      WHERE s.teacher_id = $1
        AND s.recorded_at >= $2 
        AND s.recorded_at < $3
        AND s.status = 'completed'
      ORDER BY s.recorded_at ASC
    `;

    try {
      const client = await this.pool.connect();
      const result = await client.query(query, [teacherId, startDate, end]);
      client.release();

      this.logger.info(`Extracted ${result.rows.length} CIQ sessions for teacher ${teacherId}`);
      return result.rows as CIQSessionRaw[];
    } catch (error) {
      this.logger.error(`Failed to extract teacher CIQ sessions: ${error}`);
      throw error;
    }
  }

  /**
   * Extract incremental CIQ sessions (based on created_at timestamp)
   */
  async extractIncrementalCIQSessions(lastSyncTimestamp: Date): Promise<CIQSessionRaw[]> {
    this.logger.info(`Extracting incremental CIQ sessions since ${lastSyncTimestamp.toISOString()}`);

    const query = `
      SELECT 
        s.id as session_id,
        s.teacher_id,
        tp.school_id,
        sc.district_id,
        DATE(s.recorded_at) as session_date,
        s.recorded_at as session_timestamp,
        EXTRACT(EPOCH FROM (s.ended_at - s.recorded_at))::integer as duration_seconds,
        m.equity_score,
        m.wait_time_avg,
        m.student_engagement,
        m.overall_score,
        m.student_talk_time,
        m.teacher_talk_time,
        m.silence_time,
        m.question_count,
        m.response_count,
        s.created_at
      FROM audio.audio_sessions s
      JOIN analytics.ciq_metrics m ON s.id = m.session_id
      JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
      JOIN core.schools sc ON tp.school_id = sc.id
      WHERE (s.created_at > $1 OR m.created_at > $1)
        AND s.status = 'completed'
      ORDER BY s.created_at ASC
    `;

    try {
      const client = await this.pool.connect();
      const result = await client.query(query, [lastSyncTimestamp]);
      client.release();

      this.logger.info(`Extracted ${result.rows.length} incremental CIQ sessions`);
      return result.rows as CIQSessionRaw[];
    } catch (error) {
      this.logger.error(`Failed to extract incremental CIQ sessions: ${error}`);
      throw error;
    }
  }

  /**
   * Get the latest sync timestamp from the source
   */
  async getLatestCIQTimestamp(): Promise<Date | null> {
    const query = `
      SELECT MAX(GREATEST(s.created_at, s.updated_at, m.created_at, m.updated_at)) as latest_timestamp
      FROM audio.audio_sessions s
      JOIN analytics.ciq_metrics m ON s.id = m.session_id
      WHERE s.status = 'completed'
    `;

    try {
      const client = await this.pool.connect();
      const result = await client.query(query);
      client.release();

      const timestamp = result.rows[0]?.latest_timestamp;
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      this.logger.error(`Failed to get latest CIQ timestamp: ${error}`);
      return null;
    }
  }

  /**
   * Get CIQ data statistics
   */
  async getCIQStats(startDate?: Date, endDate?: Date): Promise<{
    totalSessions: number;
    totalTeachers: number;
    totalSchools: number;
    avgOverallScore: number;
    dateRange: { start: string; end: string };
  }> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const end = endDate || new Date();

    const query = `
      SELECT 
        COUNT(s.id) as total_sessions,
        COUNT(DISTINCT s.teacher_id) as total_teachers,
        COUNT(DISTINCT tp.school_id) as total_schools,
        ROUND(AVG(m.overall_score), 2) as avg_overall_score
      FROM audio.audio_sessions s
      JOIN analytics.ciq_metrics m ON s.id = m.session_id
      JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
      WHERE s.recorded_at >= $1 
        AND s.recorded_at < $2
        AND s.status = 'completed'
    `;

    try {
      const client = await this.pool.connect();
      const result = await client.query(query, [start, end]);
      client.release();

      const stats = result.rows[0];
      return {
        totalSessions: parseInt(stats.total_sessions) || 0,
        totalTeachers: parseInt(stats.total_teachers) || 0,
        totalSchools: parseInt(stats.total_schools) || 0,
        avgOverallScore: parseFloat(stats.avg_overall_score) || 0,
        dateRange: {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get CIQ stats: ${error}`);
      throw error;
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('CIQ extractor connection pool closed');
  }
}

// CLI functionality for standalone execution
if (require.main === module) {
  const config: DatabaseConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'andi_db',
    user: process.env.POSTGRES_USER || 'andi_user',
    password: process.env.POSTGRES_PASSWORD || 'change_me_in_production'
  };

  const extractor = new CIQExtractor(config);
  
  // Extract last 7 days of CIQ data
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  extractor.extractCIQSessions(startDate)
    .then(sessions => {
      console.log(`Extracted ${sessions.length} CIQ sessions`);
      console.log(JSON.stringify(sessions.slice(0, 3), null, 2)); // Show first 3 sessions
      return extractor.close();
    })
    .catch(error => {
      console.error('Extraction failed:', error);
      process.exit(1);
    });
}