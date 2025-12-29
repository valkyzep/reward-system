-- =============================================================================
-- ADD DISCOUNT COLUMNS TO REWARDS TABLE
-- =============================================================================
-- This migration adds support for limited-time discounts on rewards

-- Add discounted_price column (the actual discounted price in points)
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS discounted_price INTEGER;

-- Add discount_end_date column (when the discount expires)
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP WITH TIME ZONE;

-- Add comment to document columns
COMMENT ON COLUMN rewards.discounted_price IS 'Discounted price in points. NULL means no discount.';
COMMENT ON COLUMN rewards.discount_end_date IS 'Discount expiration date. NULL means no active discount.';

-- Create index for efficient querying of discounts
CREATE INDEX IF NOT EXISTS idx_rewards_discount_end_date ON rewards(discount_end_date) WHERE discount_end_date IS NOT NULL;
