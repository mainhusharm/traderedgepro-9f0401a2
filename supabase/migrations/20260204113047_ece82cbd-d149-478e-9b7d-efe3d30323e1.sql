-- =============================================
-- BATCH 6: AGENT PAYMENT, SALARIES, SIGNAL MANAGEMENT, MARKETING TABLES
-- =============================================

-- Agent payment methods
CREATE TABLE public.agent_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage own payment methods" ON public.agent_payment_methods FOR ALL USING (agent_id IN (SELECT id FROM public.admin_agents WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage payment methods" ON public.agent_payment_methods FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Agent salaries
CREATE TABLE public.agent_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_method_requested TEXT,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own salaries" ON public.agent_salaries FOR SELECT USING (agent_id IN (SELECT id FROM public.admin_agents WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage salaries" ON public.agent_salaries FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Agent signal comments
CREATE TABLE public.agent_signal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_signal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view signal comments" ON public.agent_signal_comments FOR SELECT USING (true);
CREATE POLICY "Agents can add comments" ON public.agent_signal_comments FOR INSERT WITH CHECK (agent_id IN (SELECT id FROM public.admin_agents WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage comments" ON public.agent_signal_comments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add columns to signals for agent management
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.admin_agents(id);
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS agent_notes TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS auto_vip_reason TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add columns to daily_social_signal_posts
ALTER TABLE public.daily_social_signal_posts ADD COLUMN IF NOT EXISTS confluence_score INTEGER DEFAULT 0;
ALTER TABLE public.daily_social_signal_posts ADD COLUMN IF NOT EXISTS direction TEXT;
ALTER TABLE public.daily_social_signal_posts ADD COLUMN IF NOT EXISTS success BOOLEAN;

-- Agent sessions
CREATE TABLE public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own sessions" ON public.agent_sessions FOR SELECT USING (agent_id IN (SELECT id FROM public.admin_agents WHERE user_id = auth.uid()));
CREATE POLICY "Service can manage sessions" ON public.agent_sessions FOR ALL USING (true);

-- Client sessions
CREATE TABLE public.client_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage client sessions" ON public.client_sessions FOR ALL USING (true);

-- Manager sessions
CREATE TABLE public.manager_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.manager_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view own sessions" ON public.manager_sessions FOR SELECT USING (manager_id IN (SELECT id FROM public.managers WHERE user_id = auth.uid()));
CREATE POLICY "Service can manage manager sessions" ON public.manager_sessions FOR ALL USING (true);

-- Marketing updated_at function
CREATE OR REPLACE FUNCTION update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Marketing sessions
CREATE TABLE public.marketing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.marketing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages marketing sessions" ON public.marketing_sessions FOR ALL USING (true);

-- Marketing AI conversations
CREATE TABLE public.marketing_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_type TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  session_id UUID REFERENCES public.marketing_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketing_ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages AI conversations" ON public.marketing_ai_conversations FOR ALL USING (true);

CREATE TRIGGER update_marketing_ai_conversations_updated_at BEFORE UPDATE ON public.marketing_ai_conversations FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

-- Marketing blog posts
CREATE TABLE public.marketing_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  excerpt TEXT,
  seo_keywords TEXT[],
  meta_description TEXT,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  ai_generated BOOLEAN DEFAULT true,
  author_name TEXT DEFAULT 'Marketing AI',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketing_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blog posts" ON public.marketing_blog_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages blog posts" ON public.marketing_blog_posts FOR ALL USING (true);
CREATE POLICY "Public can view published posts" ON public.marketing_blog_posts FOR SELECT USING (status = 'published');

CREATE TRIGGER update_marketing_blog_posts_updated_at BEFORE UPDATE ON public.marketing_blog_posts FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

-- Marketing leads
CREATE TABLE public.marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT,
  lead_type TEXT DEFAULT 'prop_firm',
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'new',
  score INTEGER DEFAULT 0,
  notes JSONB DEFAULT '[]'::jsonb,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leads" ON public.marketing_leads FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages leads" ON public.marketing_leads FOR ALL USING (true);

CREATE TRIGGER update_marketing_leads_updated_at BEFORE UPDATE ON public.marketing_leads FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();