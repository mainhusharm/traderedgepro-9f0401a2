-- Fix PUBLIC_DATA_EXPOSURE: Replace overly permissive RLS policies on guidance_messages

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Allow agent to view all messages" ON public.guidance_messages;
DROP POLICY IF EXISTS "Allow agent messages" ON public.guidance_messages;

-- 2. Create proper policy for agents to view messages only in their assigned sessions
CREATE POLICY "Agents can view messages in assigned sessions"
ON public.guidance_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.guidance_sessions gs
    JOIN public.admin_agents aa ON aa.id = gs.assigned_agent_id
    WHERE gs.id = guidance_messages.session_id
    AND aa.user_id = auth.uid()
  )
);

-- 3. Create proper policy for agents to send messages only to their assigned sessions
CREATE POLICY "Agents can send messages to assigned sessions"
ON public.guidance_messages
FOR INSERT
WITH CHECK (
  sender_type = 'agent' AND
  EXISTS (
    SELECT 1 FROM public.guidance_sessions gs
    JOIN public.admin_agents aa ON aa.id = gs.assigned_agent_id
    WHERE gs.id = guidance_messages.session_id
    AND aa.user_id = auth.uid()
  )
);