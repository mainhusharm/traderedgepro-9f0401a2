-- Add tracking columns to institutional_signals for social media posting
ALTER TABLE public.institutional_signals 
ADD COLUMN IF NOT EXISTS posted_to_discord BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS posted_to_discord_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS posted_to_twitter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS posted_to_twitter_at TIMESTAMPTZ;

-- Create table to log daily social signal posts for analytics
CREATE TABLE IF NOT EXISTS public.daily_social_signal_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_date DATE NOT NULL DEFAULT CURRENT_DATE,
  platform TEXT NOT NULL CHECK (platform IN ('discord', 'twitter')),
  signal_id UUID REFERENCES public.institutional_signals(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  confluence_score INTEGER NOT NULL,
  direction TEXT NOT NULL,
  entry_price NUMERIC,
  posted_at TIMESTAMPTZ DEFAULT now(),
  post_content TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  tweet_id TEXT,
  UNIQUE(post_date, platform, signal_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_social_posts_date ON public.daily_social_signal_posts(post_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_social_posts_platform ON public.daily_social_signal_posts(platform);
CREATE INDEX IF NOT EXISTS idx_institutional_signals_social ON public.institutional_signals(posted_to_discord, posted_to_twitter);

-- Enable RLS
ALTER TABLE public.daily_social_signal_posts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to view/manage social posts (using service role for edge functions)
CREATE POLICY "Service role can manage daily_social_signal_posts"
ON public.daily_social_signal_posts
FOR ALL
USING (true)
WITH CHECK (true);