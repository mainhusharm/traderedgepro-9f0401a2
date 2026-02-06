-- =====================================================
-- PAYMENT ENFORCEMENT: Backend-level protection
-- =====================================================

-- Create function to check if user has an active PAID membership
CREATE OR REPLACE FUNCTION public.has_active_paid_membership(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = user_uuid
      AND status = 'active'
      AND (
        -- Paid membership (not trial) or valid trial (not expired)
        (is_trial = false OR is_trial IS NULL)
        OR
        (is_trial = true AND expires_at > now())
      )
  );
$$;

-- Create function to check if MT5 user has paid
CREATE OR REPLACE FUNCTION public.has_mt5_payment_verified(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mt5_users
    WHERE user_id = user_uuid
      AND (
        payment_verified = true
        OR (is_trial = true AND trial_expires_at > now())
      )
  );
$$;

-- =====================================================
-- Update RLS policies for VIP/Premium content
-- =====================================================

-- 1. Institutional signals: Only paid members can view
DROP POLICY IF EXISTS "Users can view sent signals" ON institutional_signals;
CREATE POLICY "Paid members can view institutional signals"
ON institutional_signals FOR SELECT
USING (
  send_to_users = true
  AND has_active_paid_membership(auth.uid())
);

-- 2. Signals (VIP signals): VIP signals require paid membership
DROP POLICY IF EXISTS "Users can view public signals or admins all" ON signals;
CREATE POLICY "Users can view signals with payment check"
ON signals FOR SELECT
USING (
  -- Admins see all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- User's own signals
  auth.uid() = user_id
  OR
  -- Public non-VIP signals: anyone authenticated
  (is_public = true AND (is_vip = false OR is_vip IS NULL))
  OR
  -- VIP signals: only paid members
  (is_vip = true AND has_active_paid_membership(auth.uid()))
);

-- 3. Dashboard data: Require active membership to access
DROP POLICY IF EXISTS "Users can view their own dashboard" ON dashboard_data;
CREATE POLICY "Paid users can view own dashboard"
ON dashboard_data FOR SELECT
USING (
  auth.uid() = user_id
  AND has_active_paid_membership(auth.uid())
);

-- 4. Guidance sessions: Require paid membership to create/view
DROP POLICY IF EXISTS "Users can view their own sessions" ON guidance_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON guidance_sessions;

CREATE POLICY "Paid users can view own sessions"
ON guidance_sessions FOR SELECT
USING (
  auth.uid() = user_id
  AND has_active_paid_membership(auth.uid())
);

CREATE POLICY "Paid users can create sessions"
ON guidance_sessions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND has_active_paid_membership(auth.uid())
);

-- 5. AI conversations: Require paid membership
DROP POLICY IF EXISTS "Users can manage their own conversations" ON ai_conversations;
CREATE POLICY "Paid users can manage conversations"
ON ai_conversations FOR ALL
USING (
  auth.uid() = user_id
  AND has_active_paid_membership(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  AND has_active_paid_membership(auth.uid())
);

-- 6. AI messages: Require paid membership
DROP POLICY IF EXISTS "Users can manage their own messages" ON ai_messages;
CREATE POLICY "Paid users can manage messages"
ON ai_messages FOR ALL
USING (
  auth.uid() = user_id
  AND has_active_paid_membership(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  AND has_active_paid_membership(auth.uid())
);