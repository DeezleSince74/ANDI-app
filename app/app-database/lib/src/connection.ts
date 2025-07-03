import { Pool, PoolClient, PoolConfig } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from './schema';

/**
 * Type-safe database connection management for ANDI
 * Built with Drizzle ORM for full TypeScript support
 */

// Database instance type
export type AndiDatabase = NodePgDatabase<typeof schema>;

// Health check response type
export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  pool?: {
    total: number;
    idle: number;
    waiting: number;
  };
  error?: string;
}

// Connection statistics
export interface ConnectionStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  isConnected: boolean;
}

class DatabaseConnection {
  private pool: Pool | null = null;
  private db: AndiDatabase | null = null;
  private isConnected = false;

  /**
   * Initialize database connection pool with Drizzle ORM
   */
  async initialize(): Promise<AndiDatabase> {
    try {
      const config = this.getConnectionConfig();
      
      this.pool = new Pool(config);
      this.db = drizzle(this.pool, { schema });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.isConnected = true;
      console.log('✓ Database connection established successfully');
      
      // Set up connection event handlers
      this.setupEventHandlers();
      
      return this.db;
    } catch (error) {
      console.error('✗ Failed to connect to database:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * Get connection configuration based on environment
   */
  private getConnectionConfig(): PoolConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    const isAzure = process.env.AZURE_POSTGRES_HOST;

    if (isProduction && isAzure) {
      // Azure PostgreSQL configuration
      return {
        host: process.env.AZURE_POSTGRES_HOST,
        port: 5432,
        database: process.env.AZURE_POSTGRES_DB,
        user: process.env.AZURE_POSTGRES_USER,
        password: process.env.AZURE_POSTGRES_PASSWORD,
        ssl: {
          rejectUnauthorized: process.env.AZURE_POSTGRES_SSL_MODE === 'require'
        },
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        idleTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
        connectionTimeoutMillis: 5000,
        application_name: 'andi-app'
      };
    } else if (process.env.DATABASE_URL) {
      // Use DATABASE_URL if provided
      return {
        connectionString: process.env.DATABASE_URL,
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        idleTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        application_name: 'andi-app'
      };
    } else {
      // Local development configuration
      return {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'andi_db',
        user: process.env.POSTGRES_USER || 'andi_user',
        password: process.env.POSTGRES_PASSWORD || 'change_me_in_production',
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        idleTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
        application_name: 'andi-app-dev'
      };
    }
  }

  /**
   * Set up connection pool event handlers
   */
  private setupEventHandlers(): void {
    if (!this.pool) return;

    this.pool.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('New database client connected');
      }
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    this.pool.on('remove', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Database client removed from pool');
      }
    });
  }

  /**
   * Get the Drizzle database instance
   */
  getDatabase(): AndiDatabase {
    if (!this.db || !this.isConnected) {
      throw new Error('Database not connected. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Execute a raw SQL query (for cases where Drizzle queries aren't sufficient)
   */
  async query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[] }> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected. Call initialize() first.');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Query executed in ${duration}ms:`, text.substring(0, 100));
      }
      
      return { rows: result.rows };
    } catch (error) {
      console.error('Query error:', error instanceof Error ? error.message : error);
      console.error('Query:', text);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected. Call initialize() first.');
    }
    return await this.pool.connect();
  }

  /**
   * Execute a transaction with Drizzle
   */
  async transaction<T>(callback: (tx: AndiDatabase) => Promise<T>): Promise<T> {
    if (!this.db || !this.isConnected) {
      throw new Error('Database not connected. Call initialize() first.');
    }

    return await this.db.transaction(callback);
  }

  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<DatabaseHealth> {
    try {
      if (!this.pool) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Database pool not initialized'
        };
      }

      const result = await this.query<{ current_time: Date; pg_version: string }>(
        'SELECT NOW() as current_time, version() as pg_version'
      );

      return {
        status: 'healthy',
        timestamp: result.rows[0]?.current_time?.toISOString() || new Date().toISOString(),
        version: result.rows[0]?.pg_version,
        pool: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      this.db = null;
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats | null {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected
    };
  }

  /**
   * Run database migrations (for development/deployment)
   */
  async runMigrations(migrationsFolder = './drizzle'): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected. Call initialize() first.');
    }

    try {
      await migrate(drizzle(this.pool), { migrationsFolder });
      console.log('✓ Database migrations completed successfully');
    } catch (error) {
      console.error('✗ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Set the current user context for RLS policies
   */
  async setUserContext(userId: string): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected. Call initialize() first.');
    }

    await this.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId]);
  }

  /**
   * Clear the current user context
   */
  async clearUserContext(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected. Call initialize() first.');
    }

    await this.query('SELECT set_config($1, $2, true)', ['app.current_user_id', '']);
  }

  /**
   * CIQ Analytics Query Examples - Type-safe analytics queries
   */
  
  /**
   * Get CIQ score trends for a teacher over time
   */
  async getCiqScoreTrends(teacherId: string, startDate: Date, endDate: Date): Promise<{
    session_id: string;
    session_date: Date;
    equity_score: number;
    wait_time_avg: number;
    student_engagement: number;
    overall_score: number;
  }[]> {
    const query = `
      SELECT 
        s.id as session_id,
        s.recorded_at as session_date,
        m.equity_score,
        m.wait_time_avg,
        m.student_engagement,
        m.overall_score
      FROM audio.audio_sessions s
      JOIN analytics.ciq_metrics m ON s.id = m.session_id
      WHERE s.teacher_id = $1 
        AND s.recorded_at BETWEEN $2 AND $3
      ORDER BY s.recorded_at ASC
    `;
    
    const result = await this.query(query, [teacherId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get teacher performance summary with CIQ averages
   */
  async getTeacherPerformanceSummary(teacherId: string): Promise<{
    total_sessions: number;
    avg_equity_score: number;
    avg_wait_time: number;
    avg_student_engagement: number;
    avg_overall_score: number;
    improvement_trend: 'improving' | 'stable' | 'declining';
    last_session_date: Date;
  } | null> {
    const query = `
      SELECT 
        COUNT(s.id) as total_sessions,
        ROUND(AVG(m.equity_score), 2) as avg_equity_score,
        ROUND(AVG(m.wait_time_avg), 2) as avg_wait_time,
        ROUND(AVG(m.student_engagement), 2) as avg_student_engagement,
        ROUND(AVG(m.overall_score), 2) as avg_overall_score,
        MAX(s.recorded_at) as last_session_date,
        CASE 
          WHEN AVG(CASE WHEN s.recorded_at >= NOW() - INTERVAL '30 days' THEN m.overall_score END) > 
               AVG(CASE WHEN s.recorded_at >= NOW() - INTERVAL '60 days' 
                        AND s.recorded_at < NOW() - INTERVAL '30 days' THEN m.overall_score END) 
          THEN 'improving'
          WHEN AVG(CASE WHEN s.recorded_at >= NOW() - INTERVAL '30 days' THEN m.overall_score END) < 
               AVG(CASE WHEN s.recorded_at >= NOW() - INTERVAL '60 days' 
                        AND s.recorded_at < NOW() - INTERVAL '30 days' THEN m.overall_score END) 
          THEN 'declining'
          ELSE 'stable'
        END as improvement_trend
      FROM audio.audio_sessions s
      JOIN analytics.ciq_metrics m ON s.id = m.session_id
      WHERE s.teacher_id = $1
      GROUP BY s.teacher_id
    `;
    
    const result = await this.query(query, [teacherId]);
    return result.rows[0] || null;
  }

  /**
   * Get CIQ benchmark comparison for a teacher vs school/district averages
   */
  async getCiqBenchmarkComparison(teacherId: string): Promise<{
    teacher_avg: number;
    school_avg: number;
    district_avg: number;
    percentile_rank: number;
  } | null> {
    const query = `
      WITH teacher_avg AS (
        SELECT AVG(m.overall_score) as score
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        WHERE s.teacher_id = $1
      ),
      school_avg AS (
        SELECT AVG(m.overall_score) as score
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
        WHERE tp.school_id = (
          SELECT school_id FROM core.teacher_profiles WHERE user_id = $1
        )
      ),
      district_avg AS (
        SELECT AVG(m.overall_score) as score
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
        JOIN core.schools sc ON tp.school_id = sc.id
        WHERE sc.district_id = (
          SELECT sc2.district_id 
          FROM core.teacher_profiles tp2 
          JOIN core.schools sc2 ON tp2.school_id = sc2.id
          WHERE tp2.user_id = $1
        )
      ),
      percentile_rank AS (
        SELECT 
          PERCENT_RANK() OVER (ORDER BY AVG(m.overall_score)) * 100 as percentile
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        WHERE s.teacher_id = $1
        GROUP BY s.teacher_id
      )
      SELECT 
        ROUND(ta.score, 2) as teacher_avg,
        ROUND(sa.score, 2) as school_avg,
        ROUND(da.score, 2) as district_avg,
        ROUND(pr.percentile, 1) as percentile_rank
      FROM teacher_avg ta
      CROSS JOIN school_avg sa
      CROSS JOIN district_avg da
      CROSS JOIN percentile_rank pr
    `;
    
    const result = await this.query(query, [teacherId]);
    return result.rows[0] || null;
  }

  /**
   * Get CIQ insights for coaching recommendations
   */
  async getCiqInsightsForCoaching(teacherId: string): Promise<{
    lowest_scoring_area: string;
    avg_score_in_area: number;
    improvement_opportunity: string;
    recent_trend: 'improving' | 'stable' | 'declining';
    sessions_analyzed: number;
  } | null> {
    const query = `
      WITH recent_sessions AS (
        SELECT 
          s.id,
          s.recorded_at,
          m.equity_score,
          m.wait_time_avg,
          m.student_engagement,
          m.overall_score
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        WHERE s.teacher_id = $1
          AND s.recorded_at >= NOW() - INTERVAL '30 days'
        ORDER BY s.recorded_at DESC
        LIMIT 10
      ),
      area_averages AS (
        SELECT 
          AVG(equity_score) as avg_equity,
          AVG(wait_time_avg) as avg_wait_time,
          AVG(student_engagement) as avg_engagement,
          COUNT(*) as session_count
        FROM recent_sessions
      ),
      lowest_area AS (
        SELECT 
          CASE 
            WHEN avg_equity <= avg_wait_time AND avg_equity <= avg_engagement THEN 'equity_score'
            WHEN avg_wait_time <= avg_engagement THEN 'wait_time'
            ELSE 'student_engagement'
          END as area,
          CASE 
            WHEN avg_equity <= avg_wait_time AND avg_equity <= avg_engagement THEN avg_equity
            WHEN avg_wait_time <= avg_engagement THEN avg_wait_time
            ELSE avg_engagement
          END as score
        FROM area_averages
      ),
      trend_analysis AS (
        SELECT 
          CASE 
            WHEN AVG(CASE WHEN row_number() OVER (ORDER BY recorded_at DESC) <= 5 THEN overall_score END) >
                 AVG(CASE WHEN row_number() OVER (ORDER BY recorded_at DESC) > 5 THEN overall_score END)
            THEN 'improving'
            WHEN AVG(CASE WHEN row_number() OVER (ORDER BY recorded_at DESC) <= 5 THEN overall_score END) <
                 AVG(CASE WHEN row_number() OVER (ORDER BY recorded_at DESC) > 5 THEN overall_score END)
            THEN 'declining'
            ELSE 'stable'
          END as trend
        FROM recent_sessions
      )
      SELECT 
        la.area as lowest_scoring_area,
        ROUND(la.score, 2) as avg_score_in_area,
        CASE 
          WHEN la.area = 'equity_score' THEN 'Focus on equitable student participation and response distribution'
          WHEN la.area = 'wait_time' THEN 'Practice extending wait time to allow for deeper student thinking'
          ELSE 'Work on strategies to increase student engagement and active participation'
        END as improvement_opportunity,
        ta.trend as recent_trend,
        aa.session_count as sessions_analyzed
      FROM lowest_area la
      CROSS JOIN area_averages aa
      CROSS JOIN trend_analysis ta
    `;
    
    const result = await this.query(query, [teacherId]);
    return result.rows[0] || null;
  }

  /**
   * Get district-wide CIQ analytics dashboard data
   */
  async getDistrictCiqDashboard(districtId: string): Promise<{
    total_teachers: number;
    total_sessions: number;
    district_avg_score: number;
    top_performing_schools: Array<{
      school_name: string;
      avg_score: number;
      teacher_count: number;
    }>;
    improvement_areas: Array<{
      area: string;
      avg_score: number;
      teachers_below_target: number;
    }>;
  }> {
    const query = `
      WITH district_stats AS (
        SELECT 
          COUNT(DISTINCT tp.user_id) as total_teachers,
          COUNT(DISTINCT s.id) as total_sessions,
          ROUND(AVG(m.overall_score), 2) as district_avg_score
        FROM core.teacher_profiles tp
        JOIN core.schools sc ON tp.school_id = sc.id
        JOIN audio.audio_sessions s ON tp.user_id = s.teacher_id
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        WHERE sc.district_id = $1
      ),
      school_performance AS (
        SELECT 
          sc.name as school_name,
          ROUND(AVG(m.overall_score), 2) as avg_score,
          COUNT(DISTINCT tp.user_id) as teacher_count
        FROM core.schools sc
        JOIN core.teacher_profiles tp ON sc.id = tp.school_id
        JOIN audio.audio_sessions s ON tp.user_id = s.teacher_id
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        WHERE sc.district_id = $1
        GROUP BY sc.id, sc.name
        ORDER BY avg_score DESC
        LIMIT 5
      ),
      improvement_areas AS (
        SELECT 
          'Equity Score' as area,
          ROUND(AVG(m.equity_score), 2) as avg_score,
          COUNT(DISTINCT CASE WHEN m.equity_score < 75 THEN s.teacher_id END) as teachers_below_target
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
        JOIN core.schools sc ON tp.school_id = sc.id
        WHERE sc.district_id = $1
        
        UNION ALL
        
        SELECT 
          'Wait Time' as area,
          ROUND(AVG(m.wait_time_avg), 2) as avg_score,
          COUNT(DISTINCT CASE WHEN m.wait_time_avg < 75 THEN s.teacher_id END) as teachers_below_target
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
        JOIN core.schools sc ON tp.school_id = sc.id
        WHERE sc.district_id = $1
        
        UNION ALL
        
        SELECT 
          'Student Engagement' as area,
          ROUND(AVG(m.student_engagement), 2) as avg_score,
          COUNT(DISTINCT CASE WHEN m.student_engagement < 75 THEN s.teacher_id END) as teachers_below_target
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        JOIN core.teacher_profiles tp ON s.teacher_id = tp.user_id
        JOIN core.schools sc ON tp.school_id = sc.id
        WHERE sc.district_id = $1
      )
      SELECT 
        ds.total_teachers,
        ds.total_sessions,
        ds.district_avg_score,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'school_name', school_name,
            'avg_score', avg_score,
            'teacher_count', teacher_count
          )) FROM school_performance),
          '[]'::json
        ) as top_performing_schools,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'area', area,
            'avg_score', avg_score,
            'teachers_below_target', teachers_below_target
          )) FROM improvement_areas),
          '[]'::json
        ) as improvement_areas
      FROM district_stats ds
    `;
    
    const result = await this.query(query, [districtId]);
    const row = result.rows[0];
    
    if (!row) {
      return {
        total_teachers: 0,
        total_sessions: 0,
        district_avg_score: 0,
        top_performing_schools: [],
        improvement_areas: []
      };
    }
    
    return {
      total_teachers: row.total_teachers,
      total_sessions: row.total_sessions,
      district_avg_score: row.district_avg_score,
      top_performing_schools: Array.isArray(row.top_performing_schools) ? row.top_performing_schools : [],
      improvement_areas: Array.isArray(row.improvement_areas) ? row.improvement_areas : []
    };
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

export { DatabaseConnection, dbConnection };
export default dbConnection;