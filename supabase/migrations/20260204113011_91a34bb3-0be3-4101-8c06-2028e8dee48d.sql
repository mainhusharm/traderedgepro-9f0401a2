-- =============================================
-- BATCH 5: PROP FIRMS, MANAGERS, AGENT STATS, PUSH SUBSCRIPTIONS
-- =============================================

-- Prop firms
CREATE TABLE public.prop_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  scrape_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prop_firms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prop firms" ON public.prop_firms FOR SELECT USING (true);
CREATE POLICY "Admins can manage prop firms" ON public.prop_firms FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_prop_firms_updated_at BEFORE UPDATE ON public.prop_firms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prop firm rules
CREATE TABLE public.prop_firm_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prop_firm_id UUID REFERENCES public.prop_firms(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL,
  account_sizes JSONB DEFAULT '[]',
  max_daily_loss_percent NUMERIC,
  max_total_drawdown_percent NUMERIC,
  profit_target_percent NUMERIC,
  min_trading_days INTEGER,
  max_trading_days INTEGER,
  news_trading_allowed BOOLEAN,
  weekend_holding_allowed BOOLEAN,
  ea_allowed BOOLEAN,
  copy_trading_allowed BOOLEAN,
  scaling_plan JSONB,
  additional_rules JSONB DEFAULT '[]',
  raw_content TEXT,
  source_url TEXT,
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prop_firm_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prop firm rules" ON public.prop_firm_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage prop firm rules" ON public.prop_firm_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_prop_firm_rules_updated_at BEFORE UPDATE ON public.prop_firm_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prop firm rule changes
CREATE TABLE public.prop_firm_rule_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prop_firm_id UUID REFERENCES public.prop_firms(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prop_firm_rule_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rule changes" ON public.prop_firm_rule_changes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage rule changes" ON public.prop_firm_rule_changes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Managers
CREATE TABLE public.managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view their own record" ON public.managers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can update their record" ON public.managers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage managers" ON public.managers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view managers" ON public.managers FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.managers;

-- Manager agent messages
CREATE TABLE public.manager_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'manager')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.manager_agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view their messages" ON public.manager_agent_messages FOR SELECT USING (manager_id IN (SELECT id FROM public.managers WHERE user_id = auth.uid()));
CREATE POLICY "Agents can view their messages" ON public.manager_agent_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON public.manager_agent_messages FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.manager_agent_messages;

-- Agent stats
CREATE TABLE public.agent_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  signals_reviewed INTEGER DEFAULT 0,
  signals_approved INTEGER DEFAULT 0,
  signals_rejected INTEGER DEFAULT 0,
  chats_handled INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id)
);

ALTER TABLE public.agent_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own stats" ON public.agent_stats FOR SELECT USING (agent_id IN (SELECT id FROM public.admin_agents WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage agent stats" ON public.agent_stats FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service can upsert stats" ON public.agent_stats FOR ALL USING (true);

-- Push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service can manage subscriptions" ON public.push_subscriptions FOR ALL USING (true);

-- Institutional signals
CREATE TABLE public.institutional_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  confidence_score INTEGER DEFAULT 75,
  ai_reasoning TEXT,
  category TEXT DEFAULT 'forex',
  status TEXT DEFAULT 'active',
  outcome TEXT DEFAULT 'pending',
  pnl NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.institutional_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view institutional signals" ON public.institutional_signals FOR SELECT USING (true);
CREATE POLICY "Admins can manage institutional signals" ON public.institutional_signals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.institutional_signals;

-- Daily social signal posts
CREATE TABLE public.daily_social_signal_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_date DATE NOT NULL,
  platform TEXT NOT NULL,
  signal_id UUID,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  entry_price NUMERIC,
  confidence_score INTEGER,
  post_content TEXT,
  image_url TEXT,
  posted BOOLEAN DEFAULT false,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_social_signal_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social posts" ON public.daily_social_signal_posts FOR SELECT USING (true);
CREATE POLICY "Admins can manage social posts" ON public.daily_social_signal_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service can manage social posts" ON public.daily_social_signal_posts FOR ALL USING (true);