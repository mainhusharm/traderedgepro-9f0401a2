-- =====================================================
-- SECURITY HARDENING: Phase 1-3 Implementation
-- Upgrade from B+ to A+ Rating
-- =====================================================

-- =====================================================
-- PHASE 1.1: Lock Down Coupons Table
-- Fix: Private discount codes are exposed publicly
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can validate active coupons" ON coupons;

-- Create restrictive policy: Only authenticated users can validate coupons
-- They can only see active, non-private coupons (private ones are validated via backend)
CREATE POLICY "Authenticated users can validate public coupons"
ON coupons FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_active = true
  AND (is_private = false OR is_private IS NULL)
);

-- Admin policy for full access (if not exists)
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage all coupons"
ON coupons FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- PHASE 1.2: Secure Giveaway Entries
-- Fix: Customer emails are publicly exposed
-- =====================================================

-- Drop the overly permissive policy that exposes all rows
DROP POLICY IF EXISTS "Anyone can submit giveaway entry" ON launch_giveaway_entries;

-- Create INSERT-only policy for anonymous submissions (no SELECT on all rows)
CREATE POLICY "Anyone can submit giveaway entry insert only"
ON launch_giveaway_entries FOR INSERT
WITH CHECK (true);

-- Create SELECT policy for admin only
DROP POLICY IF EXISTS "Admins can view giveaway entries" ON launch_giveaway_entries;
CREATE POLICY "Admins can view all giveaway entries"
ON launch_giveaway_entries FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update entries (mark winners)
DROP POLICY IF EXISTS "Admins can update giveaway entries" ON launch_giveaway_entries;
CREATE POLICY "Admins can update giveaway entries"
ON launch_giveaway_entries FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- PHASE 3: Tighten Referral Clicks
-- Fix: Overly permissive UPDATE policy
-- =====================================================

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Allow conversion updates by authenticated users" ON referral_clicks;

-- Create restricted policy: Only the referrer can update their own referral clicks
CREATE POLICY "Referrers can update their own referral clicks"
ON referral_clicks FOR UPDATE
USING (
  auth.uid() = referrer_user_id
)
WITH CHECK (
  auth.uid() = referrer_user_id
);

-- Ensure service role / edge functions can still update (via SECURITY DEFINER functions)
-- The track-referral-click edge function uses service_role key, so it bypasses RLS

-- =====================================================
-- PHASE 4: Clean up additional permissive policies
-- =====================================================

-- Agent availability: Restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view agent availability" ON agent_availability;
CREATE POLICY "Authenticated users can view agent availability"
ON agent_availability FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Signal expert validations: Restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view validations" ON signal_expert_validations;
CREATE POLICY "Authenticated users can view validations"
ON signal_expert_validations FOR SELECT
USING (auth.uid() IS NOT NULL);