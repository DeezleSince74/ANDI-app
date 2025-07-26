/**
 * Database connection wrapper for ANDI
 * Provides both Drizzle ORM and raw PostgreSQL query access
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "~/server/db/schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  rawConn: postgres.Sql | undefined;
};

// Drizzle connection (for ORM operations)
const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

// Raw PostgreSQL connection (for custom queries and NOTIFY/LISTEN)
const rawConn = globalForDb.rawConn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.rawConn = rawConn;

// Export Drizzle instance
export const db = drizzle(conn, { schema });

// Export raw PostgreSQL client for custom queries
export const rawDb = rawConn;

// Convenience wrapper for raw queries with similar interface to node-postgres
export const query = async (text: string, params?: any[]) => {
  const result = await rawConn(text, params || []);
  return {
    rows: result,
    rowCount: result.length
  };
};

// Export default as Drizzle instance for backward compatibility
export default db;