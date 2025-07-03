/**
 * ANDI Database Library - Main Export
 * Type-safe database access using Drizzle ORM
 */

// Main database connection
export { dbConnection as default, DatabaseConnection } from './connection';
export type { AndiDatabase, DatabaseHealth, ConnectionStats } from './connection';

// All schema exports
export * from './schema';

// Convenience re-exports for common operations
export { dbConnection } from './connection';