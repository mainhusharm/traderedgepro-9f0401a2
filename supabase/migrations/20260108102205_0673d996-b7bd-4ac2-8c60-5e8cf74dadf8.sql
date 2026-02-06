-- Create admin_broadcasts table for in-app notification broadcasts
CREATE TABLE public.admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'announcement',
  target_plans TEXT[] DEFAULT '{}',
  target_user_ids UUID[] DEFAULT NULL,
  sent_by UUID,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  total_recipients INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage broadcasts
CREATE POLICY "Admins can manage broadcasts"
  ON public.admin_broadcasts
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create email_campaigns table
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  target_plans TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email campaigns
CREATE POLICY "Admins can manage email campaigns"
  ON public.email_campaigns
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create email_campaign_recipients table
CREATE TABLE public.email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT NOT NULL,
  first_name TEXT,
  plan_name TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Only admins can view campaign recipients
CREATE POLICY "Admins can manage campaign recipients"
  ON public.email_campaign_recipients
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on email_campaigns
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();