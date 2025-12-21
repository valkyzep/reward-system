-- Add model column to rewards table
-- Run this in Supabase SQL Editor to add the model field

ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS model VARCHAR(255);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rewards';
