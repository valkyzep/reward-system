-- =============================================================================
-- COMPLETE DATABASE SCHEMA FOR REWARD SYSTEM
-- =============================================================================
-- This file contains the complete database schema including:
-- - Core tables (rewards, variants, galleries, claims, users)
-- - Restocking history
-- - Indexes for performance
-- - Row Level Security policies
-- - Triggers for automatic timestamps
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CLEANUP: Drop existing tables (in correct order due to foreign keys)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS restocking_history CASCADE;
DROP TABLE IF EXISTS reward_galleries CASCADE;
DROP TABLE IF EXISTS reward_variants CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -----------------------------------------------------------------------------
-- TABLE: users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLE: user_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLE: rewards
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- TABLE: reward_variants
-- -----------------------------------------------------------------------------
CREATE TABLE reward_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  option_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLE: reward_galleries
-- -----------------------------------------------------------------------------
CREATE TABLE reward_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES reward_variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL CHECK (image_order BETWEEN 0 AND 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLE: claims
-- -----------------------------------------------------------------------------
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id VARCHAR(50) UNIQUE NOT NULL,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES reward_variants(id),
  username VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  delivery_address TEXT,
  ewallet_name VARCHAR(100),
  ewallet_account VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'shipped', 'delivered', 'rejected')),
  rejection_reason TEXT,
  admin_user VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLE: restocking_history
-- -----------------------------------------------------------------------------
CREATE TABLE restocking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  reward_category TEXT,
  quantity_added INTEGER NOT NULL,
  admin_user TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- INDEXES: Performance optimization
-- -----------------------------------------------------------------------------
-- Rewards indexes
CREATE INDEX idx_rewards_category ON rewards(category);
CREATE INDEX idx_rewards_points ON rewards(points);
CREATE INDEX idx_rewards_tier ON rewards(tier);

-- Variants and galleries indexes
CREATE INDEX idx_reward_variants_reward_id ON reward_variants(reward_id);
CREATE INDEX idx_reward_galleries_variant_id ON reward_galleries(variant_id);

-- Claims indexes
CREATE INDEX idx_claims_claim_id ON claims(claim_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_reward_id ON claims(reward_id);
CREATE INDEX idx_claims_created_at ON claims(created_at DESC);

-- User sessions indexes
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Restocking history indexes
CREATE INDEX idx_restocking_history_reward_id ON restocking_history(reward_id);
CREATE INDEX idx_restocking_history_created_at ON restocking_history(created_at DESC);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY: Enable RLS on all tables
-- -----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE restocking_history ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- SESSION CONTEXT FUNCTION
-- -----------------------------------------------------------------------------
-- Function to set session context (called from API routes)
CREATE OR REPLACE FUNCTION set_session_context(session_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.session_token', session_token, true);
END;
$$;

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Database-level security with session validation
-- -----------------------------------------------------------------------------
-- Helper function to get current session token from context
CREATE OR REPLACE FUNCTION get_session_token()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT current_setting('app.session_token', true);
$$;

-- Helper function to check if user is authenticated via session
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_sessions
    WHERE session_token = get_session_token()
    AND expires_at > NOW()
  );
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN user_sessions s ON u.id = s.user_id
    WHERE s.session_token = get_session_token()
    AND s.expires_at > NOW()
    AND u.role IN ('admin', 'super_admin')
  );
$$;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN user_sessions s ON u.id = s.user_id
    WHERE s.session_token = get_session_token()
    AND s.expires_at > NOW()
    AND u.role = 'super_admin'
  );
$$;

-- Rewards policies (public can view, admins can modify)
CREATE POLICY "Public can view rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Only admins can insert rewards" ON rewards FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update rewards" ON rewards FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete rewards" ON rewards FOR DELETE USING (is_admin());

-- Variants policies
CREATE POLICY "Public can view variants" ON reward_variants FOR SELECT USING (true);
CREATE POLICY "Only admins can insert variants" ON reward_variants FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update variants" ON reward_variants FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete variants" ON reward_variants FOR DELETE USING (is_admin());

-- Galleries policies
CREATE POLICY "Public can view galleries" ON reward_galleries FOR SELECT USING (true);
CREATE POLICY "Only admins can insert galleries" ON reward_galleries FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update galleries" ON reward_galleries FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete galleries" ON reward_galleries FOR DELETE USING (is_admin());

-- Claims policies (anyone can submit, admins can view/modify)
CREATE POLICY "Anyone can submit claims" ON claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all claims" ON claims FOR SELECT USING (is_admin());
CREATE POLICY "Only admins can update claims" ON claims FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete claims" ON claims FOR DELETE USING (is_admin());

-- Users policies (only admins can access)
CREATE POLICY "Only admins can view users" ON users FOR SELECT USING (is_admin());
CREATE POLICY "Only super admins can insert users" ON users FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Only super admins can update users" ON users FOR UPDATE USING (is_super_admin());
CREATE POLICY "Only super admins can delete users" ON users FOR DELETE USING (is_super_admin());

-- User sessions policies (authenticated users can manage their own)
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_sessions s
    WHERE s.session_token = get_session_token()
    AND s.user_id = user_sessions.user_id
  )
);
CREATE POLICY "Users can insert own sessions" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own sessions" ON user_sessions FOR DELETE USING (
  session_token = get_session_token()
);

-- Restocking history policies (only admins)
CREATE POLICY "Only admins can view restocking history" ON restocking_history FOR SELECT USING (is_admin());
CREATE POLICY "Only admins can add restocking history" ON restocking_history FOR INSERT WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- TRIGGERS: Automatic timestamp updates
-- -----------------------------------------------------------------------------
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_rewards_updated_at 
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at 
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
