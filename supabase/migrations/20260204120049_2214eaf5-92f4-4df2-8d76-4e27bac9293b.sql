-- Add more columns to user_personal_accounts
ALTER TABLE public.user_personal_accounts
  ADD COLUMN IF NOT EXISTS leverage INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS risk_per_trade_pct NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS daily_loss_limit_pct NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS monthly_income_goal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_pairs TEXT[],
  ADD COLUMN IF NOT EXISTS trading_session TEXT;

-- Add pnl to user_signal_actions
ALTER TABLE public.user_signal_actions
  ADD COLUMN IF NOT EXISTS pnl NUMERIC;

-- Add take_profit columns to institutional_signals
ALTER TABLE public.institutional_signals
  ADD COLUMN IF NOT EXISTS take_profit_1 NUMERIC,
  ADD COLUMN IF NOT EXISTS take_profit_2 NUMERIC,
  ADD COLUMN IF NOT EXISTS take_profit_3 NUMERIC;

-- Add is_trial and trial_coupon_code to memberships
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_coupon_code TEXT;

-- Add preferred_dashboard_mode to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_dashboard_mode TEXT DEFAULT 'prop';

-- Create kickstarter_verifications table
CREATE TABLE IF NOT EXISTS public.kickstarter_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.kickstarter_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own verifications" ON public.kickstarter_verifications FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Create push_notification_logs table
CREATE TABLE IF NOT EXISTS public.push_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  notification_type TEXT,
  title TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own push logs" ON public.push_notification_logs FOR SELECT USING (auth.uid() = user_id);