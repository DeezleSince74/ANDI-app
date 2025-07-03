-- Migration v1.1.0: Example migration template
-- Description: This is an example migration file showing the structure

-- Check if this migration has already been applied
DO $$
BEGIN
    IF NOT migration_applied('v1.1.0') THEN
        
        -- Example: Add a new column to users table
        -- ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
        
        -- Example: Create a new index
        -- CREATE INDEX IF NOT EXISTS idx_users_timezone ON auth.users(timezone);
        
        -- Example: Add a new table
        -- CREATE TABLE IF NOT EXISTS core.user_sessions (
        --     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        --     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        --     session_token VARCHAR(255) NOT NULL,
        --     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        --     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        -- );
        
        -- Record this migration as applied
        PERFORM record_migration('v1.1.0', 'Example migration - add timezone support');
        
        RAISE NOTICE 'Migration v1.1.0 applied successfully';
    ELSE
        RAISE NOTICE 'Migration v1.1.0 already applied, skipping';
    END IF;
END $$;