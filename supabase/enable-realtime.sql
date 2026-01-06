-- =============================================================================
-- ENABLE REALTIME SUBSCRIPTIONS
-- =============================================================================
-- This enables real-time updates for rewards, categories, and tiers tables
-- Run this in your Supabase SQL Editor to enable live updates
-- =============================================================================

-- Enable realtime for rewards table
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;

-- Enable realtime for categories table (if exists)
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

-- Enable realtime for tiers table (if exists)
ALTER PUBLICATION supabase_realtime ADD TABLE tiers;

-- Optional: Enable realtime for claims table if you want live claim updates
ALTER PUBLICATION supabase_realtime ADD TABLE claims;

-- Optional: Enable realtime for reward_variants if you want variant updates
ALTER PUBLICATION supabase_realtime ADD TABLE reward_variants;

-- Optional: Enable realtime for reward_galleries if you want gallery updates
ALTER PUBLICATION supabase_realtime ADD TABLE reward_galleries;
