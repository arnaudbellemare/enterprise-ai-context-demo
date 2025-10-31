-- Expert Trajectories Table for SRL (Supervised Reinforcement Learning)
-- Stores expert trajectories for step-wise supervision in multi-step reasoning

-- Create expert_trajectories table
CREATE TABLE IF NOT EXISTS expert_trajectories (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    domain TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]',
    final_answer TEXT NOT NULL DEFAULT '',
    quality DECIMAL(3,2) DEFAULT 0.8 CHECK (quality >= 0 AND quality <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expert_trajectories_domain ON expert_trajectories(domain);
CREATE INDEX IF NOT EXISTS idx_expert_trajectories_quality ON expert_trajectories(quality DESC);
CREATE INDEX IF NOT EXISTS idx_expert_trajectories_created_at ON expert_trajectories(created_at DESC);

-- Create GIN index for JSONB steps array for faster queries
CREATE INDEX IF NOT EXISTS idx_expert_trajectories_steps ON expert_trajectories USING GIN (steps);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expert_trajectories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_expert_trajectories_timestamp
    BEFORE UPDATE ON expert_trajectories
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_trajectories_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE expert_trajectories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Public read access for authenticated users
CREATE POLICY "Authenticated users can view expert trajectories"
    ON expert_trajectories FOR SELECT
    USING (auth.role() = 'authenticated');

-- Service role can insert/update
CREATE POLICY "Service role can manage expert trajectories"
    ON expert_trajectories FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE expert_trajectories IS 'Stores expert trajectories for SRL step-wise supervision';
COMMENT ON COLUMN expert_trajectories.id IS 'Unique identifier (base64 hash of query)';
COMMENT ON COLUMN expert_trajectories.query IS 'Original query that this trajectory addresses';
COMMENT ON COLUMN expert_trajectories.domain IS 'Domain category (financial, legal, science, etc.)';
COMMENT ON COLUMN expert_trajectories.steps IS 'JSONB array of expert steps with internal reasoning and actions';
COMMENT ON COLUMN expert_trajectories.final_answer IS 'Expected final answer from expert trajectory';
COMMENT ON COLUMN expert_trajectories.quality IS 'Quality score (0-1) indicating trajectory reliability';

