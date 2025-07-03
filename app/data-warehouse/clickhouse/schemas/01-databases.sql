-- ANDI Data Warehouse - Database and Schema Setup
-- ClickHouse database and schema initialization

-- Create main warehouse database
CREATE DATABASE IF NOT EXISTS andi_warehouse;

-- Use the warehouse database
USE andi_warehouse;

-- Create schemas for logical data organization
-- Note: ClickHouse doesn't have schemas like PostgreSQL, so we use naming conventions

-- Comment on database structure:
-- facts_*     : High-volume transactional fact tables
-- dims_*      : Dimension/reference tables  
-- agg_*       : Pre-computed aggregation tables
-- mv_*        : Materialized views
-- staging_*   : Temporary staging tables for ETL

-- Create settings for optimal performance
SET allow_experimental_object_type = 1;
SET allow_experimental_variant_type = 1;

-- Enable query profiling for monitoring
SET log_queries = 1;
SET log_query_threads = 1;

-- Configure compression settings
SET network_compression_method = 'lz4';

-- Show database info
SELECT 
    'Database created successfully' as status,
    name as database_name,
    engine,
    formatReadableSize(total_bytes) as size
FROM system.databases 
WHERE name = 'andi_warehouse';

-- Create custom data types for ANDI
-- Note: ClickHouse has limited ENUM support, we'll use String with constraints where needed

-- Performance optimization settings for the session
SET max_memory_usage = 10000000000;
SET max_threads = 8;
SET max_execution_time = 300;

-- Create a simple test table to verify setup
CREATE TABLE IF NOT EXISTS test_connection
(
    id UInt64,
    message String,
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY id;

-- Insert test record
INSERT INTO test_connection (id, message) VALUES (1, 'ANDI Data Warehouse initialized successfully');

-- Show test result
SELECT * FROM test_connection;

-- Log setup completion
SELECT 
    'ANDI Data Warehouse setup completed' as status,
    now() as timestamp;