/**
 * Enhanced ANDI Database Client
 * SQL-first approach with enterprise features from app-database
 * Supports both local PostgreSQL and Azure PostgreSQL
 */

import { Pool, PoolClient, QueryResult } from 'pg';

class DatabaseConnection {
    private pool: Pool | null = null;
    private isConnected = false;

    /**
     * Initialize database connection pool
     */
    async initialize(): Promise<Pool> {
        try {
            const config = this.getConnectionConfig();
            
            this.pool = new Pool(config);

            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();

            this.isConnected = true;
            console.log('✓ Database connection established successfully');
            
            // Set up connection event handlers
            this.setupEventHandlers();
            
            return this.pool;
        } catch (error) {
            console.error('✗ Failed to connect to database:', error);
            throw error;
        }
    }

    /**
     * Get connection configuration based on environment
     */
    private getConnectionConfig() {
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
                max: parseInt(process.env.DB_POOL_MAX || '20'),
                idleTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
                connectionTimeoutMillis: 5000,
                application_name: 'andi-web-app'
            };
        } else {
            // Local development with DATABASE_URL
            const databaseUrl = process.env.DATABASE_URL || 'postgresql://andi_user:andi_dev_password@localhost:5432/andi_db';
            return {
                connectionString: databaseUrl,
                min: parseInt(process.env.DB_POOL_MIN || '2'),
                max: parseInt(process.env.DB_POOL_MAX || '20'),
                idleTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
                connectionTimeoutMillis: 2000,
                ssl: isProduction ? { rejectUnauthorized: false } : false,
                application_name: 'andi-web-app-dev'
            };
        }
    }

    /**
     * Set up connection pool event handlers
     */
    private setupEventHandlers(): void {
        if (!this.pool) return;

        this.pool.on('connect', () => {
            if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DB) {
                console.log('New database client connected');
            }
        });

        this.pool.on('error', (err) => {
            console.error('Database pool error:', err);
        });

        this.pool.on('remove', () => {
            if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DB) {
                console.log('Database client removed from pool');
            }
        });
    }

    /**
     * Execute a query with parameters (SQL injection protected)
     */
    async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
        if (!this.isConnected || !this.pool) {
            // Auto-initialize if not connected
            await this.initialize();
        }

        const start = Date.now();
        try {
            const result = await this.pool!.query<T>(text, params);
            const duration = Date.now() - start;
            
            // Log slow queries in development
            if (process.env.NODE_ENV === 'development' && duration > 100) {
                console.log(`Slow query (${duration}ms):`, text.substring(0, 100));
            }
            
            return result;
        } catch (error) {
            console.error('Query error:', error);
            console.error('Query:', text);
            console.error('Params:', params);
            throw error;
        }
    }

    /**
     * Get a client from the pool for transactions
     */
    async getClient(): Promise<PoolClient> {
        if (!this.isConnected || !this.pool) {
            await this.initialize();
        }
        return await this.pool!.connect();
    }

    /**
     * Execute a transaction
     */
    async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Health check - verify database connectivity
     */
    async healthCheck() {
        try {
            const result = await this.query('SELECT NOW() as current_time, version() as pg_version');
            return {
                status: 'healthy' as const,
                timestamp: result.rows[0].current_time,
                version: result.rows[0].pg_version,
                pool_total: this.pool?.totalCount || 0,
                pool_idle: this.pool?.idleCount || 0,
                pool_waiting: this.pool?.waitingCount || 0
            };
        } catch (error) {
            return {
                status: 'unhealthy' as const,
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
            console.log('Database connection pool closed');
        }
    }

    /**
     * Get connection statistics
     */
    getStats() {
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
}

// Singleton instance
const dbConnection = new DatabaseConnection();

// Helper functions for common query patterns
export async function query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    return dbConnection.query<T>(text, params);
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
    const result = await dbConnection.query<T>(text, params);
    return result.rows[0] || null;
}

export async function queryMany<T = any>(text: string, params: any[] = []): Promise<T[]> {
    const result = await dbConnection.query<T>(text, params);
    return result.rows;
}

export async function queryExists(text: string, params: any[] = []): Promise<boolean> {
    const result = await dbConnection.query<{ exists: boolean }>(`SELECT EXISTS(${text}) as exists`, params);
    return result.rows[0]?.exists || false;
}

export async function queryCount(text: string, params: any[] = []): Promise<number> {
    const result = await dbConnection.query<{ count: string }>(`SELECT COUNT(*) as count FROM (${text}) as subquery`, params);
    return parseInt(result.rows[0]?.count || '0', 10);
}

export const transaction = dbConnection.transaction.bind(dbConnection);
export const healthCheck = dbConnection.healthCheck.bind(dbConnection);
export const close = dbConnection.close.bind(dbConnection);

/**
 * Check if database is connected
 */
export async function isConnected(): Promise<boolean> {
    try {
        await query('SELECT 1');
        return true;
    } catch {
        return false;
    }
}

// Helper to convert JS Date to PostgreSQL timestamp
export function toTimestamp(date: Date): string {
  return date.toISOString();
}

// Helper to convert camelCase to snake_case for queries
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Helper to convert snake_case to camelCase for results
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// SQL template tag for better syntax highlighting and safety
export function sql(strings: TemplateStringsArray, ...values: any[]): { text: string; values: any[] } {
  let text = strings[0];
  const queryValues: any[] = [];
  
  for (let i = 0; i < values.length; i++) {
    queryValues.push(values[i]);
    text += `$${i + 1}${strings[i + 1]}`;
  }
  
  return { text, values: queryValues };
}

// Main exports
export { dbConnection };
export const db = dbConnection;

// Initialize connection on first import
let initPromise: Promise<Pool> | null = null;

export async function ensureConnection(): Promise<Pool> {
    if (!initPromise) {
        initPromise = dbConnection.initialize();
    }
    return initPromise;
}

// Export for backward compatibility
export default db;