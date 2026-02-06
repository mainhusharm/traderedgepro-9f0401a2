-- Create engagement configuration table
CREATE TABLE public.marketing_engagement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT false,
  mode TEXT DEFAULT 'manual' CHECK (mode IN ('manual', 'scheduled', 'auto')),
  platforms TEXT[] DEFAULT '{"twitter"}',
  keywords TEXT[] DEFAULT '{}',
  brand_mentions TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_start_hour INTEGER DEFAULT 9,
  schedule_end_hour INTEGER DEFAULT 17,
  schedule_days TEXT[] DEFAULT '{"monday","tuesday","wednesday","thursday","friday"}',
  schedule_timezone TEXT DEFAULT 'UTC',
  reply_style TEXT DEFAULT 'friendly' CHECK (reply_style IN ('friendly', 'professional', 'witty', 'empathetic')),
  max_replies_per_hour INTEGER DEFAULT 10,
  auto_like BOOLEAN DEFAULT true,
  auto_reply BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT true,
  instagram_dm_enabled BOOLEAN DEFAULT false,
  instagram_story_enabled BOOLEAN DEFAULT false,
  sentiment_priority BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create engagement queue table
CREATE TABLE public.marketing_engagement_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'linkedin', 'facebook')),
  external_post_id TEXT NOT NULL,
  external_post_url TEXT,
  author_username TEXT,
  author_display_name TEXT,
  author_profile_url TEXT,
  author_followers INTEGER,
  post_content TEXT,
  post_type TEXT DEFAULT 'post' CHECK (post_type IN ('post', 'comment', 'dm', 'story', 'mention')),
  detected_intent TEXT CHECK (detected_intent IN ('question', 'complaint', 'praise', 'curiosity', 'frustration', 'neutral')),
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score NUMERIC(3,2),
  suggested_reply TEXT,
  suggested_reply_style TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'skipped', 'failed')),
  found_via TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create engagement history table
CREATE TABLE public.marketing_engagement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES public.marketing_engagement_queue(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  external_post_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('reply', 'like', 'retweet', 'quote', 'dm', 'story_reaction', 'follow')),
  reply_content TEXT,
  our_post_id TEXT,
  our_post_url TEXT,
  was_auto BOOLEAN DEFAULT false,
  sentiment_at_action TEXT,
  engagement_received JSONB DEFAULT '{"likes": 0, "replies": 0, "retweets": 0}',
  posted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create engagement analytics table
CREATE TABLE public.marketing_engagement_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  platform TEXT NOT NULL,
  total_posts_found INTEGER DEFAULT 0,
  total_replies_sent INTEGER DEFAULT 0,
  total_likes_given INTEGER DEFAULT 0,
  total_dms_sent INTEGER DEFAULT 0,
  total_story_reactions INTEGER DEFAULT 0,
  negative_mentions_handled INTEGER DEFAULT 0,
  avg_sentiment_score NUMERIC(3,2),
  engagement_received JSONB DEFAULT '{"likes": 0, "replies": 0, "follows": 0}',
  best_reply_id UUID REFERENCES public.marketing_engagement_history(id),
  peak_engagement_hour INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, platform)
);

-- Create hourly engagement stats table for optimal timing analysis
CREATE TABLE public.marketing_engagement_hourly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week TEXT NOT NULL,
  platform TEXT NOT NULL,
  total_engagements INTEGER DEFAULT 0,
  avg_response_rate NUMERIC(5,2) DEFAULT 0,
  avg_engagement_received NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hour_of_day, day_of_week, platform)
);

-- Enable RLS
ALTER TABLE public.marketing_engagement_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_engagement_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_engagement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_engagement_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_engagement_hourly_stats ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for marketing dashboard (no auth required for internal tool)
CREATE POLICY "Allow all access to engagement config" ON public.marketing_engagement_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to engagement queue" ON public.marketing_engagement_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to engagement history" ON public.marketing_engagement_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to engagement analytics" ON public.marketing_engagement_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to hourly stats" ON public.marketing_engagement_hourly_stats FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_engagement_config_updated_at
  BEFORE UPDATE ON public.marketing_engagement_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engagement_queue_updated_at
  BEFORE UPDATE ON public.marketing_engagement_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default config
INSERT INTO public.marketing_engagement_config (id, is_active, platforms, keywords)
VALUES (gen_random_uuid(), false, '{"twitter", "instagram"}', '{"trading signals", "prop firm", "forex", "day trading"}');