-- =============================================
-- BATCH 7: MORE TABLES AND COLUMNS
-- =============================================

-- Add more columns to signals
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS experts_count INTEGER DEFAULT 0;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS trade_type TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add breakeven to signal_outcome enum
ALTER TYPE public.signal_outcome ADD VALUE IF NOT EXISTS 'breakeven';

-- Add more columns to agent_stats
ALTER TABLE public.agent_stats ADD COLUMN IF NOT EXISTS winning_signals INTEGER DEFAULT 0;
ALTER TABLE public.agent_stats ADD COLUMN IF NOT EXISTS losing_signals INTEGER DEFAULT 0;
ALTER TABLE public.agent_stats ADD COLUMN IF NOT EXISTS breakeven_signals INTEGER DEFAULT 0;
ALTER TABLE public.agent_stats ADD COLUMN IF NOT EXISTS total_signals_posted INTEGER DEFAULT 0;

-- Add more columns to signals for VIP
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS vip_notes TEXT;

-- Agent clients
CREATE TABLE public.agent_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT UNIQUE,
  phone TEXT,
  company TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their clients" ON public.agent_clients FOR ALL USING (agent_id IN (SELECT id FROM public.admin_agents WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all clients" ON public.agent_clients FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User prop accounts
CREATE TABLE public.user_prop_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_label TEXT,
  prop_firm_name TEXT,
  account_number TEXT,
  starting_balance NUMERIC NOT NULL DEFAULT 0,
  current_equity NUMERIC DEFAULT 0,
  profit_target_pct NUMERIC DEFAULT 10,
  daily_dd_limit_pct NUMERIC DEFAULT 5,
  max_dd_limit_pct NUMERIC DEFAULT 10,
  phase TEXT DEFAULT 'phase1',
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_prop_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their prop accounts" ON public.user_prop_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all prop accounts" ON public.user_prop_accounts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_prop_accounts_updated_at BEFORE UPDATE ON public.user_prop_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage achievements" ON public.user_achievements FOR ALL USING (true);

-- User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier TEXT DEFAULT 'bronze',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage badges" ON public.user_badges FOR ALL USING (true);
CREATE POLICY "Anyone can view badges" ON public.user_badges FOR SELECT USING (true);

-- Customer queries
CREATE TABLE public.customer_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  query TEXT NOT NULL,
  category TEXT,
  ai_response TEXT,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open',
  escalated_to TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_notes TEXT,
  admin_response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  satisfaction_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customer queries" ON public.customer_queries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages customer queries" ON public.customer_queries FOR ALL USING (true);

CREATE OR REPLACE FUNCTION generate_query_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.query_number := 'QRY-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_query_number
  BEFORE INSERT ON public.customer_queries
  FOR EACH ROW
  WHEN (NEW.query_number IS NULL)
  EXECUTE FUNCTION generate_query_number();

CREATE TRIGGER update_customer_queries_updated_at BEFORE UPDATE ON public.customer_queries FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

-- Marketing tasks
CREATE TABLE public.marketing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  source TEXT,
  source_reference TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketing_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tasks" ON public.marketing_tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages tasks" ON public.marketing_tasks FOR ALL USING (true);

CREATE TRIGGER update_marketing_tasks_updated_at BEFORE UPDATE ON public.marketing_tasks FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

-- Marketing emails
CREATE TABLE public.marketing_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'draft',
  from_email TEXT,
  to_email TEXT,
  cc_emails TEXT[],
  subject TEXT,
  body TEXT,
  ai_draft TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketing_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage emails" ON public.marketing_emails FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages emails" ON public.marketing_emails FOR ALL USING (true);

CREATE TRIGGER update_marketing_emails_updated_at BEFORE UPDATE ON public.marketing_emails FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

-- Marketing meeting notes
CREATE TABLE public.marketing_meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_title TEXT NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE,
  attendees TEXT[],
  transcript TEXT,
  ai_summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  key_decisions JSONB DEFAULT '[]'::jsonb,
  follow_ups JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketing_meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meeting notes" ON public.marketing_meeting_notes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages meeting notes" ON public.marketing_meeting_notes FOR ALL USING (true);

CREATE TRIGGER update_marketing_meeting_notes_updated_at BEFORE UPDATE ON public.marketing_meeting_notes FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

-- Marketing reports
CREATE TABLE public.marketing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  category TEXT,
  data JSONB NOT NULL,
  insights JSONB,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reports" ON public.marketing_reports FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages reports" ON public.marketing_reports FOR ALL USING (true);