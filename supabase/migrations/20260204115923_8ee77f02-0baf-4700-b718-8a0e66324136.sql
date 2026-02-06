-- Add first_response_at to white_glove_support_tickets
ALTER TABLE public.white_glove_support_tickets
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;

-- Add more columns to prop_firm_rules
ALTER TABLE public.prop_firm_rules
  ADD COLUMN IF NOT EXISTS first_payout_delay INTEGER,
  ADD COLUMN IF NOT EXISTS inactivity_rule_days INTEGER,
  ADD COLUMN IF NOT EXISTS prohibited_instruments TEXT[],
  ADD COLUMN IF NOT EXISTS prohibited_strategies TEXT[];

-- Add columns to marketing_ai_automation that interface expects
ALTER TABLE public.marketing_ai_automation
  ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS total_runs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_runs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_runs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS automation_type TEXT;

-- Add prop_firm to prop_firm_rule_acknowledgments
ALTER TABLE public.prop_firm_rule_acknowledgments
  ADD COLUMN IF NOT EXISTS prop_firm TEXT;

-- Create marketing_leads_v2 table
CREATE TABLE IF NOT EXISTS public.marketing_leads_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  company TEXT,
  phone TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  score INTEGER DEFAULT 0,
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_leads_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to marketing leads v2" ON public.marketing_leads_v2 FOR ALL USING (true);

-- Create marketing_blog_posts_v2 table
CREATE TABLE IF NOT EXISTS public.marketing_blog_posts_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft',
  author_name TEXT,
  meta_description TEXT,
  seo_keywords TEXT[],
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_blog_posts_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to marketing blog posts v2" ON public.marketing_blog_posts_v2 FOR ALL USING (true);

-- Create marketing_social_posts table
CREATE TABLE IF NOT EXISTS public.marketing_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  content TEXT,
  media_urls TEXT[],
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  engagement JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to marketing social posts" ON public.marketing_social_posts FOR ALL USING (true);

-- Create marketing_support_tickets table
CREATE TABLE IF NOT EXISTS public.marketing_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  customer_email TEXT,
  customer_name TEXT,
  assigned_to TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to marketing support tickets" ON public.marketing_support_tickets FOR ALL USING (true);