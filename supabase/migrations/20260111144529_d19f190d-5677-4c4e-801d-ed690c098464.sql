-- Fix infinite recursion in admin_agents SELECT policy by moving checks into a SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.is_active_agent(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_agents aa
    JOIN auth.users u ON u.email = aa.email
    WHERE u.id = _uid
      AND aa.status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Agents can view all agents" ON public.admin_agents;

CREATE POLICY "Agents can view all agents"
ON public.admin_agents
FOR SELECT
USING (
  public.is_active_agent(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);