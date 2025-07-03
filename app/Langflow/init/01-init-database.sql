-- ANDI Langflow Database Initialization
-- Sets up the Langflow database with proper configuration

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema for ANDI-specific Langflow components
CREATE SCHEMA IF NOT EXISTS andi_flows;

-- Grant permissions
GRANT USAGE ON SCHEMA andi_flows TO langflow_user;
GRANT CREATE ON SCHEMA andi_flows TO langflow_user;

-- Create table for ANDI flow metadata
CREATE TABLE IF NOT EXISTS andi_flows.flow_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL,
    flow_name VARCHAR(255) NOT NULL,
    flow_category VARCHAR(100) NOT NULL,
    andi_use_case VARCHAR(100) NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    configuration JSONB,
    performance_metrics JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flow_metadata_flow_id ON andi_flows.flow_metadata(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_metadata_category ON andi_flows.flow_metadata(flow_category);
CREATE INDEX IF NOT EXISTS idx_flow_metadata_use_case ON andi_flows.flow_metadata(andi_use_case);
CREATE INDEX IF NOT EXISTS idx_flow_metadata_active ON andi_flows.flow_metadata(is_active);
CREATE INDEX IF NOT EXISTS idx_flow_metadata_tags ON andi_flows.flow_metadata USING gin(tags);

-- Create table for flow execution logs
CREATE TABLE IF NOT EXISTS andi_flows.execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    input_data JSONB,
    output_data JSONB,
    error_details TEXT,
    execution_time_ms INTEGER,
    user_id VARCHAR(255),
    session_id VARCHAR(255)
);

-- Create indexes for execution logs
CREATE INDEX IF NOT EXISTS idx_execution_logs_flow_id ON andi_flows.execution_logs(flow_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON andi_flows.execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_started_at ON andi_flows.execution_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON andi_flows.execution_logs(user_id);

-- Create table for ANDI data connectors configuration
CREATE TABLE IF NOT EXISTS andi_flows.data_connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_name VARCHAR(255) NOT NULL UNIQUE,
    connector_type VARCHAR(100) NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    connection_string TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    configuration JSONB
);

-- Insert default ANDI data connectors
INSERT INTO andi_flows.data_connectors (connector_name, connector_type, database_name, connection_string, configuration) VALUES
('andi_main_db', 'postgresql', 'andi_db', 'postgresql://andi_user:password@host.docker.internal:5432/andi_db', '{"read_only": true, "timeout": 30}'),
('andi_warehouse', 'clickhouse', 'andi_warehouse', 'http://host.docker.internal:8123', '{"read_only": true, "timeout": 60}')
ON CONFLICT (connector_name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_flow_metadata_updated_at BEFORE UPDATE ON andi_flows.flow_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_connectors_updated_at BEFORE UPDATE ON andi_flows.data_connectors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for active flows
CREATE OR REPLACE VIEW andi_flows.active_flows AS
SELECT 
    fm.*,
    COUNT(el.id) as execution_count,
    MAX(el.completed_at) as last_execution,
    AVG(el.execution_time_ms) as avg_execution_time_ms
FROM andi_flows.flow_metadata fm
LEFT JOIN andi_flows.execution_logs el ON fm.flow_id = el.flow_id
WHERE fm.is_active = true
GROUP BY fm.id, fm.flow_id, fm.flow_name, fm.flow_category, fm.andi_use_case, 
         fm.description, fm.version, fm.created_by, fm.created_at, fm.updated_at, 
         fm.is_active, fm.tags, fm.configuration, fm.performance_metrics;

-- Grant permissions on ANDI schema objects
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA andi_flows TO langflow_user;
GRANT SELECT ON ALL VIEWS IN SCHEMA andi_flows TO langflow_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA andi_flows TO langflow_user;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'ANDI Langflow database initialization completed successfully!';
END $$;