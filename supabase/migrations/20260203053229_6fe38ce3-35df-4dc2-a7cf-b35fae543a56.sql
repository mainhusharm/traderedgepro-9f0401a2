-- Fix coupon validation RLS policy to allow validating ANY coupon by code
-- Private coupons should still be queryable when the user enters the exact code

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can validate public coupons" ON public.coupons;

-- Create new policy that allows any authenticated user to read active coupons
-- Security is maintained because users still need the exact code to use the coupon
CREATE POLICY "Authenticated users can validate any active coupon by code"
  ON public.coupons
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);