-- Add tier column to existing rewards table
ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'bronze' 
CHECK (tier IN ('black-diamond', 'diamond', 'gold', 'silver', 'bronze'));

-- Update existing rewards with calculated tiers based on points
UPDATE rewards
SET tier = CASE
  WHEN points >= 200000 OR name ILIKE '%bmw%' OR name ILIKE '%mercedes%' OR name ILIKE '%porsche%' OR name ILIKE '%ferrari%' THEN 'black-diamond'
  WHEN points >= 75000 OR name ILIKE '%rolex%' OR name ILIKE '%watch%' THEN 'diamond'
  WHEN points >= 25000 OR name ILIKE '%iphone%' OR name ILIKE '%macbook%' THEN 'gold'
  WHEN points >= 500 THEN 'silver'
  ELSE 'bronze'
END
WHERE tier IS NULL OR tier = 'bronze';
