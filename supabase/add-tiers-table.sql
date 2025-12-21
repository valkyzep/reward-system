-- Create tiers table
CREATE TABLE IF NOT EXISTS tiers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(100) NOT NULL,
  color VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers (in order from highest to lowest)
INSERT INTO tiers (id, name, label, color, sort_order) VALUES 
  ('black-diamond', 'Black Diamond', 'BLACK DIAMOND', 'from-purple-900 to-black', 1),
  ('diamond', 'Diamond', '💠 DIAMOND', 'from-indigo-600 to-purple-600', 2),
  ('platinum', 'Platinum', '🏆 PLATINUM', 'from-cyan-500 to-blue-500', 3),
  ('gold', 'Gold', 'GOLD', 'from-yellow-500 to-yellow-600', 4),
  ('silver', 'Silver', 'SILVER', 'from-gray-400 to-gray-500', 5),
  ('bronze', 'Bronze', 'BRONZE', 'from-amber-700 to-amber-800', 6)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to tiers"
  ON tiers
  FOR SELECT
  TO public
  USING (true);

-- Allow admins to insert/update/delete tiers
CREATE POLICY "Allow admins to manage tiers"
  ON tiers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT user_id FROM user_sessions WHERE session_token = get_session_token())
      AND users.role IN ('admin', 'super_admin')
    )
  );
