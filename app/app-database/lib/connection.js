/**
 * Database connection management for ANDI
 * Supports both local PostgreSQL and Azure PostgreSQL
 */

const { Pool } = require('pg');

class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    /**
     * Initialize database connection pool
     */
    async initialize() {
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
            console.error('✗ Failed to connect to database:', error.message);
            throw error;
        }
    }

    /**
     * Get connection configuration based on environment
     */
    getConnectionConfig() {
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
                min: parseInt(process.env.DB_POOL_MIN) || 2,
                max: parseInt(process.env.DB_POOL_MAX) || 10,
                idleTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
                connectionTimeoutMillis: 5000,
                application_name: 'andi-app'
            };
        } else if (process.env.DATABASE_URL) {
            // Use DATABASE_URL if provided
            return {
                connectionString: process.env.DATABASE_URL,
                min: parseInt(process.env.DB_POOL_MIN) || 2,
                max: parseInt(process.env.DB_POOL_MAX) || 10,
                idleTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
                ssl: isProduction ? { rejectUnauthorized: false } : false,
                application_name: 'andi-app'
            };
        } else {
            // Local development configuration
            return {
                host: process.env.POSTGRES_HOST || 'localhost',
                port: parseInt(process.env.POSTGRES_PORT) || 5432,
                database: process.env.POSTGRES_DB || 'andi_db',
                user: process.env.POSTGRES_USER || 'andi_user',
                password: process.env.POSTGRES_PASSWORD || 'andi_dev_password',
                min: parseInt(process.env.DB_POOL_MIN) || 2,
                max: parseInt(process.env.DB_POOL_MAX) || 10,
                idleTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
                application_name: 'andi-app-dev'
            };
        }
    }

    /**
     * Set up connection pool event handlers
     */
    setupEventHandlers() {
        this.pool.on('connect', (client) => {
            console.log('New database client connected');
        });

        this.pool.on('error', (err, client) => {
            console.error('Database pool error:', err);
        });

        this.pool.on('remove', (client) => {
            console.log('Database client removed from pool');
        });
    }

    /**
     * Execute a query with parameters
     */
    async query(text, params = []) {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call initialize() first.');
        }

        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`Query executed in ${duration}ms:`, text.substring(0, 100));
            }
            
            return result;
        } catch (error) {
            console.error('Query error:', error.message);
            console.error('Query:', text);
            throw error;
        }
    }

    /**
     * Get a client from the pool for transactions
     */
    async getClient() {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call initialize() first.');
        }
        return await this.pool.connect();
    }

    /**
     * Execute a transaction
     */
    async transaction(callback) {
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
                status: 'healthy',
                timestamp: result.rows[0].current_time,
                version: result.rows[0].pg_version,
                pool_total: this.pool.totalCount,
                pool_idle: this.pool.idleCount,
                pool_waiting: this.pool.waitingCount
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Close all connections
     */
    async close() {
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

module.exports = {
    DatabaseConnection,
    db: dbConnection
};