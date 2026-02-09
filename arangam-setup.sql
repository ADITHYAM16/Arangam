-- Create arangams table
CREATE TABLE IF NOT EXISTS arangams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_arangams_active ON arangams(is_active);

-- Enable RLS
ALTER TABLE arangams ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on arangams" ON arangams FOR ALL USING (true);
