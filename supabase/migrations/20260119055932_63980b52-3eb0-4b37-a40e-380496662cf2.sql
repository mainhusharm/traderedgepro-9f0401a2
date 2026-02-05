-- Add new columns to bot_status for signal broadcasting control
ALTER TABLE public.bot_status 
  ADD COLUMN IF NOT EXISTS send_to_users_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS send_to_agents_enabled BOOLEAN DEFAULT false;

-- Add column to institutional_signals to track if sent to agents for review
ALTER TABLE public.institutional_signals 
  ADD COLUMN IF NOT EXISTS sent_to_agents BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sent_to_agents_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agent_reviewed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by_agent_id UUID REFERENCES public.admin_agents(id),
  ADD COLUMN IF NOT EXISTS agent_review_notes TEXT,
  ADD COLUMN IF NOT EXISTS agent_approved BOOLEAN;