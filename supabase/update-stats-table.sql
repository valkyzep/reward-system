-- =============================================================================
-- Update Stats Table to Support Server-Side Increments
-- =============================================================================

-- Add new columns for timestamp tracking
ALTER TABLE stats 
ADD COLUMN IF NOT EXISTS last_rewards_increment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_players_increment TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Rename old column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='stats' AND column_name='rewards_claimed_base') THEN
        ALTER TABLE stats RENAME COLUMN rewards_claimed_base TO rewards_claimed;
    END IF;
END $$;

-- Ensure rewards_claimed column exists
ALTER TABLE stats 
ADD COLUMN IF NOT EXISTS rewards_claimed INTEGER DEFAULT 0;

-- Update any existing records with initial timestamp values
UPDATE stats 
SET last_rewards_increment = COALESCE(last_rewards_increment, NOW()),
    last_players_increment = COALESCE(last_players_increment, NOW())
WHERE last_rewards_increment IS NULL OR last_players_increment IS NULL;
