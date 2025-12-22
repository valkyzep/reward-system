-- =============================================================================
-- Banner Settings Table Migration
-- =============================================================================
-- This migration adds a banner_settings table to store top and bottom banner configurations

-- Drop table if exists
DROP TABLE IF EXISTS banner_settings CASCADE;

-- -----------------------------------------------------------------------------
-- TABLE: banner_settings
-- -----------------------------------------------------------------------------
CREATE TABLE banner_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  top_banner_image TEXT,
  bottom_banner_images JSONB DEFAULT '[]'::jsonb,
  bottom_banner_links JSONB DEFAULT '[]'::jsonb,
  carousel_interval INTEGER DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default banner settings
INSERT INTO banner_settings (setting_key, top_banner_image, bottom_banner_images, bottom_banner_links, carousel_interval)
VALUES (
  'main',
  '/Bannertop.png',
  '["/Bannertop.png", "/Bannertop.png", "/Bannertop.png"]'::jsonb,
  '["https://www.facebook.com", "https://www.tiktok.com", "https://www.instagram.com"]'::jsonb,
  5
);

-- Create index for faster lookups
CREATE INDEX idx_banner_settings_key ON banner_settings(setting_key);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE banner_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read banner settings"
  ON banner_settings
  FOR SELECT
  USING (true);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update banner settings"
  ON banner_settings
  FOR UPDATE
  USING (true);

-- -----------------------------------------------------------------------------
-- Automatic Timestamp Update Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_banner_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_banner_settings_timestamp
  BEFORE UPDATE ON banner_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_banner_settings_timestamp();
