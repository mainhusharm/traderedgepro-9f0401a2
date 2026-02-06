-- Drop existing SELECT policy for signals
DROP POLICY IF EXISTS "Users can view public signals" ON public.signals;

-- Create new SELECT policy that allows admins to see all signals
CREATE POLICY "Users can view public signals or admins all" 
ON public.signals 
FOR SELECT 
USING (
  (is_public = true) 
  OR (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
);