-- First, drop existing policies on admin_agents
DROP POLICY IF EXISTS "Admins can manage agents" ON public.admin_agents;
DROP POLICY IF EXISTS "Agents can update their online status" ON public.admin_agents;
DROP POLICY IF EXISTS "Agents can view their own record" ON public.admin_agents;

-- Create proper policies for admin_agents
-- Admins (with admin role) can do everything
CREATE POLICY "Admins can manage agents"
ON public.admin_agents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Active agents can view their own record by matching their email
CREATE POLICY "Agents can view own record by email"
ON public.admin_agents
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Active agents can update their own status (online status, last_seen)
CREATE POLICY "Agents can update own status by email"
ON public.admin_agents
FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow service role to manage agents (for edge functions)
-- Note: Service role bypasses RLS, so this is implicit