-- Add trial columns to coupons table
ALTER TABLE coupons 
  ADD COLUMN IF NOT EXISTS is_trial_coupon BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_duration_hours INTEGER DEFAULT 24;

-- Add trial tracking to memberships table
ALTER TABLE memberships 
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_coupon_code TEXT;

-- Add trial tracking to mt5_users table
ALTER TABLE mt5_users 
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_coupon_code TEXT;

-- Create the TRIAL24HR coupon (100% discount, 24-hour trial)
INSERT INTO coupons (
  code, 
  discount_type, 
  discount_value, 
  is_active, 
  is_private, 
  is_trial_coupon, 
  trial_duration_hours
) VALUES (
  'TRIAL24HR', 
  'percentage', 
  100, 
  true, 
  true, 
  true, 
  24
) ON CONFLICT (code) DO UPDATE SET
  is_trial_coupon = true,
  trial_duration_hours = 24,
  discount_value = 100,
  is_active = true;