-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS reward_galleries CASCADE;
DROP TABLE IF EXISTS reward_variants CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;

-- Create rewards table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  variant_type VARCHAR(100),
  tier VARCHAR(50) DEFAULT 'bronze' CHECK (tier IN ('black-diamond', 'diamond', 'gold', 'silver', 'bronze')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create variants table (for variant options like Black, White, Red, etc.)
CREATE TABLE reward_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  option_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create galleries table (4 images per variant)
CREATE TABLE reward_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES reward_variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL CHECK (image_order BETWEEN 0 AND 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create claims table
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id VARCHAR(50) UNIQUE NOT NULL,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  variant_id UUID REFERENCES reward_variants(id),
  username VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  delivery_address TEXT,
  ewallet_name VARCHAR(100),
  ewallet_account VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'shipped', 'delivered', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_points ON rewards(points);
CREATE INDEX IF NOT EXISTS idx_reward_variants_reward_id ON reward_variants(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_galleries_variant_id ON reward_galleries(variant_id);
CREATE INDEX IF NOT EXISTS idx_claims_claim_id ON claims(claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_reward_id ON claims(reward_id);

-- Enable Row Level Security (RLS)
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Allow public read access to rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Allow public insert rewards" ON rewards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update rewards" ON rewards FOR UPDATE USING (true);
CREATE POLICY "Allow public delete rewards" ON rewards FOR DELETE USING (true);

CREATE POLICY "Allow public read access to variants" ON reward_variants FOR SELECT USING (true);
CREATE POLICY "Allow public insert variants" ON reward_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete variants" ON reward_variants FOR DELETE USING (true);

CREATE POLICY "Allow public read access to galleries" ON reward_galleries FOR SELECT USING (true);
CREATE POLICY "Allow public insert galleries" ON reward_galleries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete galleries" ON reward_galleries FOR DELETE USING (true);

-- RLS Policies for claims (users can only insert, admins can view all)
CREATE POLICY "Allow public insert claims" ON claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to view their own claims" ON claims FOR SELECT USING (true);
CREATE POLICY "Allow public update claims" ON claims FOR UPDATE USING (true);

-- Update timestamp trigger function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
