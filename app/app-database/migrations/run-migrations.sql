-- Migration management for ANDI Database
-- This file manages database schema versions and migrations

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Function to check if a migration has been applied
CREATE OR REPLACE FUNCTION migration_applied(migration_version VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.schema_migrations 
        WHERE version = migration_version
    );
END;
$$ LANGUAGE plpgsql;

-- Function to record a migration as applied
CREATE OR REPLACE FUNCTION record_migration(migration_version VARCHAR(255), migration_description TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.schema_migrations (version, description)
    VALUES (migration_version, migration_description)
    ON CONFLICT (version) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Record initial schema as migration v1.0.0
SELECT record_migration('v1.0.0', 'Initial ANDI database schema with all core tables');

-- Example: Apply future migrations conditionally
-- DO $$
-- BEGIN
--     IF NOT migration_applied('v1.1.0') THEN
--         -- Apply migration v1.1.0 changes here
--         ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
--         SELECT record_migration('v1.1.0', 'Added timezone column to users table');
--     END IF;
-- END $$;