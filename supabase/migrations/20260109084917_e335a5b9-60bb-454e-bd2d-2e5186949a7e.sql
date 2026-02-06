-- Marketing AI Conversations (chat history for each AI employee)
CREATE TABLE public.marketing_ai_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL, -- aria, blake, nova, sage, maya, zoe, lexi
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketing Leads (BLAKE's lead pipeline)
CREATE TABLE public.marketing_leads_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, qualified, negotiating, won, lost
  score INTEGER DEFAULT 0,
  source TEXT, -- LinkedIn, Website, Referral, Cold Outreach, Conference
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketing Blog Posts (SAGE's content)
CREATE TABLE public.marketing_blog_posts_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published
  seo_score INTEGER DEFAULT 0,
  target_keyword TEXT,
  meta_description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketing Social Posts (MAYA's social media)
CREATE TABLE public.marketing_social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  platforms TEXT[] DEFAULT '{}', -- twitter, instagram, linkedin, youtube
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketing Support Tickets (ZOE's customer support)
CREATE TABLE public.marketing_support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  subject TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  status TEXT NOT NULL DEFAULT 'open', -- open, ai_handling, in_progress, escalated, resolved
  ai_confidence INTEGER DEFAULT 0,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketing Compliance Reviews (LEXI's compliance)
CREATE TABLE public.marketing_compliance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- blog, social, email, landing_page
  content_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, flagged, rejected
  issues TEXT[],
  reviewer_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketing Tasks (ARIA's task management)
CREATE TABLE public.marketing_tasks_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT, -- AI employee id
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_marketing_ai_chats_updated_at BEFORE UPDATE ON public.marketing_ai_chats FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_marketing_leads_v2_updated_at BEFORE UPDATE ON public.marketing_leads_v2 FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_marketing_blog_posts_v2_updated_at BEFORE UPDATE ON public.marketing_blog_posts_v2 FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_marketing_social_posts_updated_at BEFORE UPDATE ON public.marketing_social_posts FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_marketing_support_tickets_updated_at BEFORE UPDATE ON public.marketing_support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_marketing_compliance_reviews_updated_at BEFORE UPDATE ON public.marketing_compliance_reviews FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_marketing_tasks_v2_updated_at BEFORE UPDATE ON public.marketing_tasks_v2 FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();

-- Enable RLS but allow all access (marketing dashboard is MPIN protected)
ALTER TABLE public.marketing_ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_leads_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_blog_posts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_compliance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_tasks_v2 ENABLE ROW LEVEL SECURITY;

-- Allow all operations (protected by MPIN at app level)
CREATE POLICY "Allow all for marketing_ai_chats" ON public.marketing_ai_chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for marketing_leads_v2" ON public.marketing_leads_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for marketing_blog_posts_v2" ON public.marketing_blog_posts_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for marketing_social_posts" ON public.marketing_social_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for marketing_support_tickets" ON public.marketing_support_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for marketing_compliance_reviews" ON public.marketing_compliance_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for marketing_tasks_v2" ON public.marketing_tasks_v2 FOR ALL USING (true) WITH CHECK (true);

-- Insert some initial seed data
INSERT INTO public.marketing_leads_v2 (company_name, contact_name, email, status, score, source) VALUES
('Alpha Traders Prop', 'John Mitchell', 'john@alphatraders.com', 'qualified', 85, 'LinkedIn'),
('FundedNext', 'Sarah Chen', 'sarah@fundednext.com', 'contacted', 72, 'Website'),
('The Funded Hub', 'Mike Roberts', 'mike@fundedhub.com', 'negotiating', 90, 'Referral');

INSERT INTO public.marketing_blog_posts_v2 (title, status, seo_score, target_keyword, views) VALUES
('10 Risk Management Strategies for Prop Traders', 'published', 87, 'prop trading risk management', 2340),
('Understanding Prop Firm Drawdown Rules', 'draft', 65, 'prop firm drawdown', 0),
('Best Forex Pairs for Prop Trading in 2025', 'scheduled', 78, 'forex prop trading', 0);

INSERT INTO public.marketing_support_tickets (ticket_number, customer_name, customer_email, subject, priority, status, ai_confidence) VALUES
('TKT-001', 'Michael Chen', 'michael@email.com', 'Payment not reflecting', 'high', 'in_progress', 85),
('TKT-002', 'Sarah Williams', 'sarah@email.com', 'How to change prop firm?', 'medium', 'ai_handling', 95),
('TKT-003', 'David Kim', 'david@email.com', 'Signal notification issue', 'low', 'ai_handling', 92);