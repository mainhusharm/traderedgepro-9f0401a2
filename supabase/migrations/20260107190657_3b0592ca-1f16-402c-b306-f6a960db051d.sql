-- Create admin agents table for invited experts
CREATE TABLE public.admin_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, inactive
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '{"can_chat": true, "can_schedule": true, "can_view_all_sessions": false}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_agents ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_agents
CREATE POLICY "Admins can manage agents"
ON public.admin_agents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their own record"
ON public.admin_agents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Agents can update their online status"
ON public.admin_agents
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add assigned_agent_id to guidance_sessions
ALTER TABLE public.guidance_sessions 
ADD COLUMN assigned_agent_id UUID REFERENCES public.admin_agents(id);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_agents_updated_at
BEFORE UPDATE ON public.admin_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for agent status
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_agents;