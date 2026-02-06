-- Add response_sla_hours to white_glove_support_tickets
ALTER TABLE public.white_glove_support_tickets
  ADD COLUMN IF NOT EXISTS response_sla_hours INTEGER DEFAULT 24;

-- Add more columns to prop_firm_rules
ALTER TABLE public.prop_firm_rules
  ADD COLUMN IF NOT EXISTS stop_loss_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_stop_loss_pips INTEGER,
  ADD COLUMN IF NOT EXISTS payout_split NUMERIC DEFAULT 80,
  ADD COLUMN IF NOT EXISTS payout_frequency TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS challenge_duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS profit_split_after_scaling NUMERIC,
  ADD COLUMN IF NOT EXISTS reset_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS account_inactivity_days INTEGER;

-- Add message_type, title, content to signal_messages
ALTER TABLE public.signal_messages
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'message',
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT;

-- Create marketing_ai_chats table
CREATE TABLE IF NOT EXISTS public.marketing_ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT,
  employee_type TEXT,
  messages JSONB DEFAULT '[]',
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert for marketing ai chats" ON public.marketing_ai_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select for marketing ai chats" ON public.marketing_ai_chats FOR SELECT USING (true);
CREATE POLICY "Public update for marketing ai chats" ON public.marketing_ai_chats FOR UPDATE USING (true);

-- Create marketing_ai_automation table
CREATE TABLE IF NOT EXISTS public.marketing_ai_automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT,
  agent_name TEXT,
  is_active BOOLEAN DEFAULT false,
  interval_minutes INTEGER DEFAULT 60,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  config JSONB,
  results JSONB,
  error_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_ai_automation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for marketing automation" ON public.marketing_ai_automation FOR ALL USING (true);

-- Create user_activity_log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  activity_type TEXT,
  page TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own activity" ON public.user_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own activity" ON public.user_activity_log FOR SELECT USING (auth.uid() = user_id);

-- Add columns to profiles for activity tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS signals_received_count INTEGER DEFAULT 0;