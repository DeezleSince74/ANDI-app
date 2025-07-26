#!/usr/bin/env tsx

/**
 * ANDI Database Migration Script
 * Enhanced with comprehensive schema from app-database integration
 * Applies SQL files in correct order with dependency management
 */

import fs from 'fs/promises';
import path from 'path';
import { db, ensureConnection } from './client';

const SCHEMA_DIR = path.join(__dirname, 'schema');

// Migration files in dependency order
// Note: Some files are synced from app-database automatically
const MIGRATION_FILES = [
  '000_extensions_and_types.sql',
  '001_initial_schema.sql',
  '002_recordings_schema.sql', 
  '100_comprehensive_schema.sql',
  '200_app_database_comprehensive.sql' // Auto-synced from app-database
];

interface Migration {
  version: string;
  name: string;
  sql: string;
}

async function runMigration(filename: string): Promise<void> {
  console.log(`📋 Running migration: ${filename}`);
  
  try {
    const filePath = path.join(SCHEMA_DIR, filename);
    const sql = await fs.readFile(filePath, 'utf-8');
    
    // Execute the entire file as one statement to handle DO blocks correctly
    await db.query(sql);
    
    console.log(`✅ Successfully applied: ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to apply migration ${filename}:`, error);
    throw error;
  }
}

async function checkMigrationStatus(): Promise<void> {
  console.log('🔍 Checking current database state...');
  
  try {
    const healthCheck = await db.healthCheck();
    console.log(`📊 Database Status: ${healthCheck.status}`);
    console.log(`📊 PostgreSQL Version: ${healthCheck.version}`);
    console.log(`📊 Pool Stats: ${healthCheck.pool_total} total, ${healthCheck.pool_idle} idle`);
    
    // Check if migrations tracking table exists
    const hasMigrationsTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);
    
    if (!hasMigrationsTable.rows[0].exists) {
      console.log('📋 Creating schema_migrations tracking table...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          checksum VARCHAR(64)
        );
      `);
    }
    
    // Check which migrations have been applied
    const appliedMigrations = await db.query(`
      SELECT filename FROM schema_migrations ORDER BY applied_at;
    `);
    
    console.log(`📋 Applied migrations: ${appliedMigrations.rowCount}`);
    appliedMigrations.rows.forEach(row => {
      console.log(`  ✅ ${row.filename}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
    throw error;
  }
}

async function recordMigration(filename: string): Promise<void> {
  try {
    // Generate simple checksum
    const filePath = path.join(SCHEMA_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const checksum = Buffer.from(content).toString('base64').slice(0, 64);
    
    await db.query(`
      INSERT INTO schema_migrations (filename, checksum) 
      VALUES ($1, $2) 
      ON CONFLICT (filename) DO UPDATE SET 
        applied_at = CURRENT_TIMESTAMP,
        checksum = EXCLUDED.checksum;
    `, [filename, checksum]);
    
    console.log(`📝 Recorded migration: ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to record migration ${filename}:`, error);
    throw error;
  }
}

async function runAllMigrations(): Promise<void> {
  console.log('🚀 Starting ANDI database migrations...');
  
  try {
    // Ensure database connection
    await ensureConnection();
    
    // Check current state
    await checkMigrationStatus();
    
    // Get list of applied migrations
    const appliedResult = await db.query(`
      SELECT filename FROM schema_migrations;
    `);
    const appliedMigrations = new Set(appliedResult.rows.map(row => row.filename));
    
    // Run pending migrations
    let migrationsRun = 0;
    for (const filename of MIGRATION_FILES) {
      if (!appliedMigrations.has(filename)) {
        await runMigration(filename);
        await recordMigration(filename);
        migrationsRun++;
      } else {
        console.log(`⏭️  Skipping already applied: ${filename}`);
      }
    }
    
    if (migrationsRun === 0) {
      console.log('✨ All migrations are up to date!');
    } else {
      console.log(`✅ Successfully applied ${migrationsRun} migrations!`);
    }
    
    // Final health check
    const finalHealth = await db.healthCheck();
    console.log(`\n📊 Final Database Status: ${finalHealth.status}`);
    
    // Show some key tables
    console.log('\n📋 Key tables created:');
    const tables = await db.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname IN ('public', 'auth', 'core', 'analytics', 'community', 'gamification')
      ORDER BY schemaname, tablename;
    `);
    
    const tablesBySchema: Record<string, string[]> = {};
    tables.rows.forEach(row => {
      if (!tablesBySchema[row.schemaname]) {
        tablesBySchema[row.schemaname] = [];
      }
      tablesBySchema[row.schemaname].push(row.tablename);
    });
    
    Object.entries(tablesBySchema).forEach(([schema, tableNames]) => {
      console.log(`  📁 ${schema}: ${tableNames.length} tables`);
      tableNames.slice(0, 5).forEach(table => {
        console.log(`    📄 ${table}`);
      });
      if (tableNames.length > 5) {
        console.log(`    ... and ${tableNames.length - 5} more`);
      }
    });
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

async function resetDatabase(): Promise<void> {
  console.log('⚠️  RESETTING DATABASE - This will delete all data!');
  
  try {
    await ensureConnection();
    
    // Drop all schemas and recreate
    console.log('🗑️  Dropping existing schemas...');
    await db.query('DROP SCHEMA IF EXISTS auth CASCADE;');
    await db.query('DROP SCHEMA IF EXISTS core CASCADE;');
    await db.query('DROP SCHEMA IF EXISTS analytics CASCADE;');
    await db.query('DROP SCHEMA IF EXISTS community CASCADE;');
    await db.query('DROP SCHEMA IF EXISTS gamification CASCADE;');
    
    // Drop public tables
    await db.query(`
      DROP TABLE IF EXISTS schema_migrations CASCADE;
      DROP TABLE IF EXISTS andi_web_user CASCADE;
      DROP TABLE IF EXISTS andi_web_account CASCADE;
      DROP TABLE IF EXISTS andi_web_session CASCADE;
      DROP TABLE IF EXISTS andi_web_recording_session CASCADE;
      DROP TABLE IF EXISTS andi_web_ai_job CASCADE;
    `);
    
    console.log('✅ Database reset complete');
    
    // Run migrations from scratch
    await runAllMigrations();
    
  } catch (error) {
    console.error('💥 Database reset failed:', error);
    process.exit(1);
  }
}

// CLI handling
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'reset':
      await resetDatabase();
      break;
    case 'status':
      await ensureConnection();
      await checkMigrationStatus();
      break;
    default:
      await runAllMigrations();
      break;
  }
  
  await db.close();
  process.exit(0);
}

// Export functions for programmatic use
export const migrate = runAllMigrations;
export { runAllMigrations, resetDatabase, checkMigrationStatus };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
}