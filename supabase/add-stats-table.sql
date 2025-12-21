-- Create stats table to store global statistics
CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  rewards_claimed_base INTEGER DEFAULT 0,
  active_players INTEGER DEFAULT 500,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Add active_players column if it doesn't exist (for existing tables)
ALTER TABLE stats ADD COLUMN IF NOT EXISTS active_players INTEGER DEFAULT 500;

-- Insert initial stats record
INSERT INTO stats (id, rewards_claimed_base, active_players, last_updated)
VALUES (1, 0, 500, NOW())
ON CONFLICT (id) DO UPDATE SET active_players = 500 WHERE stats.active_players IS NULL;

-- Enable RLS
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for stats" ON stats;
DROP POLICY IF EXISTS "Admin write access for stats" ON stats;

-- Allow public read access
CREATE POLICY "Public read access for stats"
  ON stats FOR SELECT
  USING (true);

-- Allow admin write access (you can adjust this based on your admin logic)
CREATE POLICY "Admin write access for stats"
  ON stats FOR ALL
  USING (true);
