-- =============================================
-- BATCH 3: AI, GUIDANCE, AGENTS TABLES
-- =============================================

-- AI conversations
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  is_pinned boolean DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_pinned_date ON public.ai_conversations (user_id, is_pinned DESC, updated_at DESC);

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI messages
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON public.ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own messages" ON public.ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- OTP verifications
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create OTP verification" ON public.otp_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read OTP for verification" ON public.otp_verifications FOR SELECT USING (true);
CREATE POLICY "Anyone can update OTP verification" ON public.otp_verifications FOR UPDATE USING (true);

CREATE INDEX idx_otp_verifications_email ON public.otp_verifications(email);

-- Admin agents
CREATE TABLE public.admin_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '{"can_chat": true, "can_schedule": true, "can_view_all_sessions": false}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agents" ON public.admin_agents FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can view their own record" ON public.admin_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Agents can update their online status" ON public.admin_agents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view agents for booking" ON public.admin_agents FOR SELECT USING (true);

CREATE TRIGGER update_admin_agents_updated_at BEFORE UPDATE ON public.admin_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_agents;

-- Guidance sessions
CREATE TABLE public.guidance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_number TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  preferred_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_id UUID,
  assigned_agent_id UUID REFERENCES public.admin_agents(id),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guidance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.guidance_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.guidance_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.guidance_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all sessions" ON public.guidance_sessions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_guidance_sessions_updated_at BEFORE UPDATE ON public.guidance_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guidance messages
CREATE TABLE public.guidance_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.guidance_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guidance_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their sessions" ON public.guidance_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.guidance_sessions WHERE guidance_sessions.id = guidance_messages.session_id AND guidance_sessions.user_id = auth.uid()));
CREATE POLICY "Users can send messages for their sessions" ON public.guidance_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.guidance_sessions WHERE guidance_sessions.id = guidance_messages.session_id AND guidance_sessions.user_id = auth.uid()));
CREATE POLICY "Admins can view all messages" ON public.guidance_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can send messages" ON public.guidance_messages FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Allow agent messages" ON public.guidance_messages FOR INSERT WITH CHECK (sender_type = 'agent');
CREATE POLICY "Allow agent to view all messages" ON public.guidance_messages FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.guidance_messages;

-- User consents
CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  risk_disclosure_accepted BOOLEAN NOT NULL DEFAULT false,
  electronic_signature_accepted BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent" ON public.user_consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own consent" ON public.user_consents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all consents" ON public.user_consents FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_consents_updated_at BEFORE UPDATE ON public.user_consents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agent availability
CREATE TABLE public.agent_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, day_of_week)
);

ALTER TABLE public.agent_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent availability" ON public.agent_availability FOR SELECT USING (true);
CREATE POLICY "Agents can manage own availability" ON public.agent_availability FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_availability;