-- =============================================================================
-- RLS MIGRATION (Safe - No data loss)
-- =============================================================================
-- This adds RLS functions and policies without dropping existing tables
-- Safe to run on databases with existing data
-- =============================================================================

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
-- RLS HELPER FUNCTIONS
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

-- -----------------------------------------------------------------------------
-- ENABLE RLS (if not already enabled)
-- -----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE restocking_history ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- DROP OLD POLICIES (if they exist)
-- -----------------------------------------------------------------------------
-- Rewards
DROP POLICY IF EXISTS "Allow anon access to rewards" ON rewards;
DROP POLICY IF EXISTS "Allow public read access to rewards" ON rewards;
DROP POLICY IF EXISTS "Allow public insert rewards" ON rewards;
DROP POLICY IF EXISTS "Allow public update rewards" ON rewards;
DROP POLICY IF EXISTS "Allow public delete rewards" ON rewards;
DROP POLICY IF EXISTS "Public can view rewards" ON rewards;
DROP POLICY IF EXISTS "Only admins can insert rewards" ON rewards;
DROP POLICY IF EXISTS "Only admins can update rewards" ON rewards;
DROP POLICY IF EXISTS "Only admins can delete rewards" ON rewards;

-- Variants
DROP POLICY IF EXISTS "Allow anon access to variants" ON reward_variants;
DROP POLICY IF EXISTS "Allow public read access to variants" ON reward_variants;
DROP POLICY IF EXISTS "Allow public insert variants" ON reward_variants;
DROP POLICY IF EXISTS "Allow public delete variants" ON reward_variants;
DROP POLICY IF EXISTS "Public can view variants" ON reward_variants;
DROP POLICY IF EXISTS "Only admins can insert variants" ON reward_variants;
DROP POLICY IF EXISTS "Only admins can update variants" ON reward_variants;
DROP POLICY IF EXISTS "Only admins can delete variants" ON reward_variants;

-- Galleries
DROP POLICY IF EXISTS "Allow anon access to galleries" ON reward_galleries;
DROP POLICY IF EXISTS "Allow public read access to galleries" ON reward_galleries;
DROP POLICY IF EXISTS "Allow public insert galleries" ON reward_galleries;
DROP POLICY IF EXISTS "Allow public delete galleries" ON reward_galleries;
DROP POLICY IF EXISTS "Public can view galleries" ON reward_galleries;
DROP POLICY IF EXISTS "Only admins can insert galleries" ON reward_galleries;
DROP POLICY IF EXISTS "Only admins can update galleries" ON reward_galleries;
DROP POLICY IF EXISTS "Only admins can delete galleries" ON reward_galleries;

-- Claims
DROP POLICY IF EXISTS "Allow anon access to claims" ON claims;
DROP POLICY IF EXISTS "Allow public insert claims" ON claims;
DROP POLICY IF EXISTS "Allow public view claims" ON claims;
DROP POLICY IF EXISTS "Allow public update claims" ON claims;
DROP POLICY IF EXISTS "Anyone can submit claims" ON claims;
DROP POLICY IF EXISTS "Admins can view all claims" ON claims;
DROP POLICY IF EXISTS "Only admins can update claims" ON claims;
DROP POLICY IF EXISTS "Only admins can delete claims" ON claims;

-- Users
DROP POLICY IF EXISTS "Allow anon access to users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Only admins can view users" ON users;
DROP POLICY IF EXISTS "Only super admins can insert users" ON users;
DROP POLICY IF EXISTS "Only super admins can update users" ON users;
DROP POLICY IF EXISTS "Only super admins can delete users" ON users;

-- Sessions
DROP POLICY IF EXISTS "Allow anon access to sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow all operations on sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;

-- Restocking
DROP POLICY IF EXISTS "Allow anon access to restocking" ON restocking_history;
DROP POLICY IF EXISTS "Allow all operations on restocking_history" ON restocking_history;
DROP POLICY IF EXISTS "Only admins can view restocking history" ON restocking_history;
DROP POLICY IF EXISTS "Only admins can add restocking history" ON restocking_history;

-- -----------------------------------------------------------------------------
-- CREATE NEW RLS POLICIES
-- -----------------------------------------------------------------------------
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

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Your data is safe! Only RLS functions and policies were updated.
-- =============================================================================
