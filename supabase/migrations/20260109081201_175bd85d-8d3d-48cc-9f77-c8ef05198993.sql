-- =============================================
-- MARKETING COMMAND CENTER DATABASE SCHEMA
-- =============================================

-- Marketing dashboard sessions (MPIN auth)
CREATE TABLE public.marketing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Marketing AI conversations
CREATE TABLE public.marketing_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_type TEXT NOT NULL, -- 'executive', 'lead_gen', 'receptionist', 'seo', 'social', 'support'
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  session_id UUID REFERENCES public.marketing_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing blog posts (AI generated)
CREATE TABLE public.marketing_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  excerpt TEXT,
  seo_keywords TEXT[],
  meta_description TEXT,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'published'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  ai_generated BOOLEAN DEFAULT true,
  author_name TEXT DEFAULT 'Marketing AI',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing leads
CREATE TABLE public.marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT, -- 'website', 'social', 'referral', 'outreach'
  lead_type TEXT DEFAULT 'prop_firm', -- 'prop_firm', 'trader', 'partner'
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'negotiating', 'converted', 'lost'
  score INTEGER DEFAULT 0,
  notes JSONB DEFAULT '[]'::jsonb,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer queries & escalations
CREATE TABLE public.customer_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  query TEXT NOT NULL,
  category TEXT, -- 'signals', 'pricing', 'prop_firm', 'technical', 'other'
  ai_response TEXT,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open', -- 'open', 'ai_handled', 'escalated', 'resolved'
  escalated_to TEXT, -- 'admin', 'support', 'technical'
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_notes TEXT,
  admin_response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  satisfaction_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing tasks
CREATE TABLE public.marketing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT, -- 'executive', 'seo', 'social', 'lead_gen', 'support'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  source TEXT, -- 'meeting', 'email', 'manual', 'ai_suggestion'
  source_reference TEXT, -- ID of meeting/email that created this task
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing emails
CREATE TABLE public.marketing_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'draft', -- 'inbox', 'draft', 'sent', 'scheduled'
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
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting notes
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
  status TEXT DEFAULT 'draft', -- 'draft', 'finalized'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing reports
CREATE TABLE public.marketing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
  category TEXT, -- 'social', 'leads', 'content', 'customer_support', 'overall'
  data JSONB NOT NULL,
  insights JSONB,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SOCIAL MEDIA TABLES
-- =============================================

-- Social platform connections
CREATE TABLE public.social_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- 'twitter', 'instagram', 'youtube', 'discord', 'telegram', 'linkedin'
  credentials JSONB, -- Encrypted API keys/tokens (stored as secrets, this holds non-sensitive config)
  is_connected BOOLEAN DEFAULT false,
  profile_name TEXT,
  profile_id TEXT,
  profile_url TEXT,
  profile_image_url TEXT,
  followers_count INTEGER,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  connection_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform)
);

-- Social content calendar
CREATE TABLE public.social_content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT DEFAULT 'post', -- 'post', 'thread', 'carousel', 'reel', 'video', 'story'
  media_urls TEXT[],
  platforms TEXT[], -- Which platforms to post to
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'posting', 'posted', 'failed', 'cancelled'
  ai_generated BOOLEAN DEFAULT true,
  hashtags TEXT[],
  mentions TEXT[],
  link_url TEXT,
  campaign_name TEXT,
  engagement_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social post history (per platform)
CREATE TABLE public.social_post_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_calendar_id UUID REFERENCES public.social_content_calendar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_post_id TEXT, -- ID from the platform
  platform_post_url TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT, -- 'success', 'failed', 'deleted'
  engagement JSONB DEFAULT '{}'::jsonb, -- likes, retweets, comments, views
  last_engagement_sync TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social media templates
CREATE TABLE public.social_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- 'education', 'success_story', 'partnership', 'motivation', 'market_update'
  platforms TEXT[],
  content_template TEXT NOT NULL,
  hashtag_suggestions TEXT[],
  media_suggestions TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.marketing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All marketing tables are accessible via service role (edge functions)
-- and by admins directly

-- Marketing sessions - service role only
CREATE POLICY "Service role manages marketing sessions" ON public.marketing_sessions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Marketing AI conversations
CREATE POLICY "Service role manages AI conversations" ON public.marketing_ai_conversations
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Marketing blog posts - admins can view
CREATE POLICY "Admins can manage blog posts" ON public.marketing_blog_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages blog posts" ON public.marketing_blog_posts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Public can view published posts" ON public.marketing_blog_posts
  FOR SELECT USING (status = 'published');

-- Marketing leads
CREATE POLICY "Admins can manage leads" ON public.marketing_leads
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages leads" ON public.marketing_leads
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Customer queries - admins can manage
CREATE POLICY "Admins can manage customer queries" ON public.customer_queries
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages customer queries" ON public.customer_queries
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Marketing tasks
CREATE POLICY "Admins can manage tasks" ON public.marketing_tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages tasks" ON public.marketing_tasks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Marketing emails
CREATE POLICY "Admins can manage emails" ON public.marketing_emails
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages emails" ON public.marketing_emails
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Meeting notes
CREATE POLICY "Admins can manage meeting notes" ON public.marketing_meeting_notes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages meeting notes" ON public.marketing_meeting_notes
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Marketing reports - admins can view
CREATE POLICY "Admins can view reports" ON public.marketing_reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages reports" ON public.marketing_reports
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Social platform connections
CREATE POLICY "Admins can manage platform connections" ON public.social_platform_connections
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages platform connections" ON public.social_platform_connections
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Social content calendar
CREATE POLICY "Admins can manage content calendar" ON public.social_content_calendar
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages content calendar" ON public.social_content_calendar
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Social post history
CREATE POLICY "Admins can view post history" ON public.social_post_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages post history" ON public.social_post_history
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Social content templates
CREATE POLICY "Admins can manage templates" ON public.social_content_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages templates" ON public.social_content_templates
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Create function to generate query number
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

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_marketing_ai_conversations_updated_at
  BEFORE UPDATE ON public.marketing_ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_marketing_blog_posts_updated_at
  BEFORE UPDATE ON public.marketing_blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_marketing_leads_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_customer_queries_updated_at
  BEFORE UPDATE ON public.customer_queries
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_marketing_tasks_updated_at
  BEFORE UPDATE ON public.marketing_tasks
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_marketing_emails_updated_at
  BEFORE UPDATE ON public.marketing_emails
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_marketing_meeting_notes_updated_at
  BEFORE UPDATE ON public.marketing_meeting_notes
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_social_platform_connections_updated_at
  BEFORE UPDATE ON public.social_platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_social_content_calendar_updated_at
  BEFORE UPDATE ON public.social_content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_social_content_templates_updated_at
  BEFORE UPDATE ON public.social_content_templates
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();