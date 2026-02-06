-- Create agent_sessions table for OTP-based agent authentication
CREATE TABLE public.agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES admin_agents(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_activity_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage sessions (via edge functions)
CREATE POLICY "Service role can manage agent sessions"
ON public.agent_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create agent_clients table for client sub-dashboards
CREATE TABLE public.agent_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES admin_agents(id) ON DELETE CASCADE,
  name text,
  email text NOT NULL,
  access_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invite_sent_at timestamptz,
  invite_accepted_at timestamptz,
  status text DEFAULT 'pending',
  permissions jsonb DEFAULT '{"can_view_journal": true, "can_view_signals": true, "can_view_performance": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_clients ENABLE ROW LEVEL SECURITY;

-- Agents can manage their own clients
CREATE POLICY "Agents can view own clients"
ON public.agent_clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_agents
    WHERE admin_agents.id = agent_clients.agent_id
    AND admin_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can insert own clients"
ON public.agent_clients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_agents
    WHERE admin_agents.id = agent_clients.agent_id
    AND admin_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can update own clients"
ON public.agent_clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_agents
    WHERE admin_agents.id = agent_clients.agent_id
    AND admin_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can delete own clients"
ON public.agent_clients
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_agents
    WHERE admin_agents.id = agent_clients.agent_id
    AND admin_agents.user_id = auth.uid()
  )
);

-- Admins can manage all clients
CREATE POLICY "Admins can manage all clients"
ON public.agent_clients
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create client_sessions table
CREATE TABLE public.client_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES agent_clients(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Enable RLS
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role can manage client sessions"
ON public.client_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger to update updated_at
CREATE TRIGGER update_agent_clients_updated_at
BEFORE UPDATE ON public.agent_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_clients;