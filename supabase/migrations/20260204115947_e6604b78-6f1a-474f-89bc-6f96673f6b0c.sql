-- Add last_error to marketing_ai_automation
ALTER TABLE public.marketing_ai_automation
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Add columns to marketing_leads_v2
ALTER TABLE public.marketing_leads_v2
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Add columns to marketing_blog_posts_v2
ALTER TABLE public.marketing_blog_posts_v2
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_keyword TEXT,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add columns to marketing_social_posts
ALTER TABLE public.marketing_social_posts
  ADD COLUMN IF NOT EXISTS platforms TEXT[],
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

-- Add columns to marketing_support_tickets
ALTER TABLE public.marketing_support_tickets
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS messages JSONB;

-- Create marketing_compliance_reviews table
CREATE TABLE IF NOT EXISTS public.marketing_compliance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT,
  content_id UUID,
  status TEXT DEFAULT 'pending',
  reviewer_id TEXT,
  reviewer_notes TEXT,
  compliance_score INTEGER DEFAULT 0,
  issues JSONB,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_compliance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to compliance reviews" ON public.marketing_compliance_reviews FOR ALL USING (true);

-- Create marketing_tasks_v2 table
CREATE TABLE IF NOT EXISTS public.marketing_tasks_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  assigned_to TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_tasks_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to marketing tasks v2" ON public.marketing_tasks_v2 FOR ALL USING (true);

-- Create marketing_calendar table
CREATE TABLE IF NOT EXISTS public.marketing_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  color TEXT,
  recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to marketing calendar" ON public.marketing_calendar FOR ALL USING (true);

-- Create marketing_competitors table  
CREATE TABLE IF NOT EXISTS public.marketing_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  market_share NUMERIC,
  pricing_info JSONB,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.marketing_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to marketing competitors" ON public.marketing_competitors FOR ALL USING (true);