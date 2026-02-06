-- Create managers table
CREATE TABLE public.managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '{"can_manage_agents": true, "can_view_performance": true, "can_manage_schedules": true, "can_review_signals": true, "can_manage_guidance": true, "can_send_broadcasts": true, "can_direct_message": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

-- Create manager sessions table
CREATE TABLE public.manager_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Create manager announcements table
CREATE TABLE public.manager_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  target_agents UUID[] DEFAULT '{}',
  is_read_by JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create manager-agent direct messages table
CREATE TABLE public.manager_agent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('manager', 'agent')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_agent_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for managers (service role access only for auth)
CREATE POLICY "Service role full access to managers"
ON public.managers
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to manager_sessions"
ON public.manager_sessions
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to manager_announcements"
ON public.manager_announcements
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to manager_agent_messages"
ON public.manager_agent_messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_manager_sessions_token ON public.manager_sessions(session_token);
CREATE INDEX idx_manager_sessions_expires ON public.manager_sessions(expires_at);
CREATE INDEX idx_manager_agent_messages_manager ON public.manager_agent_messages(manager_id);
CREATE INDEX idx_manager_agent_messages_agent ON public.manager_agent_messages(agent_id);
CREATE INDEX idx_manager_announcements_manager ON public.manager_announcements(manager_id);

-- Trigger for updated_at
CREATE TRIGGER update_managers_updated_at
BEFORE UPDATE ON public.managers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();