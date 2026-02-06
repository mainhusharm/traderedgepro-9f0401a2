-- Add discount_code column to treasure_hunt_entries for winner codes
ALTER TABLE public.treasure_hunt_entries 
ADD COLUMN IF NOT EXISTS discount_code TEXT UNIQUE;

-- Create a function to generate unique winner discount codes
CREATE OR REPLACE FUNCTION generate_treasure_hunt_winner_code(pos INTEGER)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  -- Generate a unique code based on position and random suffix
  code := 'TREASURE-WINNER-' || pos || '-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6));
  RETURN code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create the winner coupon in the coupons table
CREATE OR REPLACE FUNCTION create_treasure_hunt_winner_coupon(
  winner_code TEXT,
  winner_email TEXT
)
RETURNS UUID AS $$
DECLARE
  coupon_id UUID;
BEGIN
  -- Insert a 100% discount coupon that's single-use and private
  INSERT INTO public.coupons (
    code,
    discount_type,
    discount_value,
    max_uses,
    current_uses,
    is_active,
    is_private,
    is_trial_coupon,
    valid_from,
    valid_until
  ) VALUES (
    winner_code,
    'percentage',
    100,
    1,        -- max 1 use
    0,        -- current uses
    true,     -- is_active
    true,     -- is_private (only for this winner)
    false,    -- not a trial coupon (actual free pro account)
    NOW(),
    NOW() + INTERVAL '30 days'  -- expires in 30 days if not used
  )
  RETURNING id INTO coupon_id;
  
  RETURN coupon_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;