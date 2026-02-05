-- Add INSERT policy for users to create notifications (for admin service role usage)
CREATE POLICY "Allow insert for authenticated users" ON public.mt5_notifications
  FOR INSERT WITH CHECK (true);