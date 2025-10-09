-- Create temporary workflows table for storing generated workflows
-- This replaces the localStorage approach with proper database storage

CREATE TABLE IF NOT EXISTS temp_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  workflow_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- Create index for faster lookups by session_id
CREATE INDEX IF NOT EXISTS idx_temp_workflows_session_id ON temp_workflows(session_id);

-- Create index for cleanup of expired workflows
CREATE INDEX IF NOT EXISTS idx_temp_workflows_expires_at ON temp_workflows(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE temp_workflows ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert temporary workflows
-- (since we don't have user authentication in this demo)
DROP POLICY IF EXISTS "Allow anyone to insert temp workflows" ON temp_workflows;
CREATE POLICY "Allow anyone to insert temp workflows" ON temp_workflows
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anyone to read temporary workflows by session_id
DROP POLICY IF EXISTS "Allow anyone to read temp workflows by session_id" ON temp_workflows;
CREATE POLICY "Allow anyone to read temp workflows by session_id" ON temp_workflows
  FOR SELECT USING (true);

-- Create policy to allow anyone to delete temp workflows
DROP POLICY IF EXISTS "Allow anyone to delete temp workflows" ON temp_workflows;
CREATE POLICY "Allow anyone to delete temp workflows" ON temp_workflows
  FOR DELETE USING (true);

-- Create function to automatically clean up expired workflows
CREATE OR REPLACE FUNCTION cleanup_expired_workflows()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_workflows 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup every hour (if pg_cron is available)
-- Note: This requires pg_cron extension which may not be available in all Supabase instances
-- For now, we'll handle cleanup manually or on read operations

COMMENT ON TABLE temp_workflows IS 'Temporary storage for generated workflows from Agent Builder';
COMMENT ON COLUMN temp_workflows.session_id IS 'Unique session identifier for retrieving the workflow';
COMMENT ON COLUMN temp_workflows.workflow_data IS 'JSON data containing the complete workflow definition';
COMMENT ON COLUMN temp_workflows.expires_at IS 'When this workflow data expires and should be cleaned up';
