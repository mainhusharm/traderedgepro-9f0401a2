-- Allow agents to view all other agents for team overview
CREATE POLICY "Agents can view all agents" 
ON public.admin_agents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_agents aa 
    WHERE aa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND aa.status = 'active'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Drop the more restrictive policy since the new one covers it
DROP POLICY IF EXISTS "Agents can view own record by email" ON public.admin_agents;