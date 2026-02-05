-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.mt5_notifications;

-- Create a more secure insert policy - only authenticated users can insert
CREATE POLICY "Authenticated users can create notifications" ON public.mt5_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);