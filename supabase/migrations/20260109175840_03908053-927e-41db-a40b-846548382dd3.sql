-- Insert REFERRAL15 coupon for referred users (15% off)
INSERT INTO public.coupons (
  code,
  discount_type,
  discount_value,
  is_active,
  is_private,
  is_trial_coupon,
  min_purchase,
  max_uses,
  current_uses
) VALUES (
  'REFERRAL15',
  'percentage',
  15,
  true,
  true,
  false,
  null,
  null,
  0
);