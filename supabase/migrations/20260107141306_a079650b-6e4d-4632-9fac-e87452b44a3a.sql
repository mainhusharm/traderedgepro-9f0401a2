-- Add email column to mt5_users for easier notification access
ALTER TABLE public.mt5_users ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_mt5_users_email ON public.mt5_users(email);

-- Create kickstarter_verifications table for affiliate screenshot submissions
CREATE TABLE IF NOT EXISTS public.kickstarter_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  affiliate_partner TEXT NOT NULL,
  screenshot_url TEXT,
  promo_code TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  access_granted BOOLEAN DEFAULT false,
  access_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on kickstarter_verifications
ALTER TABLE public.kickstarter_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verifications
CREATE POLICY "Users can view own verifications" ON public.kickstarter_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own verifications  
CREATE POLICY "Users can submit verifications" ON public.kickstarter_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications" ON public.kickstarter_verifications
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update verifications
CREATE POLICY "Admins can update verifications" ON public.kickstarter_verifications
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for kickstarter screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kickstarter-screenshots', 'kickstarter-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kickstarter screenshots
CREATE POLICY "Users can upload kickstarter screenshots" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kickstarter-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view kickstarter screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'kickstarter-screenshots');