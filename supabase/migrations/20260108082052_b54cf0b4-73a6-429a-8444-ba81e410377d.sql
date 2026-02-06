-- Fix overly permissive RLS policies

-- agent_availability: Replace "Agents can manage own availability" with proper user check
DROP POLICY IF EXISTS "Agents can manage own availability" ON public.agent_availability;
CREATE POLICY "Agents can manage own availability" 
ON public.agent_availability 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_agents 
    WHERE admin_agents.id = agent_availability.agent_id 
    AND admin_agents.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_agents 
    WHERE admin_agents.id = agent_availability.agent_id 
    AND admin_agents.user_id = auth.uid()
  )
);

-- agent_notifications: Fix policies for proper agent access
DROP POLICY IF EXISTS "Agents can view their own notifications" ON public.agent_notifications;
CREATE POLICY "Agents can view their own notifications" 
ON public.agent_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_agents 
    WHERE admin_agents.id = agent_notifications.agent_id 
    AND admin_agents.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Agents can update their own notifications" ON public.agent_notifications;
CREATE POLICY "Agents can update their own notifications" 
ON public.agent_notifications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_agents 
    WHERE admin_agents.id = agent_notifications.agent_id 
    AND admin_agents.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert notifications" ON public.agent_notifications;
-- Keep insert open for service role only (handled via service role key)

-- email_logs: These are backend-only, drop public access
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can update email logs" ON public.email_logs;
-- Service role bypasses RLS, no policies needed for service operations

-- guidance_messages: Fix agent update policy
DROP POLICY IF EXISTS "Allow agent to update messages" ON public.guidance_messages;
CREATE POLICY "Agents can update messages in their sessions" 
ON public.guidance_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.guidance_sessions gs
    JOIN public.admin_agents aa ON aa.id = gs.assigned_agent_id
    WHERE gs.id = guidance_messages.session_id 
    AND aa.user_id = auth.uid()
  )
);

-- otp_verifications: These need to be public for login flow, but limit scope
-- Keep the current policies as OTP is needed before auth

-- referral_clicks: Limit updates to authenticated users or service role
DROP POLICY IF EXISTS "Allow conversion updates" ON public.referral_clicks;
CREATE POLICY "Allow conversion updates by authenticated users" 
ON public.referral_clicks 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- user_notifications: Fix insert policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.user_notifications;
-- Service role bypasses RLS, no explicit policy needed