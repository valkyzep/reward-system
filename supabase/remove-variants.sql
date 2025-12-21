-- =============================================================================
-- MIGRATION: Remove Variants System and Simplify Galleries
-- =============================================================================
-- This migration removes the variant system and creates a simplified gallery table
-- =============================================================================

-- Drop old variant-related tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS reward_galleries CASCADE;
DROP TABLE IF EXISTS reward_variants CASCADE;

-- Remove variant_id column from claims table
ALTER TABLE claims DROP COLUMN IF EXISTS variant_id;

-- Remove variant_type column from rewards table
ALTER TABLE rewards DROP COLUMN IF EXISTS variant_type;

-- Add images column to rewards table to store array of image URLs
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS images TEXT;

-- Add description column to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing rewards to have empty images array
UPDATE rewards SET images = '[]' WHERE images IS NULL;

-- Add reward_model column to restocking_history table
ALTER TABLE restocking_history ADD COLUMN IF NOT EXISTS reward_model TEXT;

-- Create simplified galleries table (directly linked to rewards, not variants)
CREATE TABLE IF NOT EXISTS reward_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_image_order CHECK (image_order >= 0 AND image_order <= 3)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reward_galleries_reward_id ON reward_galleries(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_galleries_order ON reward_galleries(reward_id, image_order);

-- Enable RLS on reward_galleries
ALTER TABLE reward_galleries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reward_galleries
CREATE POLICY "Public read access for reward galleries"
  ON reward_galleries FOR SELECT
  USING (true);

CREATE POLICY "Admin full access for reward galleries"
  ON reward_galleries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_sessions
      WHERE user_sessions.user_id = auth.uid()
      AND user_sessions.expires_at > NOW()
    )
  );
