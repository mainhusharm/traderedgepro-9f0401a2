-- Create referral clicks tracking table
CREATE TABLE public.referral_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_user_id UUID,
  visitor_ip TEXT,
  visitor_fingerprint TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  converted BOOLEAN DEFAULT false,
  converted_user_id UUID,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_fingerprint ON public.referral_clicks(visitor_fingerprint);

-- Enable RLS
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (for tracking)
CREATE POLICY "Allow public inserts for tracking"
ON public.referral_clicks
FOR INSERT
WITH CHECK (true);

-- Allow users to see their own referral stats
CREATE POLICY "Users can view their referral clicks"
ON public.referral_clicks
FOR SELECT
USING (referrer_user_id = auth.uid());

-- Allow updates for conversion tracking
CREATE POLICY "Allow conversion updates"
ON public.referral_clicks
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable realtime for tracking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_clicks;