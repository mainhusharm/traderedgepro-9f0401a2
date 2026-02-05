-- Add missing columns for fixes

-- Add status column to managers table
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add missing columns to agent_clients
ALTER TABLE public.agent_clients ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;
ALTER TABLE public.agent_clients ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMPTZ;
ALTER TABLE public.agent_clients ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"can_view_journal": true, "can_view_signals": true, "can_view_performance": true}'::jsonb;

-- Add missing columns to institutional_signals
ALTER TABLE public.institutional_signals ADD COLUMN IF NOT EXISTS confluence_score INTEGER DEFAULT 0;
ALTER TABLE public.institutional_signals ADD COLUMN IF NOT EXISTS agent_approved BOOLEAN DEFAULT false;
ALTER TABLE public.institutional_signals ADD COLUMN IF NOT EXISTS posted_to_discord BOOLEAN DEFAULT false;
ALTER TABLE public.institutional_signals ADD COLUMN IF NOT EXISTS posted_to_twitter BOOLEAN DEFAULT false;
ALTER TABLE public.institutional_signals ADD COLUMN IF NOT EXISTS direction TEXT;

-- Add missing columns to daily_social_signal_posts
ALTER TABLE public.daily_social_signal_posts ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.daily_social_signal_posts ADD COLUMN IF NOT EXISTS tweet_id TEXT;

-- Add missing columns to signals table for VIP functionality
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS vip_notes TEXT;

-- Make sure reviewed_by column exists and is TEXT array
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signals' 
    AND column_name = 'reviewed_by' 
    AND data_type = 'text'
    AND is_nullable = 'YES'
    AND character_maximum_length IS NULL
  ) THEN
    -- Column exists as TEXT, need to convert to TEXT[]
    ALTER TABLE public.signals DROP COLUMN reviewed_by;
    ALTER TABLE public.signals ADD COLUMN reviewed_by TEXT[] DEFAULT '{}';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signals' 
    AND column_name = 'reviewed_by'
  ) THEN
    -- Column doesn't exist, add it as TEXT[]
    ALTER TABLE public.signals ADD COLUMN reviewed_by TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- trade_daily_stats table for recent performance tracking
CREATE TABLE IF NOT EXISTS public.trade_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  date DATE NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_pnl NUMERIC DEFAULT 0,
  consecutive_wins INTEGER DEFAULT 0,
  consecutive_losses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trade_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade stats" ON public.trade_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage trade stats" ON public.trade_daily_stats
  FOR ALL USING (true);