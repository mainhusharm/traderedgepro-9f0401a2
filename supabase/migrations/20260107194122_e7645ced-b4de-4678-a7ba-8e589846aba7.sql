-- Add policy for agents to send messages (without requiring auth)
-- This allows the agent portal (PIN-authenticated) to send messages
CREATE POLICY "Allow agent messages"
  ON public.guidance_messages
  FOR INSERT
  WITH CHECK (sender_type = 'agent');

-- Add policy for agents to view all messages
CREATE POLICY "Allow agent to view all messages"
  ON public.guidance_messages
  FOR SELECT
  USING (sender_type = 'agent' OR true);

-- Add policy for agents to update messages
CREATE POLICY "Allow agent to update messages"
  ON public.guidance_messages
  FOR UPDATE
  USING (true);