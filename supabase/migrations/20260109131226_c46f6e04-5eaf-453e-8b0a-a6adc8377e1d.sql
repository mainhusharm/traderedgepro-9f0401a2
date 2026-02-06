-- Add columns for AI-created tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'web_form',
ADD COLUMN IF NOT EXISTS agent_name text;

-- Allow service role to insert tickets (for AI chat)
-- The existing RLS policies should already allow service role access
-- Let's add a policy for public ticket creation (anonymous users via AI chat)
CREATE POLICY "Allow service role to insert tickets" 
ON public.support_tickets 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Update index for faster queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_source ON public.support_tickets(source);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);