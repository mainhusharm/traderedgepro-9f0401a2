-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can validate coupons" ON public.coupons;

-- Create a new policy that allows validating both public AND private coupons
-- Private coupons should be accessible if you know the code
CREATE POLICY "Anyone can validate active coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true);